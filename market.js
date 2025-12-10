import mqtt from "mqtt";
import axios from "axios";

const client = mqtt.connect("mqtt://test.mosquitto.org");

const pairs = {
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

async function fetchPricesAndPublish() {
  try {
    const response = await axios.get(
      "https://api.binance.com/api/v3/ticker/price",
    );
    const data = response.data;

    for (const [binanceSymbol, ourSymbol] of Object.entries(pairs)) {
      const ticker = data.find((item) => item.symbol === binanceSymbol);
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
