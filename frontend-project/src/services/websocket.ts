// WebSocket service for real-time price updates
type PriceUpdateCallback = (data: { symbol: string; price: number }) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private callbacks: PriceUpdateCallback[] = [];
  private reconnectInterval = 5000;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(url: string = "ws://localhost:3000") {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "price" && data.symbol && data.price) {
            this.callbacks.forEach((callback) => callback(data));
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
        this.attemptReconnect(url);
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      this.attemptReconnect(url);
    }
  }

  private attemptReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connect(url), this.reconnectInterval);
    }
  }

  subscribe(callback: PriceUpdateCallback) {
    this.callbacks.push(callback);
  }

  unsubscribe(callback: PriceUpdateCallback) {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks = [];
  }
}

export const websocketService = new WebSocketService();
