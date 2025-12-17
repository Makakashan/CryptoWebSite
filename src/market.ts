import mqtt, { MqttClient } from "mqtt";
import axios from "axios";
import { PairMap } from "./types/types.js";

const client = mqtt.connect("mqtt://test.mosquitto.org");

const pairs: PairMap = {
  BTCUSDT: "BTC",
  ETHUSDT: "ETH",
  XRPUSDT: "XRP",
  LTCUSDT: "LTC",
};

client.on("connect", () => {
  console.log("Connected to MQTT broker");

  setInterval(() => {
    fetchPricesAndPublish();
  }, 1000); // Fetch prices every 1 seconds
});

async function fetchPricesAndPublish(): Promise<void> {
  try {
    const response = await axios.get(
      "https://api.binance.com/api/v3/ticker/price",
    );
    const data = response.data;

    for (const [binanceSymbol, ourSymbol] of Object.entries(pairs)) {
      const ticker = data.find((item: any) => item.symbol === binanceSymbol);
      if (ticker) {
        const price = parseFloat(ticker.price);
        const topic = `vacetmax/market/${ourSymbol}`;
        client.publish(topic, JSON.stringify({ price: price }));
        console.log(`Send to ${ourSymbol}: ${price}`);
      }
    }
  } catch (error) {
    console.error("Error fetching prices:", error);
  }
}
