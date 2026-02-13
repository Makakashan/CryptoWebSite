type PriceUpdateCallback = (symbol: string, price: number) => void;

class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private subscribers: Set<PriceUpdateCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private subscribedSymbols: Set<string> = new Set();
  private prices: Map<string, number> = new Map();
  private throttleTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly throttleDelay = 1000; // Update UI at most once per second

  connect(symbols: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // Convert symbols to Binance WebSocket format (lowercase)
    const streams = symbols
      .map((symbol) => `${symbol.toLowerCase()}@ticker`)
      .join("/");

    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        symbols.forEach((s) => this.subscribedSymbols.add(s));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.stream && data.data) {
            const ticker = data.data;
            const symbol = ticker.s; // Symbol in uppercase (e.g., "BTCUSDT")
            const price = parseFloat(ticker.c); // Current price

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
            this.connect(Array.from(this.subscribedSymbols));
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
      this.subscribedSymbols.clear();
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

  subscribe(callback: PriceUpdateCallback) {
    this.subscribers.add(callback);
  }

  unsubscribe(callback: PriceUpdateCallback) {
    this.subscribers.delete(callback);
  }

  getPrice(symbol: string): number | undefined {
    return this.prices.get(symbol);
  }

  getAllPrices(): Map<string, number> {
    return new Map(this.prices);
  }

  updateSymbols(symbols: string[]) {
    // Close current connection
    this.disconnect();

    // Connect with new symbols
    if (symbols.length > 0) {
      this.connect(symbols);
    }
  }
}

export const binanceWebSocketService = new BinanceWebSocketService();
