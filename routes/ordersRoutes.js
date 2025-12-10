import express from "express";
import { getDB } from "../database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Temporary fixed prices for assets
const TEMP_PRICE = {
  BTC: 50000,
  ETH: 2000,
  XRP: 0.5,
  LTC: 100,
};

// Place Order
router.post("/place", authenticateToken, async (req, res) => {
  console.log("=== REQUEST DEBUG ===");
  console.log("Body:", req.body);
  console.log("Body type:", typeof req.body);
  console.log("Content-Type:", req.headers["content-type"]);

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      message: "Invalid request body",
      received: req.body,
    });
  }

  const db = getDB();
  const userId = req.user.id;
  const { asset_symbol, amount, order_type } = req.body;

  if (!asset_symbol || !amount || !order_type) {
    return res
      .status(400)
      .json({ message: "Asset symbol, amount, and order type are required." });
  }

  const price = TEMP_PRICE[asset_symbol];
  if (!price) {
    return res.status(400).json({ message: "Unsupported asset symbol." });
  }

  const totalCost = amount * price;

  // Start a transaction
  try {
    if (order_type === "BUY") {
      const user = await db.get("SELECT balance FROM users WHERE id = ?", [
        userId,
      ]);
      if (user.balance < totalCost) {
        return res.status(400).json({ message: "Insufficient balance.(USD)" });
      }

      await db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [
        totalCost,
        userId,
      ]);
      const existingAsset = await db.get(
        "SELECT * FROM portfolio WHERE user_id = ? AND asset_symbol = ?",
        [userId, asset_symbol],
      );

      if (existingAsset) {
        await db.run(
          "UPDATE portfolio SET amount = amount + ? WHERE user_id = ? AND asset_symbol = ?",
          [amount, userId, asset_symbol],
        );
      } else {
        await db.run(
          "INSERT INTO portfolio (user_id, asset_symbol, amount) VALUES (?, ?, ?)",
          [userId, asset_symbol, amount],
        );
      }
    } else if (order_type === "SELL") {
      const existingAsset = await db.get(
        "SELECT * FROM portfolio WHERE user_id = ? AND asset_symbol = ?",
        [userId, asset_symbol],
      );
      if (!existingAsset || existingAsset.amount < amount) {
        return res
          .status(400)
          .json({ message: "Insufficient asset amount to sell." });
      }

      await db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [
        totalCost,
        userId,
      ]);
      await db.run(
        "UPDATE portfolio SET amount = amount - ? WHERE user_id = ? AND asset_symbol = ?",
        [amount, userId, asset_symbol],
      );

      if (existingAsset.amount - amount <= 0) {
        await db.run(
          "DELETE FROM portfolio WHERE user_id = ? AND asset_symbol = ?",
          [userId, asset_symbol],
        );
      }
    } else {
      return res
        .status(400)
        .json({ message: "Invalid order type. Use 'BUY' or 'SELL'." });
    }

    await db.run(
      "INSERT INTO orders (user_id, asset_symbol, order_type, amount, price_at_transaction) VALUES (?, ?, ?, ?, ?)",
      [userId, asset_symbol, order_type, amount, price],
    );

    res.json({
      message: "Order placed successfully.",
      asset: asset_symbol,
      price: price,
      total: totalCost,
    });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get Order History
router.get("/history", authenticateToken, async (req, res) => {
  const db = getDB();
  const history = await db.all(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY timestamp DESC",
    [req.user.id],
  );
  res.json({ history });
});

export default router;
