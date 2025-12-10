import express from "express";
import { getDB } from "../database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

// Create a router for portfolio routes
const router = express.Router();

// Get User Portfolio
router.get("/", authenticateToken, async (req, res) => {
  const db = getDB();
  const userId = req.user.id;

  try {
    const user = await db.get("SELECT balance FROM users WHERE id = ?", [
      userId,
    ]);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not found." });
    }

    const assets = await db.all(
      "SELECT asset_symbol, amount FROM portfolio WHERE user_id = ?",
      [userId],
    );

    res.json({
      username: req.user.username,
      balance: user.balance,
      assets: assets,
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Update Asset Amount in Portfolio
router.put("/:asset_symbol", authenticateToken, async (req, res) => {
  const db = getDB();
  const userId = req.user.id;
  const { asset_symbol } = req.params;
  const { amount } = req.body;

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ message: "Valid amount is required." });
  }

  try {
    const existingAsset = await db.get(
      "SELECT * FROM portfolio WHERE user_id = ? AND asset_symbol = ?",
      [userId, asset_symbol],
    );

    if (!existingAsset) {
      return res.status(404).json({ message: "Asset not found in portfolio." });
    }

    await db.run(
      "UPDATE portfolio SET amount = ? WHERE user_id = ? AND asset_symbol = ?",
      [amount, userId, asset_symbol],
    );

    res.json({ message: "Asset amount updated successfully." });
  } catch (error) {
    console.error("Error updating asset amount:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.delete("/:asset_symbol", authenticateToken, async (req, res) => {
  const db = getDB();
  const userId = req.user.id;
  const { asset_symbol } = req.params;

  try {
    const existingAsset = await db.run(
      "DELETE FROM portfolio WHERE user_id = ? AND asset_symbol = ?",
      [userId, asset_symbol],
    );

    if (existingAsset.changes === 0) {
      return res.status(404).json({ message: "Asset not found in portfolio." });
    }

    res.json({ message: "Asset removed from portfolio successfully." });
  } catch (error) {
    console.error("Error removing asset from portfolio:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;
