import mqtt from "mqtt";

let curretPrices = {};
const client = mqtt.connect("mqtt://test.mosquitto.org");

let onPriceUpdateCallback = null;

// Connect to MQTT broker and subscribe to market price updates
export function connectToMarket(onPriceUpdate) {
  if (onPriceUpdate) {
    onPriceUpdateCallback = onPriceUpdate;
  }

  client.on("connect", () => {
    console.log("Connected to MQTT broker for price updates");

    client.subscribe("vacetmax/market/+");
  });
  client.on("message", (topic, message) => {
    try {
      const symbol = topic.split("/").pop();
      const data = JSON.parse(message.toString());

      if (data.price) {
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

export function getCurrentPrice(symbol) {
  return curretPrices[symbol] || 0;
}
