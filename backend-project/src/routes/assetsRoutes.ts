import express, { Router, Request, Response } from "express";
import { getDB } from "../database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  AuthRequest,
  Asset,
  BinanceTicker,
  CoinGeckoListItem,
  CoinGeckoDetail,
  BinanceKline,
} from "../types/types.js";
import {
  parsePagination,
  validateSortField,
  validateSortOrder,
  parseNumericFilter,
  buildPaginationResponse,
  assetToAssetWithPrice,
} from "../utils/helpers.js";
import {
  ALLOWED_ASSET_CATEGORIES,
  ALLOWED_ASSET_SORT_FIELDS,
  mapCoinGeckoCategory,
} from "../utils/constants.js";

const router: Router = express.Router();

// GET /assets - Get Assets with Pagination, Sorting, and Filtering
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const db = getDB();

  // Parse Pagination
  const { page, limit, offset } = parsePagination(
    req.query.page as string,
    req.query.limit as string,
  );
  const sortBy = validateSortField(
    req.query.sortBy as string,
    ALLOWED_ASSET_SORT_FIELDS,
    "symbol",
  );
  const sortOrder = validateSortOrder(req.query.sortOrder as string);
  const sortOrderSQL = sortOrder.toUpperCase();

  // Parse Filters
  const search = req.query.search as string | undefined;
  const category = req.query.category as string | undefined;
  const isActive = req.query.isActive as string | undefined;
  const minPrice = parseNumericFilter(req.query.minPrice as string | undefined);
  const maxPrice = parseNumericFilter(req.query.maxPrice as string | undefined);

  try {
    // Build WHERE clause
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push("(symbol Like ? or name Like ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category && ALLOWED_ASSET_CATEGORIES.includes(category)) {
      conditions.push("category = ?");
      params.push(category);
    }

    if (isActive !== undefined) {
      conditions.push("is_active = ?");
      params.push(isActive === "true" ? 1 : 0);
    }

    // Price filtering will be handled after fetching data since price is not stored in DB
    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count for pagination
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM assets ${whereClause}`,
      params,
    );
    const total = countResult?.total || 0;

    // Fetch assets
    const isSortingByPrice = sortBy === "price";

    const assets: Asset[] = isSortingByPrice
      ? await db.all(`SELECT * FROM assets ${whereClause}`, params)
      : await db.all(
          `SELECT * FROM assets ${whereClause} ORDER BY ${sortBy} ${sortOrderSQL} LIMIT ? OFFSET ?`,
          [...params, limit, offset],
        );

    // Fetch 24h price change data from Binance for all assets at once
    let priceChangeMap: Record<string, number> = {};
    try {
      const binanceResponse = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr",
      );
      if (binanceResponse.ok) {
        const tickers = (await binanceResponse.json()) as Array<{
          symbol: string;
          priceChangePercent: string;
        }>;
        tickers.forEach((ticker) => {
          if (ticker.symbol && ticker.priceChangePercent) {
            priceChangeMap[ticker.symbol] = parseFloat(
              ticker.priceChangePercent,
            );
          }
        });
      }
    } catch (error) {
      console.error("Error fetching 24h price changes:", error);
    }

    // Map assets with price and price_change_24h
    let assetsWithPrice = assets.map((asset) => {
      const assetWithPrice = assetToAssetWithPrice(asset);
      const binanceSymbol = asset.symbol.endsWith("USDT")
        ? asset.symbol
        : `${asset.symbol}USDT`;
      return {
        ...assetWithPrice,
        price_change_24h: priceChangeMap[binanceSymbol] || 0,
      };
    });

    // Apply Sorting by Price if needed
    if (isSortingByPrice) {
      assetsWithPrice.sort((a, b) =>
        sortOrder === "asc" ? a.price - b.price : b.price - a.price,
      );
      assetsWithPrice = assetsWithPrice.slice(offset, offset + limit);
    }

    // Apply Price Filtering
    if (minPrice !== null || maxPrice !== null) {
      assetsWithPrice = assetsWithPrice.filter((asset) => {
        if (minPrice !== null && asset.price < minPrice) return false;
        if (maxPrice !== null && asset.price > maxPrice) return false;
        return true;
      });
    }

    const response = buildPaginationResponse(
      assetsWithPrice,
      page,
      limit,
      total,
      sortBy,
      sortOrder,
    );

    res.json(response);
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// GET /assets/categories - Get Allowed Asset Categories
router.get("/categories", (_req: Request, res: Response): void => {
  res.json({ categories: ALLOWED_ASSET_CATEGORIES });
});

// POST /assets/sync - Synchronize Assets from External API with CoinGecko data
router.post(
  "/sync",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const limit = Math.min(
      100,
      Math.max(1, Number(req.body.limit as string) || 20),
    );

    try {
      const response = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr",
      );

      if (!response.ok) {
        res.status(500).json({ message: "Failed to fetch data from Binance." });
        return;
      }

      const tickers: BinanceTicker[] =
        (await response.json()) as BinanceTicker[];

      const stablecoins = [
        "USDT",
        "USDC",
        "BUSD",
        "TUSD",
        "USDP",
        "DAI",
        "FDUSD",
        "USD1",
      ];

      const usdtPairs = tickers
        .filter((ticker) => {
          if (!ticker.symbol.endsWith("USDT")) return false;

          const baseAsset = ticker.symbol.replace("USDT", "");
          // Exclude if base asset is a stablecoin
          return !stablecoins.includes(baseAsset);
        })
        .sort(
          (a: any, b: any) =>
            parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume),
        )
        .slice(0, limit);

      let addedCount = 0;
      let skippedCount = 0;

      // Fetch CoinGecko list once for all assets
      let coinsListMap: Map<string, string> = new Map();
      try {
        const coinsListResponse = await fetch(
          "https://api.coingecko.com/api/v3/coins/list",
        );
        if (coinsListResponse.ok) {
          const coinsList =
            (await coinsListResponse.json()) as CoinGeckoListItem[];
          coinsList.forEach((coin) => {
            coinsListMap.set(coin.symbol.toLowerCase(), coin.id);
          });
          console.log(`Loaded ${coinsListMap.size} coins from CoinGecko`);
        }
      } catch (error) {
        console.log(
          "Could not fetch CoinGecko list, continuing without it:",
          error,
        );
      }

      for (const ticker of usdtPairs) {
        const symbol = ticker.symbol;

        const existingAsset = await db.get(
          "SELECT * FROM assets WHERE symbol = ?",
          [symbol],
        );

        if (existingAsset) {
          skippedCount++;
          continue;
        }

        // Try to get CoinGecko data for this asset
        let image_url: string | null = null;
        let description: string | null = null;
        let category = "other";

        try {
          const baseAsset = symbol.replace(/USDT$/, "").toLowerCase();
          const coinId = coinsListMap.get(baseAsset);

          if (coinId) {
            const coinDetailResponse = await fetch(
              `https://api.coingecko.com/api/v3/coins/${coinId}`,
            );

            if (coinDetailResponse.ok) {
              const coinDetail =
                (await coinDetailResponse.json()) as CoinGeckoDetail;
              image_url =
                coinDetail.image?.large || coinDetail.image?.small || null;

              // Get description and remove HTML tags
              if (coinDetail.description?.en) {
                description = coinDetail.description.en
                  .replace(/<[^>]*>/g, "") // Remove HTML tags
                  .substring(0, 500);
              }

              // Map CoinGecko categories to our categories
              category = mapCoinGeckoCategory(coinDetail.categories);
            }

            // Small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.log(`Could not fetch CoinGecko data for ${symbol}`);
          // Continue without CoinGecko data
        }

        await db.run(
          `INSERT INTO assets (symbol, name, image_url, category, description, is_active)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [symbol, symbol, image_url, category, description, 1],
        );

        addedCount++;
        console.log(`Added ${symbol} (category: ${category})`);
      }

      res.json({
        message: "Asset synchronization completed.",
        added: addedCount,
        skipped: skippedCount,
        total: limit,
      });
    } catch (error) {
      console.error("Error synchronizing assets:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// GET /assets/search/:symbol - Search for asset (auto-create if not exists)
router.get(
  "/search/:symbol",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    let symbol = req.params.symbol.toUpperCase();

    if (!symbol.endsWith("USDT")) {
      symbol = `${symbol}USDT`;
    }

    try {
      // Check if asset exists in DB
      const existingAsset = await db.get(
        "SELECT * FROM assets WHERE symbol = ?",
        [symbol],
      );

      // If asset exists, return it with price
      if (existingAsset) {
        const assetWithPrice = assetToAssetWithPrice(existingAsset);
        res.json({
          asset: assetWithPrice,
          created: false,
        });
        return;
      }

      // Asset does not exist, fetch price from Binance API
      const binanceResponse = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
      );

      if (!binanceResponse.ok) {
        res.status(400).json({
          message: "Asset not found in database.",
        });
        return;
      }

      await binanceResponse.json();

      await db.run(
        `INSERT INTO assets (symbol, name, category, is_active)
         VALUES (?, ?, ?, ?)`,
        [symbol, symbol, "crypto", 1],
      );

      const newAsset = await db.get("SELECT * FROM assets WHERE symbol = ?", [
        symbol,
      ]);

      const assetWithPrice = assetToAssetWithPrice(newAsset);

      res.status(201).json({
        asset: assetWithPrice,
        created: true,
        message: `Asset ${symbol} created successfully.`,
      });
    } catch (error) {
      console.error("Error searching/creating asset:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// GET /api/assets/:symbol/orders - Get all orders for specific asset
router.get(
  "/:symbol/orders",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    let symbol = req.params.symbol.toUpperCase();

    if (!symbol.endsWith("USDT")) {
      symbol = `${symbol}USDT`;
    }

    const { page, limit, offset } = parsePagination(
      req.query.page as string,
      req.query.limit as string,
    );

    const sortBy = (req.query.sortBy as string) || "timestamp";
    const sortOrder = validateSortOrder(req.query.sortOrder as string);
    const sortOrderSQL = sortOrder.toUpperCase();

    try {
      // Check if asset exists
      const asset = await db.get("SELECT * FROM assets WHERE symbol = ?", [
        symbol,
      ]);

      if (!asset) {
        res.status(404).json({ message: "Asset not found." });
        return;
      }

      // Get total count
      const countResult = await db.get(
        `SELECT COUNT(*) as total FROM orders WHERE asset_symbol = ?`,
        [symbol],
      );
      const total = countResult?.total || 0;

      // Get orders with user information
      const orders = await db.all(
        `SELECT
          o.*,
          u.username
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.asset_symbol = ?
        ORDER BY ${sortBy} ${sortOrderSQL}
        LIMIT ? OFFSET ?`,
        [symbol, limit, offset],
      );

      const assetWithPrice = assetToAssetWithPrice(asset);

      const response = buildPaginationResponse(
        orders,
        page,
        limit,
        total,
        sortBy,
        sortOrder,
      );

      res.json({
        asset: assetWithPrice,
        orders: response,
      });
    } catch (error) {
      console.error("Error fetching asset orders:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// GET /api/assets/:symbol/holders - Get all holders of specific asset
router.get(
  "/:symbol/holders",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    let symbol = req.params.symbol.toUpperCase();

    if (!symbol.endsWith("USDT")) {
      symbol = `${symbol}USDT`;
    }

    const { page, limit, offset } = parsePagination(
      req.query.page as string,
      req.query.limit as string,
    );

    try {
      // Check if asset exists
      const asset = await db.get("SELECT * FROM assets WHERE symbol = ?", [
        symbol,
      ]);

      if (!asset) {
        res.status(404).json({ message: "Asset not found." });
        return;
      }

      // Get total count of holders
      const countResult = await db.get(
        `SELECT COUNT(*) as total FROM portfolio WHERE asset_symbol = ?`,
        [symbol],
      );
      const total = countResult?.total || 0;

      // Get holders with user information
      const holders = await db.all(
        `SELECT
          u.id,
          u.username,
          u.balance,
          p.amount as holdings
        FROM portfolio p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.asset_symbol = ?
        ORDER BY p.amount DESC
        LIMIT ? OFFSET ?`,
        [symbol, limit, offset],
      );

      const assetWithPrice = assetToAssetWithPrice(asset);
      const currentPrice = assetWithPrice.price;

      // Calculate value for each holder
      const holdersWithValue = holders.map((holder) => ({
        ...holder,
        value: Math.round(holder.holdings * currentPrice * 100) / 100,
      }));

      const response = buildPaginationResponse(
        holdersWithValue,
        page,
        limit,
        total,
        "amount",
        "desc",
      );

      res.json({
        asset: assetWithPrice,
        holders: response,
      });
    } catch (error) {
      console.error("Error fetching asset holders:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// GET /api/assets/:symbol - Get detailed asset information
router.get("/:symbol", async (req: Request, res: Response): Promise<void> => {
  const db = getDB();
  let symbol = req.params.symbol.toUpperCase();

  if (!symbol.endsWith("USDT")) {
    symbol = `${symbol}USDT`;
  }

  try {
    const asset = await db.get("SELECT * FROM assets WHERE symbol = ?", [
      symbol,
    ]);

    if (!asset) {
      res.status(404).json({ message: "Asset not found." });
      return;
    }

    // Get asset with current price
    const assetWithPrice = assetToAssetWithPrice(asset);

    // Get statistics for this asset
    const orderStats = await db.get(
      `SELECT
          COUNT(*) as totalOrders,
          SUM(CASE WHEN order_type = 'BUY' THEN 1 ELSE 0 END) as buyOrders,
          SUM(CASE WHEN order_type = 'SELL' THEN 1 ELSE 0 END) as sellOrders,
          SUM(amount) as totalVolume
        FROM orders
        WHERE asset_symbol = ?`,
      [symbol],
    );

    const holdersCount = await db.get(
      `SELECT COUNT(DISTINCT user_id) as holders
        FROM portfolio
        WHERE asset_symbol = ?`,
      [symbol],
    );

    res.json({
      asset: assetWithPrice,
      statistics: {
        totalOrders: orderStats?.totalOrders || 0,
        buyOrders: orderStats?.buyOrders || 0,
        sellOrders: orderStats?.sellOrders || 0,
        totalVolume: orderStats?.totalVolume || 0,
        holders: holdersCount?.holders || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching asset details:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// POST /api/assets - Create New Asset
router.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const { symbol, name, image_url, category, description, is_active } =
      req.body;

    if (!symbol || !name) {
      res.status(400).json({ message: "Symbol and name are required." });
      return;
    }

    if (category && !ALLOWED_ASSET_CATEGORIES.includes(category)) {
      res.status(400).json({ message: "Invalid category." });
      return;
    }

    const normalizedSymbol = symbol.toUpperCase();

    try {
      const existingAsset = await db.get(
        "SELECT * FROM assets WHERE symbol = ?",
        [normalizedSymbol],
      );

      if (existingAsset) {
        res
          .status(400)
          .json({ message: "Asset with this symbol already exists." });
        return;
      }

      await db.run(
        `INSERT INTO assets (symbol, name, image_url, category, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [
          normalizedSymbol,
          name,
          image_url || null,
          category || "other",
          description || null,
          is_active != false ? 1 : 0,
        ],
      );

      const newAsset = await db.get("SELECT * FROM assets WHERE symbol = ?", [
        normalizedSymbol,
      ]);

      res.status(201).json({
        message: "Asset created successfully.",
        asset: assetToAssetWithPrice(newAsset),
      });
    } catch (error) {
      console.error("Error creating asset:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// PUT /api/assets/:symbol - Update Existing Asset
router.put(
  "/:symbol",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const symbol = req.params.symbol.toUpperCase();

    if (
      req.body.category &&
      !ALLOWED_ASSET_CATEGORIES.includes(req.body.category)
    ) {
      res.status(400).json({
        message: `Invalid category. Allowed: ${ALLOWED_ASSET_CATEGORIES.join(", ")}`,
      });
      return;
    }

    try {
      const existingAsset = await db.get(
        "SELECT * FROM assets WHERE symbol = ?",
        [symbol],
      );

      if (!existingAsset) {
        res.status(404).json({ message: "Asset not found." });
        return;
      }

      const updates: string[] = [];
      const params: (string | number | null)[] = [];

      const fieldsToUpdate: (keyof Asset)[] = [
        "name",
        "image_url",
        "category",
        "description",
        "is_active",
      ];

      fieldsToUpdate.forEach((field) => {
        const value = req.body[field];

        if (value !== undefined) {
          updates.push(`${field} = ?`);
          if (field === "is_active") {
            params.push(value != false ? 1 : 0);
          } else {
            params.push(value);
          }
        }
      });

      if (updates.length === 0) {
        res.status(400).json({ message: "No valid fields to update." });
        return;
      }

      params.push(symbol);
      await db.run(
        `UPDATE assets SET ${updates.join(", ")} WHERE symbol = ?`,
        params,
      );

      const updatedAsset = await db.get(
        "SELECT * FROM assets WHERE symbol = ?",
        [symbol],
      );

      res.json({
        message: "Asset updated successfully.",
        asset: assetToAssetWithPrice(updatedAsset),
      });
    } catch (error) {
      console.error("Error updating asset:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// DELETE /api/assets/:symbol - Delete Asset
router.delete(
  "/:symbol",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const symbol = req.params.symbol.toUpperCase();

    try {
      const result = await db.run("DELETE FROM assets WHERE symbol = ?", [
        symbol,
      ]);

      if (result.changes === 0) {
        res.status(404).json({ message: "Asset not found." });
        return;
      }

      res.json({ message: "Asset deleted successfully." });
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// POST /assets/chart - Get historical chart data for multiple assets
router.post("/chart", async (req: Request, res: Response): Promise<void> => {
  try {
    const { symbols, interval = "1h", limit = 24 } = req.body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      res.status(400).json({ message: "Symbols array is required." });
      return;
    }

    if (symbols.length > 50) {
      res
        .status(400)
        .json({ message: "Maximum 50 symbols allowed per request." });
      return;
    }

    // Validate interval
    const validIntervals = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];
    if (!validIntervals.includes(interval)) {
      res.status(400).json({ message: "Invalid interval." });
      return;
    }

    const chartDataMap: Record<string, number[]> = {};

    // Request data for each symbol
    await Promise.all(
      symbols.map(async (symbol: string) => {
        try {
          const binanceSymbol = symbol.endsWith("USDT")
            ? symbol
            : `${symbol}USDT`;
          const response = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`,
          );

          if (response.ok) {
            const data = (await response.json()) as BinanceKline[];
            // Extract closing prices (index 4 in klines array)
            const prices = data.map((candle: BinanceKline) =>
              parseFloat(candle[4]),
            );
            chartDataMap[symbol] = prices;
          } else {
            console.error(`Failed to fetch chart data for ${symbol}`);
            chartDataMap[symbol] = [];
          }
        } catch (error) {
          console.error(`Error fetching chart for ${symbol}:`, error);
          chartDataMap[symbol] = [];
        }
      }),
    );

    res.json({
      data: chartDataMap,
      interval,
      limit,
    });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;
