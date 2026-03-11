import type { BinancePriceUpdateCallback } from "../store/types";

class BinanceWebSocketService {
	private ws: WebSocket | null = null;
	private subscribers: Set<BinancePriceUpdateCallback> = new Set();
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 3000;
	private subscribedSymbols: Set<string> = new Set();
	private prices: Map<string, number> = new Map();
	private throttleTimers: Map<string, NodeJS.Timeout> = new Map();
	private readonly throttleDelay = 1000; // Update UI at most once per second
	private readonly wsUrl = "ws://localhost:3000";

	connect() {
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
			this.prices.clear();
			// Clear all throttle timers
			this.throttleTimers.forEach((timer) => clearTimeout(timer));
			this.throttleTimers.clear();
		}
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

	updateSymbols(symbols: string[]) {
		this.subscribedSymbols = new Set(symbols);

		if (symbols.length === 0) {
			this.disconnect();
			return;
		}

		this.connect();
		this.sendSubscription();
	}

	private sendSubscription() {
		if (this.ws?.readyState !== WebSocket.OPEN) {
			return;
		}

		this.ws.send(
			JSON.stringify({
				type: "SUBSCRIBE",
				symbols: Array.from(this.subscribedSymbols),
			}),
		);
	}
}

export const binanceWebSocketService = new BinanceWebSocketService();
