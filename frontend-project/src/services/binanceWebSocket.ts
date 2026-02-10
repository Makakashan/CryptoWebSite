type PriceUpdateCallback = (symbol: string, price: number) => void;

class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private subscribers: Set<PriceUpdateCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private subscribedSymbols: Set<string> = new Set();
  private prices: Map<string, number> = new Map();

  connect(symbols: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
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
        console.log("Binance WebSocket connected");
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

            // Update internal price map
            this.prices.set(symbol, price);

            // Notify all subscribers
            this.subscribers.forEach((callback) => {
              callback(symbol, price);
            });
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.ws = null;

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(
            `Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
          );
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
    }
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
