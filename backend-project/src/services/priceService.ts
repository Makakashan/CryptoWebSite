import mqtt, { MqttClient } from "mqtt";
import { PriceUpdateCallback, PriceMap } from "../types/types.js";

// In-memory store for current prices
let curretPrices: PriceMap = {};
const client: MqttClient = mqtt.connect("mqtt://test.mosquitto.org");

// Callback to be invoked on price updates
let onPriceUpdateCallback: PriceUpdateCallback | null = null;

// Register message handler immediately
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

// Register connect handler immediately
client.on("connect", () => {
  console.log("Connected to MQTT broker for price updates");

  client.subscribe("vacetmax/market/+", (err) => {
    if (err) {
      console.error("Failed to subscribe to market topic:", err);
    } else {
      console.log("Subscribed to vacetmax/market/+");
    }
  });
});

client.on("error", (error) => {
  console.error("MQTT client error:", error);
});

// Connect to MQTT broker and subscribe to market price updates
export function connectToMarket(onPriceUpdate?: PriceUpdateCallback): void {
  if (onPriceUpdate) {
    onPriceUpdateCallback = onPriceUpdate;
    console.log("Price update callback registered");
  }
}

export function getCurrentPrice(symbol: string): number {
  const price = curretPrices[symbol] || 0;
  if (price === 0) {
    console.log(`No price available for ${symbol}`);
  }
  return price;
}

export function getAllPrices(): PriceMap {
  return { ...curretPrices };
}
