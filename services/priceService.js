import mqtt from "mqtt";

let curretPrices = {
  BTC: 0,
  ETH: 0,
  XRP: 0,
  LTC: 0,
};

const client = mqtt.connect("mqtt://test.mosquitto.org");

export function connectToMarket() {
  client.on("connect", () => {
    console.log("Connected to MQTT broker for price updates");

    client.subscribe("vacetmax/market/+");
  });
  client.on("message", (topic, message) => {
    try {
      const symnbol = topic.split("/").pop();
      const data = JSON.parse(message.toString());

      if (data.price) {
        curretPrices[symnbol] = data.price;
        console.log(`Updated price for ${symnbol}: ${data.price}`);
      }
    } catch (error) {
      console.error("Error parsing MQTT message:", error);
    }
  });
}

export function getCurrentPrice(symbol) {
  return curretPrices[symbol] || 0;
}
