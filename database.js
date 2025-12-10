import sqlite3 from "sqlite3";
import { open } from "sqlite";

let dbinstance; // Store the database instance

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
      balance REAL DEFAULT 10000.0
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

  console.log("Database tables are set up.");

  dbinstance = db; // Store the database instance for later use
  return db;
}

// Export the initializeDB function for use in other modules
export function getDB() {
  if (!dbinstance) {
    throw new Error("Database not initialized.");
  }
  return dbinstance;
}
