import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { mapCoinGeckoCategory } from "./utils/constants.js";
let dbinstance = null; // Store the database instance
// Initialize and set up the SQLite database
export async function initializeDB() {
    const db = await open({
        filename: "./trading.db",
        driver: sqlite3.verbose().Database,
    });
    console.log("Connected to the database.");
    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      balance REAL DEFAULT 10000.0,
      avatar TEXT DEFAULT NULL
    );
  `);
    await db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      asset_symbol TEXT,
      amount REAL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
    await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      asset_symbol TEXT,
      order_type TEXT, -- 'BUY' or 'SELL'
      amount REAL,
      price_at_transaction REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
    await db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      image_url TEXT,
      category TEXT DEFAULT 'other',
      description TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
    console.log("Database tables are set up.");
    // Add avatar column to users table if it doesn't exist
    try {
        await db.exec(`
      ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT NULL;
    `);
        console.log("Avatar column added to users table.");
    }
    catch (error) {
        if (!error.message.includes("duplicate column name")) {
            console.error("Failed to add avatar column to users table:", error);
        }
    }
    dbinstance = db; // Store the database instance for later use
    // Auto-populate assets if database is empty
    await autoPopulateAssets(db);
    return db;
}
// Auto-populate assets from Binance and CoinGecko if database is empty
async function autoPopulateAssets(db) {
    try {
        const assetCount = await db.get("SELECT COUNT(*) as count FROM assets");
        if (assetCount && assetCount.count > 0) {
            console.log(`Database already has ${assetCount.count} assets. Skipping auto-population.`);
            return;
        }
        console.log("No assets found in database. Starting auto-population...");
        const limit = 100;
        const response = await fetch("https://api.binance.com/api/v3/ticker/24hr");
        if (!response.ok) {
            console.error("Failed to fetch data from Binance for auto-population.");
            return;
        }
        const tickers = (await response.json());
        const stablecoins = [
            "USDT",
            "USDC",
            "BUSD",
            "TUSD",
            "USDP",
            "DAI",
            "FDUSD",
            "USD1",
        ];
        const usdtPairs = tickers
            .filter((ticker) => {
            if (!ticker.symbol.endsWith("USDT"))
                return false;
            const baseAsset = ticker.symbol.replace("USDT", "");
            return !stablecoins.includes(baseAsset);
        })
            .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
            .slice(0, limit);
        let addedCount = 0;
        // Fetch CoinGecko list once for all assets
        let coinsListMap = new Map();
        try {
            const coinsListResponse = await fetch("https://api.coingecko.com/api/v3/coins/list");
            if (coinsListResponse.ok) {
                const coinsList = (await coinsListResponse.json());
                coinsList.forEach((coin) => {
                    coinsListMap.set(coin.symbol.toLowerCase(), coin.id);
                });
                console.log(`Loaded ${coinsListMap.size} coins from CoinGecko`);
            }
        }
        catch (error) {
            console.log("Could not fetch CoinGecko list, continuing without it:", error);
        }
        for (const ticker of usdtPairs) {
            const symbol = ticker.symbol;
            let image_url = null;
            let description = null;
            let category = "other";
            try {
                const baseAsset = symbol.replace(/USDT$/, "").toLowerCase();
                const coinId = coinsListMap.get(baseAsset);
                if (coinId) {
                    const coinDetailResponse = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`);
                    if (coinDetailResponse.ok) {
                        const coinDetail = (await coinDetailResponse.json());
                        image_url =
                            coinDetail.image?.large || coinDetail.image?.small || null;
                        if (coinDetail.description?.en) {
                            description = coinDetail.description.en
                                .replace(/<[^>]*>/g, "")
                                .substring(0, 500);
                        }
                        category = mapCoinGeckoCategory(coinDetail.categories);
                    }
                    // Small delay to avoid rate limiting
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
            }
            catch (error) {
                console.log(`Could not fetch CoinGecko data for ${symbol}`);
            }
            await db.run(`INSERT INTO assets (symbol, name, image_url, category, description, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`, [symbol, symbol, image_url, category, description, 1]);
            addedCount++;
            console.log(`Added ${symbol} (category: ${category})`);
        }
        console.log(`Auto-population completed. Added ${addedCount} assets.`);
    }
    catch (error) {
        console.error("Error during auto-population of assets:", error);
    }
}
// Export the initializeDB function for use in other modules
export function getDB() {
    if (!dbinstance) {
        throw new Error("Database not initialized.");
    }
    return dbinstance;
}
//# sourceMappingURL=database.js.map