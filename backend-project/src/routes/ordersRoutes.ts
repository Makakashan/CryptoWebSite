import express, { Router, Response } from "express";
import { getDB } from "../database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { getCurrentPrice } from "../services/priceService.js";
import {
	AuthRequest,
	User,
	PortfolioAsset,
	CoinGeckoListItem,
	CoinGeckoDetail,
	BinancePriceResponse,
} from "../types/types.js";
import {
	parsePagination,
	validateSortField,
	validateSortOrder,
	parseNumericFilter,
	parseDateFilter,
	buildPaginationResponse,
} from "../utils/helpers.js";
import {
	ALLOWED_ORDER_TYPES,
	ALLOWED_ORDER_SORT_FIELDS,
	mapCoinGeckoCategory,
} from "../utils/constants.js";

const router: Router = express.Router();
const ORDER_EPSILON = 1e-8;
const ORDER_AMOUNT_DECIMALS = 6;

const floorToDecimals = (value: number, decimals = ORDER_AMOUNT_DECIMALS): number => {
	const factor = 10 ** decimals;
	return Math.floor((value + Number.EPSILON) * factor) / factor;
};

async function ensureAssetExists(asset_symbol: string): Promise<void> {
	const db = getDB();

	const existingAsset = await db.get("SELECT * FROM assets WHERE symbol = ?", [asset_symbol]);

	if (existingAsset) {
		return;
	}

	try {
		const binanceResponse = await fetch(
			`https://api.binance.com/api/v3/ticker/price?symbol=${asset_symbol}`,
		);

		if (!binanceResponse.ok) {
			throw new Error(`Asset ${asset_symbol} not found on Binance`);
		}

		let image_url: string | null = null;
		let description: string | null = null;
		let category = "other";

		try {
			const baseAsset = asset_symbol.replace(/USDT$/, "").toLowerCase();

			const coinsListResponse = await fetch(`https://api.coingecko.com/api/v3/coins/list`);

			if (coinsListResponse.ok) {
				const coinsList = (await coinsListResponse.json()) as CoinGeckoListItem[];
				const coin = coinsList.find((c) => c.symbol.toLowerCase() === baseAsset);

				if (coin) {
					const coinDetailResponse = await fetch(
						`https://api.coingecko.com/api/v3/coins/${coin.id}`,
					);

					if (coinDetailResponse.ok) {
						const coinDetail = (await coinDetailResponse.json()) as CoinGeckoDetail;
						image_url = coinDetail.image?.large || coinDetail.image?.small || null;

						// Get description and remove HTML tags
						if (coinDetail.description?.en) {
							description = coinDetail.description.en
								.replace(/<[^>]*>/g, "") // Remove HTML tags
								.substring(0, 500);
						}

						// Map CoinGecko categories to our categories
						category = mapCoinGeckoCategory(coinDetail.categories);
					}
				}
			}
		} catch (error) {
			console.log(`Could not fetch CoinGecko data for ${asset_symbol}:`, error);
			// Continue without CoinGecko data
		}

		await db.run(
			`INSERT INTO assets (symbol, name, image_url, category, description, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
			[asset_symbol, asset_symbol, image_url, category, description, 1],
		);

		console.log(`Auto-created asset: ${asset_symbol} (category: ${category})`);
	} catch (error) {
		throw new Error(`Error adding asset ${asset_symbol} to database: ${error}`);
	}
}

// POST /api/orders/place - Place Buy/Sell Order
router.post("/place", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
	const db = getDB();
	const userId = req.user!.id;
	let { asset_symbol, amount, order_type } = req.body;
	const useMax = req.body.use_max === true || String(req.body.use_max) === "true";

	if (!asset_symbol || !amount || !order_type) {
		res.status(400).json({
			message: "Asset symbol, amount, and order type are required.",
		});
		return;
	}

	// Normalize symbol
	asset_symbol = asset_symbol.toUpperCase();
	order_type = String(order_type).toUpperCase();
	amount = Number(amount);

	if (!Number.isFinite(amount) || amount <= 0) {
		res.status(400).json({ message: "Amount must be a positive number." });
		return;
	}

	if (!asset_symbol.endsWith("USDT")) {
		asset_symbol = `${asset_symbol}USDT`;
	}

	// Auto-create asset if it doesn't exist
	try {
		await ensureAssetExists(asset_symbol);
	} catch (error) {
		res.status(400).json({
			message: `${error}`,
		});
		return;
	}

	// Get price using symbol without USDT (e.g., "DOGE" from "DOGEUSDT")
	const priceSymbol = asset_symbol.replace(/USDT$/, "");
	let price = getCurrentPrice(priceSymbol);

	// If price not available in cache, fetch directly from Binance
	if (!price || price <= 0) {
		try {
			console.log(`Price not in cache, fetching from Binance for ${asset_symbol}`);
			const binanceResponse = await fetch(
				`https://api.binance.com/api/v3/ticker/price?symbol=${asset_symbol}`,
			);

			if (binanceResponse.ok) {
				const data = (await binanceResponse.json()) as BinancePriceResponse;
				price = parseFloat(data.price);
				console.log(`Got price from Binance: ${asset_symbol} = $${price}`);
			} else {
				res.status(400).json({
					message: `Price unavailable for ${asset_symbol}. Asset may not be traded on Binance.`,
				});
				return;
			}
		} catch (error) {
			res.status(400).json({
				message: `Failed to fetch price for ${asset_symbol}. Please try again later.`,
			});
			return;
		}
	}

	let finalAmount = amount;
	let totalCost = finalAmount * price;

	// Start a transaction
	try {
		if (order_type === "BUY") {
			const user = await db.get<User>("SELECT balance FROM users WHERE id = ?", [userId]);
			if (!user) {
				res.status(400).json({ message: "User not found." });
				return;
			}

			if (useMax) {
				finalAmount = floorToDecimals(user.balance / price);
				if (finalAmount <= ORDER_EPSILON) {
					res.status(400).json({
						message: "Insufficient balance (USD).",
					});
					return;
				}
				totalCost = finalAmount * price;
			} else if (user.balance + ORDER_EPSILON < totalCost) {
				res.status(400).json({ message: "Insufficient balance (USD)." });
				return;
			}

			const nextBalance = Math.max(0, user.balance - totalCost);
			await db.run("UPDATE users SET balance = ? WHERE id = ?", [nextBalance, userId]);
			const existingAsset = await db.get<PortfolioAsset>(
				"SELECT * FROM portfolio WHERE user_id = ? AND asset_symbol = ?",
				[userId, asset_symbol],
			);

			if (existingAsset) {
				await db.run(
					"UPDATE portfolio SET amount = amount + ? WHERE user_id = ? AND asset_symbol = ?",
					[finalAmount, userId, asset_symbol],
				);
			} else {
				await db.run("INSERT INTO portfolio (user_id, asset_symbol, amount) VALUES (?, ?, ?)", [
					userId,
					asset_symbol,
					finalAmount,
				]);
			}
		} else if (order_type === "SELL") {
			const existingAsset = await db.get<PortfolioAsset>(
				"SELECT * FROM portfolio WHERE user_id = ? AND asset_symbol = ?",
				[userId, asset_symbol],
			);
			if (!existingAsset || existingAsset.amount + ORDER_EPSILON < finalAmount) {
				res.status(400).json({
					message: "Insufficient asset amount to sell.",
				});
				return;
			}

			await db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [totalCost, userId]);
			await db.run(
				"UPDATE portfolio SET amount = amount - ? WHERE user_id = ? AND asset_symbol = ?",
				[finalAmount, userId, asset_symbol],
			);

			if (existingAsset.amount - finalAmount <= ORDER_EPSILON) {
				await db.run("DELETE FROM portfolio WHERE user_id = ? AND asset_symbol = ?", [
					userId,
					asset_symbol,
				]);
			}
		} else {
			res.status(400).json({
				message: "Invalid order type. Use 'BUY' or 'SELL'.",
			});
			return;
		}

		await db.run(
			"INSERT INTO orders (user_id, asset_symbol, order_type, amount, price_at_transaction) VALUES (?, ?, ?, ?, ?)",
			[userId, asset_symbol, order_type, finalAmount, price],
		);

		res.json({
			message: "Order placed successfully.",
			asset: asset_symbol,
			price: price,
			amount: finalAmount,
			total: totalCost,
		});
	} catch (error) {
		console.error("Error placing order:", error);
		res.status(500).json({ message: "Internal server error." });
	}
});

// GET /api/orders/history - Get Order History with Pagination, Sorting, and Filtering
router.get(
	"/history",
	authenticateToken,
	async (req: AuthRequest, res: Response): Promise<void> => {
		const db = getDB();
		const userId = req.user!.id;

		const { page, limit, offset } = parsePagination(
			req.query.page as string,
			req.query.limit as string,
		);

		const sortBy = validateSortField(
			req.query.sortBy as string,
			ALLOWED_ORDER_SORT_FIELDS,
			"timestamp",
		);

		const sortOrder = validateSortOrder(req.query.sortOrder as string);
		const sortOrderSQL = sortOrder.toUpperCase();

		const assetSymbol = req.query.asset_symbol as string | undefined;
		const orderType = req.query.order_type as string | undefined;
		const dateFrom = parseDateFilter(req.query.dateFrom as string);
		const dateTo = parseDateFilter(req.query.dateTo as string);
		const minAmount = parseNumericFilter(req.query.minAmount as string);
		const maxAmount = parseNumericFilter(req.query.maxAmount as string);

		try {
			// Build WHERE clause
			const conditions: string[] = ["user_id = ?"];
			const params: (string | number)[] = [userId];

			if (assetSymbol) {
				conditions.push("(asset_symbol = ?)");
				params.push(assetSymbol.toUpperCase());
			}

			if (orderType && ALLOWED_ORDER_TYPES.includes(orderType.toUpperCase())) {
				conditions.push("order_type = ?");
				params.push(orderType.toUpperCase());
			}

			if (dateFrom) {
				conditions.push("timestamp >= ?");
				params.push(dateFrom);
			}

			if (dateTo) {
				conditions.push("timestamp <= ?");
				params.push(dateTo);
			}

			if (minAmount !== null) {
				conditions.push("amount >= ?");
				params.push(minAmount);
			}

			if (maxAmount !== null) {
				conditions.push("amount <= ?");
				params.push(maxAmount);
			}

			// Price filtering will be handled after fetching data since price is not stored in DB
			const whereClause = `WHERE ${conditions.join(" AND ")}`;

			// Get total count for pagination
			const countResult = await db.get(
				`SELECT COUNT(*) as total FROM orders ${whereClause}`,
				params,
			);
			const total = countResult?.total || 0;

			const orders = await db.all(
				`SELECT * FROM orders ${whereClause} ORDER BY ${sortBy} ${sortOrderSQL} LIMIT ? OFFSET ?`,
				[...params, limit, offset],
			);

			const response = buildPaginationResponse(orders, page, limit, total, sortBy, sortOrder);

			res.json(response);
		} catch (error) {
			console.error("Error fetching assets:", error);
			res.status(500).json({ message: "Internal server error." });
		}
	},
);

// GET /api/orders/:id - Get Specific Order by ID
router.get("/:id", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
	const db = getDB();
	const orderId = req.params.id;

	try {
		const order = await db.get("SELECT * FROM orders WHERE id = ? AND user_id = ?", [
			orderId,
			req.user!.id,
		]);

		if (!order) {
			res.status(404).json({ message: "Order not found." });
			return;
		}

		res.json({ order });
	} catch (error) {
		console.error("Error fetching order:", error);
		res.status(500).json({ message: "Internal server error." });
	}
});

// Delete /api/orders/:id - Delete Specific Order by ID
router.delete("/:id", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
	const db = getDB();
	const orderId = req.params.id;

	try {
		const result = await db.run("DELETE FROM orders WHERE id = ? AND user_id = ?", [
			orderId,
			req.user!.id,
		]);

		if (result.changes === 0) {
			res.status(404).json({
				message: "Order not found or not authorized to delete.",
			});
			return;
		}

		res.json({ message: "Order deleted successfully." });
	} catch (error) {
		console.error("Error deleting order:", error);
		res.status(500).json({ message: "Internal server error." });
	}
});

export default router;
