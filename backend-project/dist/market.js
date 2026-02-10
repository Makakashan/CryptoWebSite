import mqtt from "mqtt";
import axios from "axios";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
const client = mqtt.connect("mqtt://test.mosquitto.org");
let db;
async function initDB() {
    db = await open({
        filename: "./trading.db",
        driver: sqlite3.verbose().Database,
    });
    console.log("Connected to the database for market service.");
}
async function getActiveAssets() {
    try {
        const assets = await db.all("SELECT symbol FROM assets WHERE is_active = 1");
        const symbols = assets.map((asset) => asset.symbol);
        console.log(`Found ${symbols.length} active assets in database`);
        return symbols;
    }
    catch (error) {
        console.error("Error fetching active assets:", error);
        return [];
    }
}
async function fetchPricesAndPublish() {
    try {
        const activeSymbols = await getActiveAssets();
        if (activeSymbols.length === 0) {
            console.log("No active assets found.");
            return;
        }
        console.log(`Fetching prices for: ${activeSymbols.join(", ")}`);
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/price`);
        const binancePrices = response.data;
        let publishedCount = 0;
        for (const symbol of activeSymbols) {
            // Symbol already includes USDT from database (e.g., "BTCUSDT")
            const binanceSymbol = symbol.endsWith("USDT") ? symbol : `${symbol}USDT`;
            const ticker = binancePrices.find((item) => item.symbol === binanceSymbol);
            if (ticker) {
                const price = parseFloat(ticker.price);
                // Remove USDT for MQTT topic (e.g., "BTC" from "BTCUSDT")
                const topicSymbol = symbol.replace(/USDT$/, "");
                const topic = `vacetmax/market/${topicSymbol}`;
                client.publish(topic, JSON.stringify({ price }));
                console.log(`${symbol}: $${price.toFixed(2)} → ${topic}`);
                publishedCount++;
            }
            else {
                console.log(`Price for ${symbol} not found on Binance.`);
            }
        }
        console.log(`Published prices for ${publishedCount}/${activeSymbols.length} assets.`);
    }
    catch (error) {
        console.error("Error fetching prices:", error);
    }
}
client.on("connect", async () => {
    console.log("Connected to MQTT broker for market service.");
    await initDB();
    console.log("Starting price publishing...");
    await fetchPricesAndPublish();
    setInterval(() => {
        fetchPricesAndPublish();
    }, 3000);
});
client.on("error", (error) => {
    console.error("MQTT connection error:", error);
});
//# sourceMappingURL=market.js.map