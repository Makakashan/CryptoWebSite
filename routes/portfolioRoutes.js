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

export default router;
