import { getDB } from "../database.js";
import {
	BinancePriceResponse,
	PriceUpdateCallback,
	PriceMap,
} from "../types/types.js";

const PRICE_POLL_INTERVAL_MS = Number(
	process.env.PRICE_POLL_INTERVAL_MS ?? 5000,
);

// In-memory store for current prices
let curretPrices: PriceMap = {};

// Callback to be invoked on price updates
let onPriceUpdateCallback: PriceUpdateCallback | null = null;
let pollTimer: NodeJS.Timeout | null = null;
let isRefreshing = false;

const normalizeSymbol = (symbol: string): string =>
	symbol.replace(/USDT$/, "");

async function refreshPrices(): Promise<void> {
	if (isRefreshing) return;
	isRefreshing = true;

	try {
		const db = getDB();
		const assets = (await db.all(
			"SELECT symbol FROM assets WHERE is_active = 1",
		)) as { symbol: string }[];

		if (!assets || assets.length === 0) {
			return;
		}

		const response = await fetch(
			"https://api.binance.com/api/v3/ticker/price",
		);

		if (!response.ok) {
			console.error(
				"Failed to fetch prices from Binance:",
				response.status,
				response.statusText,
			);
			return;
		}

		const binancePrices = (await response.json()) as BinancePriceResponse[];
		const priceMap = new Map(
			binancePrices.map((item) => [item.symbol, item.price]),
		);

		let updated = 0;
		for (const asset of assets) {
			const binanceSymbol = asset.symbol.endsWith("USDT")
				? asset.symbol
				: `${asset.symbol}USDT`;
			const priceString = priceMap.get(binanceSymbol);
			if (!priceString) continue;

			const price = Number.parseFloat(priceString);
			if (!Number.isFinite(price)) continue;

			const normalizedSymbol = normalizeSymbol(binanceSymbol);
			const prevPrice = curretPrices[normalizedSymbol];
			curretPrices[normalizedSymbol] = price;
			updated++;

			if (onPriceUpdateCallback && price !== prevPrice) {
				onPriceUpdateCallback(normalizedSymbol, price);
			}
		}

		if (updated > 0) {
			console.log(`Updated prices for ${updated} assets`);
		}
	} catch (error) {
		console.error("Price refresh error:", error);
	} finally {
		isRefreshing = false;
	}
}

// Start polling Binance and emit price updates via callback
export function connectToMarket(onPriceUpdate?: PriceUpdateCallback): void {
	if (onPriceUpdate) {
		onPriceUpdateCallback = onPriceUpdate;
		console.log("Price update callback registered");
	}

	if (!pollTimer) {
		console.log(
			`Starting price polling from Binance every ${PRICE_POLL_INTERVAL_MS}ms`,
		);
		refreshPrices().catch((error) =>
			console.error("Initial price refresh failed:", error),
		);
		pollTimer = setInterval(() => {
			refreshPrices().catch((error) =>
				console.error("Price refresh failed:", error),
			);
		}, PRICE_POLL_INTERVAL_MS);
	}
}

export function getCurrentPrice(symbol: string): number {
	const normalizedSymbol = normalizeSymbol(symbol);
	const price = curretPrices[normalizedSymbol] || 0;
	if (price === 0) {
		console.log(`No price available for ${normalizedSymbol}`);
	}
	return price;
}

export function getAllPrices(): PriceMap {
	return { ...curretPrices };
}
