import mqtt, { MqttClient } from "mqtt";
import { PriceUpdateCallback, PriceMap } from "../types/types.js";

// In-memory store for current prices
let curretPrices: PriceMap = {};
const client: MqttClient = mqtt.connect("mqtt://test.mosquitto.org");

// Callback to be invoked on price updates
let onPriceUpdateCallback: PriceUpdateCallback | null = null;

// Connect to MQTT broker and subscribe to market price updates
export function connectToMarket(onPriceUpdate?: PriceUpdateCallback): void {
  if (onPriceUpdate) {
    onPriceUpdateCallback = onPriceUpdate;
  }

  client.on("connect", () => {
    console.log("Connected to MQTT broker for price updates");

    client.subscribe("vacetmax/market/+");
  });
  client.on("message", (topic: string, message: Buffer) => {
    try {
      const symbol = topic.split("/").pop();
      const data = JSON.parse(message.toString());

      if (symbol && data.price) {
        curretPrices[symbol] = data.price;

        if (onPriceUpdateCallback) {
          onPriceUpdateCallback(symbol, data.price);
        }
      }
    } catch (error) {
      console.error("Error parsing MQTT message:", error);
    }
  });
}

export function getCurrentPrice(symbol: string): number {
  return curretPrices[symbol] || 0;
}
