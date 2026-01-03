import express, { Router, Response } from "express";
import { getDB } from "../database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { AuthRequest, User, PortfolioAsset } from "../types/types.js";

// Create a router for portfolio routes
const router: Router = express.Router();

// Get User Portfolio
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const userId = req.user!.id;

    try {
      const user = await db.get("SELECT balance FROM users WHERE id = ?", [
        userId,
      ]);

      if (!user) {
        res.status(401).json({ message: "Access denied. User not found." });
        return;
      }

      const assets = await db.all(
        "SELECT asset_symbol, amount FROM portfolio WHERE user_id = ?",
        [userId],
      );

      res.json({
        id: userId,
        username: req.user!.username,
        balance: user.balance,
        assets: assets,
      });
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// Update Asset Amount in Portfolio
router.put(
  "/:asset_symbol",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const userId = req.user!.id;
    const { asset_symbol } = req.params;
    const { amount } = req.body;

    if (typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ message: "Valid amount is required." });
      return;
    }

    try {
      const existingAsset = await db.get(
        "SELECT * FROM portfolio WHERE user_id = ? AND asset_symbol = ?",
        [userId, asset_symbol],
      );

      if (!existingAsset) {
        res.status(404).json({ message: "Asset not found in portfolio." });
        return;
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
  },
);

router.delete(
  "/:asset_symbol",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const userId = req.user!.id;
    const { asset_symbol } = req.params;

    try {
      const existingAsset = await db.run(
        "DELETE FROM portfolio WHERE user_id = ? AND asset_symbol = ?",
        [userId, asset_symbol],
      );

      if (existingAsset.changes === 0) {
        res.status(404).json({ message: "Asset not found in portfolio." });
        return;
      }

      res.json({ message: "Asset removed from portfolio successfully." });
    } catch (error) {
      console.error("Error removing asset from portfolio:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

export default router;
