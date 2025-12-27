import express, { Router, Response } from "express";
import { getDB } from "../database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { getCurrentPrice } from "../services/priceService.js";
import { AuthRequest } from "../types/types.js";

const router: Router = express.Router();

// GET /api/stats - Get Global Statistics
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();

    try {
      // Total number of users
      const userStats = await db.get(
        "SELECT COUNT(*) as totalUsers, SUM(balance) as totalBalance FROM users",
      );

      // Total number of orders
      const ordersStats = await db.get(
        `SELECT COUNT(*) as totalOrders,
          SUM(CASE WHEN order_type = 'BUY' THEN 1 ELSE 0 END) as buyOrders,
          SUM(CASE WHEN order_type = 'SELL' THEN 1 ELSE 0 END) as sellOrders,
          SUM(amount * price_at_transaction) as totalVolume
        FROM orders`,
      );

      const mostTradedAssets = await db.all(
        `SELECT asset_symbol,
          COUNT(*) as tradeCount,
          SUM(amount) as totalAmount,
          SUM(amount * price_at_transaction) as totalValue
        FROM orders
        GROUP BY asset_symbol
        ORDER BY tradeCount DESC
        LIMIT 10`,
      );

      const resentActivity = await db.all(
        `SELECT
          DATE(timestamp) as date,
          COUNT(*) as orderCount,
          SUM(CASE WHEN order_type = 'BUY' THEN 1 ELSE 0 END) as buyCount,
          SUM(CASE WHEN order_type = 'SELL' THEN 1 ELSE 0 END) as sellCount
        FROM orders
        WHERE timestamp >= DATE('now', '-7 days')
        GROUP BY DATE(timestamp)
        ORDER BY date ASC`,
      );

      const topTraders = await db.all(
        `SELECT
          u.id,
          u.username,
          COUNT(o.id) as totalOrders,
          SUM(o.amount * o.price_at_transaction) as totalVolume
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        GROUP BY u.id, u.username
        ORDER BY totalVolume DESC
        LIMIT 10`,
      );

      const assetDistribution = await db.all(
        `SELECT
          asset_symbol,
          COUNT(DISTINCT user_id) as holders,
          SUM(amount) as totalHeld
        FROM portfolio
        GROUP BY asset_symbol
        ORDER BY holders DESC`,
      );

      res.json({
        users: {
          total: userStats.totalUsers || 0,
          totalBalance:
            Math.round((userStats.totalBalance || 0) * 100) / 100 || 0,
        },
        orders: {
          total: ordersStats.totalOrders || 0,
          buyOrders: ordersStats.buyOrders || 0,
          sellOrders: ordersStats.sellOrders || 0,
          totalVolume: Math.round((ordersStats.totalVolume || 0) * 100) / 100,
        },
        mostTradedAssets,
        resentActivity,
        topTraders,
        assetDistribution,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// GET /api/stats/user - Get User-Specific Statistics
router.get(
  "/user",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const userId = req.user!.id;

    try {
      // User's total number of orders
      const ordersStats = await db.get(
        `SELECT COUNT(*) as totalOrders,
          SUM(CASE WHEN order_type = 'BUY' THEN 1 ELSE 0 END) as buyOrders,
          SUM(CASE WHEN order_type = 'SELL' THEN 1 ELSE 0 END) as sellOrders,
          SUM(CASE WHEN order_type = 'BUY' THEN amount * price_at_transaction ELSE 0 END) as totalSpent,
          SUM(CASE WHEN order_type = 'SELL' THEN amount * price_at_transaction ELSE 0 END) as totalEarned
        FROM orders
        WHERE user_id = ?`,
        [userId],
      );

      const portfolio = await db.all(
        `SELECT asset_symbol,
          amount
        FROM portfolio
        WHERE user_id = ?`,
        [userId],
      );

      let portfolioValue = 0;
      const portfolioWithValues = portfolio.map((asset) => {
        const currentPrice = getCurrentPrice(asset.asset_symbol);
        const assetValue = currentPrice * asset.amount;
        portfolioValue += assetValue;

        return {
          symbol: asset.asset_symbol,
          amount: asset.amount,
          currentPrice: currentPrice,
          value: Math.round(assetValue * 100) / 100,
        };
      });

      const user = await db.get("SELECT balance FROM users WHERE id = ?", [
        userId,
      ]);

      const ordersByAsset = await db.all(
        `SELECT
          asset_symbol,
          COUNT(*) as orderCount,
          SUM(CASE WHEN order_type = 'BUY' THEN amount ELSE 0 END) as totalBought,
          SUM(CASE WHEN order_type = 'SELL' THEN amount ELSE 0 END) as totalSold
        FROM orders
        WHERE user_id = ?
        GROUP BY asset_symbol`,
        [userId],
      );

      const netSpent =
        (ordersStats.totalSpent || 0) - (ordersStats.totalEarned || 0);
      const totalAssets = portfolioValue + (user?.balance || 0);
      const profitLoss = totalAssets - 10000; // Assuming initial balance is 10,000

      res.json({
        orders: {
          total: ordersStats.totalOrders || 0,
          buyOrders: ordersStats.buyOrders || 0,
          sellOrders: ordersStats.sellOrders || 0,
          totalSpent: Math.round((ordersStats.totalSpent || 0) * 100) / 100,
          totalEarned: Math.round((ordersStats.totalEarned || 0) * 100) / 100,
        },
        portfolio: {
          assets: portfolioWithValues,
          totalValue: Math.round(portfolioValue * 100) / 100,
          balance: Math.round((user?.balance || 0) * 100) / 100,
          totalAssets: Math.round(totalAssets * 100) / 100,
        },
        performance: {
          profitLoss: Math.round(profitLoss * 100) / 100,
          profitLossPercent: Math.round((profitLoss / 10000) * 10000) / 100,
        },
        ordersByAsset,
      });
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

export default router;
