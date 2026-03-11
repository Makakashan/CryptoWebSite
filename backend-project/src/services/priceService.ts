import WebSocket from "ws";
import { PriceUpdateCallback, PriceMap } from "../types/types.js";

type BinanceTickerMessage = {
	stream?: string;
	data?: {
		s: string; // symbol
		c: string; // last price
	};
};

const BINANCE_WS_BASE =
	"wss://stream.binance.com:9443/stream?streams=";

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

// In-memory store for current prices (keyed by symbol without USDT)
let curretPrices: PriceMap = {};

// Callback to be invoked on price updates
let onPriceUpdateCallback: PriceUpdateCallback | null = null;

let ws: WebSocket | null = null;
let subscribedSymbols = new Set<string>();
let reconnectAttempts = 0;
let reconnectTimer: NodeJS.Timeout | null = null;

const normalizeSymbol = (symbol: string): string =>
	symbol.replace(/USDT$/, "");

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

const scheduleReconnect = () => {
	if (subscribedSymbols.size === 0) {
		return;
	}

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
	if (ws || subscribedSymbols.size === 0) {
		return;
	}

	const symbols = Array.from(subscribedSymbols);
	const url = buildStreamUrl(symbols);

	ws = new WebSocket(url);

	ws.on("open", () => {
		reconnectAttempts = 0;
		console.log(
			`Connected to Binance WS for ${symbols.length} symbols.`,
		);
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
			const prevPrice = curretPrices[normalizedSymbol];
			curretPrices[normalizedSymbol] = price;

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
	const nextSymbols = new Set(
		symbols
			.filter((symbol) => typeof symbol === "string")
			.map((symbol) => symbol.trim().toUpperCase())
			.filter(Boolean),
	);

	if (setsEqual(subscribedSymbols, nextSymbols)) {
		return;
	}

	subscribedSymbols = nextSymbols;
	disconnectWebSocket();

	if (subscribedSymbols.size > 0) {
		connectWebSocket();
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
