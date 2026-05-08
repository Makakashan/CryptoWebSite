type PriceCallback = () => void;
type PriceListener = (symbol: string, price: number) => void;

const PRICE_CACHE_KEY = "binance-price-cache";
const SYMBOL_RECONNECT_DELAY = 120;
const SOCKET_RETRY_DELAY = 3000;

class BinanceWebSocketService {
	private ws: WebSocket | null = null;
	private prices: Map<string, number> = new Map();
	private subscribers: Set<PriceCallback> = new Set();
	private priceListeners: Set<PriceListener> = new Set();
	private symbolSources: Map<string, Set<string>> = new Map();
	private allSymbols: Set<string> = new Set();
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private reconnectScheduled = false;

	constructor() {
		this.restoreCachedPrices();
	}

	connect() {
		if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING)
			return;

		const symbols = Array.from(this.allSymbols);
		if (symbols.length === 0) return;

		this.clearReconnectTimer();
		this.reconnectScheduled = false;

		const streams = symbols.map((s) => s.toLowerCase() + "@ticker").join("/");
		this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

		this.ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.s && data.c) {
				const price = parseFloat(data.c);
				this.prices.set(data.s, price);
				this.persistCachedPrices();
				this.priceListeners.forEach((cb) => cb(data.s, price));
				this.subscribers.forEach((cb) => cb());
			}
		};

		this.ws.onerror = () => {
			this.ws?.close();
		};

		this.ws.onclose = () => {
			this.ws = null;

			if (this.allSymbols.size === 0) return;
			if (this.reconnectScheduled) return;

			this.scheduleReconnect(SOCKET_RETRY_DELAY);
		};
	}

	updateSymbols(symbols: string[], sourceId: string) {
		const nextSymbols = new Set(symbols);
		const prevSymbols = this.symbolSources.get(sourceId);

		if (prevSymbols && this.sameSymbols(prevSymbols, nextSymbols)) {
			return;
		}

		if (prevSymbols) {
			prevSymbols.forEach((s) => this.allSymbols.delete(s));
		}

		this.symbolSources.set(sourceId, nextSymbols);
		nextSymbols.forEach((s) => this.allSymbols.add(s));

		if (this.allSymbols.size === 0) {
			this.stopConnection();
			return;
		}

		this.scheduleReconnect(SYMBOL_RECONNECT_DELAY);
	}

	clearSymbols(sourceId: string) {
		const prevSymbols = this.symbolSources.get(sourceId);
		if (prevSymbols) {
			prevSymbols.forEach((s) => this.allSymbols.delete(s));
		}
		this.symbolSources.delete(sourceId);

		if (this.allSymbols.size === 0) {
			this.stopConnection();
			return;
		}

		this.scheduleReconnect(SYMBOL_RECONNECT_DELAY);
	}

	scheduleReconnect(delay: number) {
		this.clearReconnectTimer();
		this.reconnectScheduled = true;

		if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
			try {
				this.ws.close();
			} catch {
				// Ignore socket close errors and let the next connect retry.
			}
		}

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			this.reconnectScheduled = false;
			this.connect();
		}, delay);
	}

	stopConnection() {
		this.clearReconnectTimer();
		this.reconnectScheduled = false;

		if (this.ws) {
			try {
				this.ws.close();
			} catch {
				// Ignore close failures during teardown.
			}
		}

		this.ws = null;
	}

	clearReconnectTimer() {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
	}

	sameSymbols(a: Set<string>, b: Set<string>) {
		if (a.size !== b.size) return false;
		for (const symbol of a) {
			if (!b.has(symbol)) return false;
		}
		return true;
	}

	getPrice(symbol: string): number | undefined {
		return this.prices.get(symbol);
	}

	private restoreCachedPrices() {
		if (typeof window === "undefined") return;

		try {
			const cachedPrices = window.localStorage.getItem(PRICE_CACHE_KEY);
			if (!cachedPrices) return;

			const parsed = JSON.parse(cachedPrices) as Record<string, number>;
			Object.entries(parsed).forEach(([symbol, price]) => {
				if (Number.isFinite(price)) {
					this.prices.set(symbol, price);
				}
			});
		} catch {
			// Ignore cache parse/storage errors and continue with an empty cache.
		}
	}

	private persistCachedPrices() {
		if (typeof window === "undefined") return;

		try {
			const cachedPrices = Object.fromEntries(this.prices.entries());
			window.localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(cachedPrices));
		} catch {
			// Ignore storage quota or serialization issues.
		}
	}

	subscribe(callback: PriceCallback) {
		this.subscribers.add(callback);
	}

	unsubscribe(callback: PriceCallback) {
		this.subscribers.delete(callback);
	}

	subscribeToPrice(callback: PriceListener) {
		this.priceListeners.add(callback);
	}

	unsubscribeFromPrice(callback: PriceListener) {
		this.priceListeners.delete(callback);
	}
}

export const binanceWebSocketService = new BinanceWebSocketService();
