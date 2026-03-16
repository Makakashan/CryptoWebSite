import WebSocket from "ws";
import { PriceUpdateCallback, PriceMap } from "../types/types.js";

type BinanceTickerMessage = {
	stream?: string;
	data?: {
		s: string; // symbol, e.g. BTCUSDT
		c: string; // last price
	};
};

const BINANCE_WS_BASE = "wss://stream.binance.com:9443/stream?streams=";

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

const MISSING_LOG_COOLDOWN_MS = 10 * 60 * 1000; // log once per 10 minutes
const MISSING_CACHE_TTL_MS = 30 * 60 * 1000; // keep in cache for 30 minutes

let currentPrices: PriceMap = {};

let onPriceUpdateCallback: PriceUpdateCallback | null = null;

let ws: WebSocket | null = null;
let subscribedSymbols = new Set<string>(); // stores full symbols: BTCUSDT
let reconnectAttempts = 0;
let reconnectTimer: NodeJS.Timeout | null = null;

const missingPriceLogTimestamps = new Map<string, number>();
const missingPriceFirstSeen = new Map<string, number>();

const BASE_SYMBOL_RE = /^[A-Z0-9]{1,20}$/;
const FULL_SYMBOL_RE = /^[A-Z0-9]{1,20}USDT$/;

const normalizeSymbol = (symbol: string): string => symbol.replace(/USDT$/, "");

const toUsdtPair = (symbol: string): string | null => {
	const cleaned = symbol.trim().toUpperCase();
	if (!cleaned) return null;

	if (FULL_SYMBOL_RE.test(cleaned)) return cleaned;
	if (BASE_SYMBOL_RE.test(cleaned)) return `${cleaned}USDT`;

	return null;
};

const buildStreamUrl = (symbols: string[]): string => {
	const streams = symbols
		.map((symbol) => `${symbol.toLowerCase()}@ticker`)
		.join("/");
	return `${BINANCE_WS_BASE}${streams}`;
};

const clearReconnectTimer = () => {
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
};

const cleanupMissingMaps = () => {
	const now = Date.now();
	for (const [symbol, firstSeen] of missingPriceFirstSeen.entries()) {
		if (now - firstSeen > MISSING_CACHE_TTL_MS) {
			missingPriceFirstSeen.delete(symbol);
			missingPriceLogTimestamps.delete(symbol);
		}
	}
};

const shouldLogMissingPrice = (symbol: string): boolean => {
	cleanupMissingMaps();

	const now = Date.now();
	const firstSeen = missingPriceFirstSeen.get(symbol);

	if (!firstSeen) {
		missingPriceFirstSeen.set(symbol, now);
		missingPriceLogTimestamps.set(symbol, now);
		return true;
	}

	const lastLogged = missingPriceLogTimestamps.get(symbol) ?? 0;
	if (now - lastLogged >= MISSING_LOG_COOLDOWN_MS) {
		missingPriceLogTimestamps.set(symbol, now);
		return true;
	}

	return false;
};

// Call this when a price is received for a symbol to reset missing price tracking.
const markSymbolHasPrice = (symbol: string) => {
	missingPriceFirstSeen.delete(symbol);
	missingPriceLogTimestamps.delete(symbol);
};

const scheduleReconnect = () => {
	if (subscribedSymbols.size === 0) return;

	if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
		console.error("Binance WS reconnect limit reached.");
		return;
	}

	const delay = Math.min(
		MAX_RECONNECT_DELAY_MS,
		BASE_RECONNECT_DELAY_MS * 2 ** reconnectAttempts,
	);
	reconnectAttempts += 1;

	clearReconnectTimer();
	reconnectTimer = setTimeout(() => {
		connectWebSocket();
	}, delay);
};

const connectWebSocket = () => {
	if (ws || subscribedSymbols.size === 0) return;

	const symbols = Array.from(subscribedSymbols);
	const url = buildStreamUrl(symbols);

	ws = new WebSocket(url);

	ws.on("open", () => {
		reconnectAttempts = 0;
		console.log(`Connected to Binance WS for ${symbols.length} symbols.`);
	});

	ws.on("message", (data) => {
		try {
			const message = JSON.parse(data.toString()) as BinanceTickerMessage;
			const symbol = message?.data?.s;
			const priceString = message?.data?.c;

			if (!symbol || !priceString) return;

			const price = Number.parseFloat(priceString);
			if (!Number.isFinite(price)) return;

			const normalizedSymbol = normalizeSymbol(symbol);
			const prevPrice = currentPrices[normalizedSymbol];
			currentPrices[normalizedSymbol] = price;

			// reset missing-state when symbol starts receiving price
			markSymbolHasPrice(normalizedSymbol);

			if (onPriceUpdateCallback && price !== prevPrice) {
				onPriceUpdateCallback(symbol, price);
			}
		} catch (error) {
			console.error("Error parsing Binance WS message:", error);
		}
	});

	ws.on("close", () => {
		ws = null;
		console.warn("Binance WS disconnected.");
		scheduleReconnect();
	});

	ws.on("error", (error) => {
		console.error("Binance WS error:", error);
		ws?.close();
	});
};

const disconnectWebSocket = () => {
	clearReconnectTimer();
	if (ws) {
		ws.close();
		ws = null;
	}
};

const setsEqual = (a: Set<string>, b: Set<string>): boolean => {
	if (a.size !== b.size) return false;
	for (const item of a) {
		if (!b.has(item)) return false;
	}
	return true;
};

// Start Binance WS and emit price updates via callback
export function connectToMarket(onPriceUpdate?: PriceUpdateCallback): void {
	if (onPriceUpdate) {
		onPriceUpdateCallback = onPriceUpdate;
		console.log("Price update callback registered");
	}

	if (subscribedSymbols.size > 0) {
		connectWebSocket();
	}
}

export function updateSubscribedSymbols(symbols: string[]): void {
	const nextSymbols = new Set<string>();

	for (const raw of symbols) {
		if (typeof raw !== "string") continue;
		const pair = toUsdtPair(raw);
		if (!pair) continue; // skip malformed symbols
		nextSymbols.add(pair);
	}

	if (setsEqual(subscribedSymbols, nextSymbols)) return;

	subscribedSymbols = nextSymbols;
	disconnectWebSocket();

	if (subscribedSymbols.size > 0) {
		connectWebSocket();
	}
}

export function getCurrentPrice(symbol: string): number {
	const pair = toUsdtPair(symbol);
	if (!pair) return 0;

	const normalizedSymbol = normalizeSymbol(pair);
	const price = currentPrices[normalizedSymbol] || 0;

	if (price === 0 && shouldLogMissingPrice(normalizedSymbol)) {
		console.warn(`[BACKEND] No price available for ${normalizedSymbol}`);
	}

	return price;
}

export function getAllPrices(): PriceMap {
	return { ...currentPrices };
}
