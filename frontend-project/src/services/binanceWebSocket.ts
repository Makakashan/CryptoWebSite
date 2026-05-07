type PriceCallback = () => void;
type PriceListener = (symbol: string, price: number) => void;

const PRICE_CACHE_KEY = "binance-price-cache";

class BinanceWebSocketService {
	private ws: WebSocket | null = null;
	private prices: Map<string, number> = new Map();
	private subscribers: Set<PriceCallback> = new Set();
	private priceListeners: Set<PriceListener> = new Set();
	private symbolSources: Map<string, Set<string>> = new Map();
	private allSymbols: Set<string> = new Set();
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

	constructor() {
		this.restoreCachedPrices();
	}

	connect() {
		if (this.ws?.readyState === WebSocket.OPEN) return;
		const symbols = Array.from(this.allSymbols);
		if (symbols.length === 0) return;
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
		this.ws.onclose = () => {
			this.reconnectTimer = setTimeout(() => this.connect(), 3000);
		};
	}

	updateSymbols(symbols: string[], sourceId: string) {
		const prevSymbols = this.symbolSources.get(sourceId);
		if (prevSymbols) {
			prevSymbols.forEach((s) => this.allSymbols.delete(s));
		}
		const newSet = new Set(symbols);
		this.symbolSources.set(sourceId, newSet);
		newSet.forEach((s) => this.allSymbols.add(s));
		this.reconnect();
	}

	clearSymbols(sourceId: string) {
		const prevSymbols = this.symbolSources.get(sourceId);
		if (prevSymbols) {
			prevSymbols.forEach((s) => this.allSymbols.delete(s));
		}
		this.symbolSources.delete(sourceId);
		if (this.allSymbols.size === 0) {
			this.ws?.close();
			this.ws = null;
		} else {
			this.reconnect();
		}
	}

	reconnect() {
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
		this.ws?.close();
		this.ws = null;
		setTimeout(() => this.connect(), 100);
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
