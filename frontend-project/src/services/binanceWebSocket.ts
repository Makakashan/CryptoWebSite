import type { BinancePriceUpdateCallback } from "../store/types";

class BinanceWebSocketService {
	private ws: WebSocket | null = null;
	private subscribers: Set<BinancePriceUpdateCallback> = new Set();
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 3000;
	private symbolGroups: Map<string, Set<string>> = new Map();
	private activeSymbols: Set<string> = new Set();
	private prices: Map<string, number> = new Map();
	private throttleTimers: Map<string, NodeJS.Timeout> = new Map();
	private readonly throttleDelay = 1000; // Update UI at most once per second
	private readonly wsUrl = "ws://localhost:3000";

	private connect() {
		if (this.activeSymbols.size === 0) {
			return;
		}
		if (
			this.ws?.readyState === WebSocket.OPEN ||
			this.ws?.readyState === WebSocket.CONNECTING
		) {
			return;
		}

		try {
			this.ws = new WebSocket(this.wsUrl);

			this.ws.onopen = () => {
				this.reconnectAttempts = 0;
				this.sendSubscription();
			};

			this.ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);

					if (data.type === "PRICE_UPDATE" && data.symbol && data.price) {
						const symbol = data.symbol;
						const price = parseFloat(data.price);

						if (!Number.isFinite(price)) return;

						// Always update internal price map immediately
						this.prices.set(symbol, price);

						// Throttle UI updates to prevent excessive re-renders
						this.throttledNotify(symbol, price);
					}
				} catch (error) {
					console.error("Error parsing WebSocket message:", error);
				}
			};

			this.ws.onerror = () => {
				// WebSocket error occurred
			};

			this.ws.onclose = () => {
				this.ws = null;

				if (this.reconnectAttempts < this.maxReconnectAttempts) {
					this.reconnectAttempts++;
					setTimeout(() => {
						this.connect();
					}, this.reconnectDelay * this.reconnectAttempts);
				}
			};
		} catch (error) {
			console.error("Failed to create WebSocket:", error);
		}
	}

	disconnect() {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.prices.clear();
		// Clear all throttle timers
		this.throttleTimers.forEach((timer) => clearTimeout(timer));
		this.throttleTimers.clear();
	}

	private throttledNotify(symbol: string, price: number) {
		// Clear existing timer for this symbol if any
		const existingTimer = this.throttleTimers.get(symbol);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		// Set new timer to notify subscribers after throttle delay
		const timer = setTimeout(() => {
			this.subscribers.forEach((callback) => {
				callback(symbol, price);
			});
			this.throttleTimers.delete(symbol);
		}, this.throttleDelay);

		this.throttleTimers.set(symbol, timer);
	}

	subscribe(callback: BinancePriceUpdateCallback) {
		this.subscribers.add(callback);
	}

	unsubscribe(callback: BinancePriceUpdateCallback) {
		this.subscribers.delete(callback);
	}

	getPrice(symbol: string): number | undefined {
		return this.prices.get(symbol);
	}

	getAllPrices(): Map<string, number> {
		return new Map(this.prices);
	}

	updateSymbols(symbols: string[], sourceId = "default") {
		const nextSymbols = symbols
			.filter((symbol) => typeof symbol === "string")
			.map((symbol) => symbol.trim().toUpperCase())
			.filter(Boolean);

		if (nextSymbols.length === 0) {
			this.symbolGroups.delete(sourceId);
		} else {
			this.symbolGroups.set(sourceId, new Set(nextSymbols));
		}

		this.refreshActiveSymbols();
	}

	clearSymbols(sourceId = "default") {
		this.symbolGroups.delete(sourceId);
		this.refreshActiveSymbols();
	}

	private sendSubscription() {
		if (this.ws?.readyState !== WebSocket.OPEN) {
			return;
		}

		this.ws.send(
			JSON.stringify({
				type: "SUBSCRIBE",
				symbols: Array.from(this.activeSymbols),
			}),
		);
	}

	private refreshActiveSymbols() {
		const nextSymbols = new Set<string>();
		this.symbolGroups.forEach((symbols) => {
			symbols.forEach((symbol) => nextSymbols.add(symbol));
		});

		if (this.areSetsEqual(this.activeSymbols, nextSymbols)) {
			return;
		}

		this.activeSymbols = nextSymbols;

		if (this.activeSymbols.size === 0) {
			this.disconnect();
			return;
		}

		this.connect();
		this.sendSubscription();
	}

	private areSetsEqual(a: Set<string>, b: Set<string>) {
		if (a.size !== b.size) return false;
		for (const item of a) {
			if (!b.has(item)) return false;
		}
		return true;
	}
}

export const binanceWebSocketService = new BinanceWebSocketService();
