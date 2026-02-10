import express from "express";
import { getDB } from "../database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { getCurrentPrice } from "../services/priceService.js";
import { parsePagination, validateSortField, validateSortOrder, parseNumericFilter, buildPaginationResponse, } from "../utils/helpers.js";
import { ALLOWED_USER_SORT_FIELDS } from "../utils/constants.js";
const router = express.Router();
// GET /api/user - Get User Info with Pagination, Sorting, and Filtering
router.get("/", authenticateToken, async (req, res) => {
    const db = getDB();
    const { page, limit, offset } = parsePagination(req.query.page, req.query.limit);
    const sortBy = validateSortField(req.query.sortBy, ALLOWED_USER_SORT_FIELDS, "id");
    const sortOrder = validateSortOrder(req.query.sortOrder);
    const sortOrderSQL = sortOrder.toUpperCase();
    const search = req.query.search;
    const minBalance = parseNumericFilter(req.query.minBalance);
    const maxBalance = parseNumericFilter(req.query.maxBalance);
    try {
        // Build WHERE clause
        const conditions = [];
        const params = [];
        if (search) {
            conditions.push("username LIKE ?");
            params.push(`%${search}%`);
        }
        if (minBalance !== null) {
            conditions.push("balance >= ?");
            params.push(minBalance);
        }
        if (maxBalance !== null) {
            conditions.push("balance <= ?");
            params.push(maxBalance);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        // Get total count
        const countResult = await db.get(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);
        const total = countResult?.total || 0;
        // Get paginated users
        const users = await db.all(`SELECT id, username, balance FROM users ${whereClause} ORDER BY ${sortBy} ${sortOrderSQL} LIMIT ? OFFSET ?`, [...params, limit, offset]);
        const response = buildPaginationResponse(users, page, limit, total, sortBy, sortOrder);
        res.json(response);
    }
    catch (error) {
        console.error("Error fetching user info:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});
// Update User Balance Endpoint
router.put("/update", authenticateToken, async (req, res) => {
    const db = getDB();
    const { amount } = req.body;
    if (!amount || isNaN(amount)) {
        res.status(400).json({ message: "Valid amount is required." });
        return;
    }
    try {
        await db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [
            amount,
            req.user.id,
        ]);
        const user = await db.get("SELECT balance FROM users WHERE id = ?", [
            req.user.id,
        ]);
        res.json({
            message: "Balance updated successfully.",
            balance: user.balance,
        });
    }
    catch (error) {
        console.error("Error updating balance:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});
// GET /api/users/:id - Get Specific User Details with Portfolio and Statistics
router.get("/:id", authenticateToken, async (req, res) => {
    const db = getDB();
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID." });
        return;
    }
    try {
        // Get user basic info
        const user = await db.get("SELECT id, username, balance FROM users WHERE id = ?", [userId]);
        if (!user) {
            res.status(404).json({ message: "User not found." });
            return;
        }
        // Get user's portfolio with current prices
        const portfolio = await db.all(`SELECT p.asset_symbol, p.amount, a.name, a.image_url, a.category
        FROM portfolio p
        LEFT JOIN assets a ON p.asset_symbol = a.symbol
        WHERE p.user_id = ?`, [userId]);
        let portfolioValue = 0;
        const portfolioWithValues = portfolio.map((asset) => {
            const priceSymbol = asset.asset_symbol.replace(/USDT$/, "");
            const currentPrice = getCurrentPrice(priceSymbol);
            const assetValue = currentPrice * asset.amount;
            portfolioValue += assetValue;
            return {
                symbol: asset.asset_symbol,
                name: asset.name || asset.asset_symbol,
                amount: asset.amount,
                currentPrice: currentPrice,
                value: Math.round(assetValue * 100) / 100,
                image_url: asset.image_url,
                category: asset.category,
            };
        });
        // Get user's order statistics
        const ordersStats = await db.get(`SELECT COUNT(*) as totalOrders,
          SUM(CASE WHEN order_type = 'BUY' THEN 1 ELSE 0 END) as buyOrders,
          SUM(CASE WHEN order_type = 'SELL' THEN 1 ELSE 0 END) as sellOrders,
          SUM(CASE WHEN order_type = 'BUY' THEN amount * price_at_transaction ELSE 0 END) as totalSpent,
          SUM(CASE WHEN order_type = 'SELL' THEN amount * price_at_transaction ELSE 0 END) as totalEarned
        FROM orders
        WHERE user_id = ?`, [userId]);
        // Get recent orders (last 10)
        const recentOrders = await db.all(`SELECT o.id, o.asset_symbol, o.order_type, o.amount, o.price_at_transaction, o.timestamp, a.name, a.image_url
        FROM orders o
        LEFT JOIN assets a ON o.asset_symbol = a.symbol
        WHERE o.user_id = ?
        ORDER BY o.timestamp DESC
        LIMIT 10`, [userId]);
        // Get orders grouped by asset
        const ordersByAsset = await db.all(`SELECT
          asset_symbol,
          COUNT(*) as orderCount,
          SUM(CASE WHEN order_type = 'BUY' THEN amount ELSE 0 END) as totalBought,
          SUM(CASE WHEN order_type = 'SELL' THEN amount ELSE 0 END) as totalSold,
          SUM(CASE WHEN order_type = 'BUY' THEN amount * price_at_transaction ELSE 0 END) as moneySpent,
          SUM(CASE WHEN order_type = 'SELL' THEN amount * price_at_transaction ELSE 0 END) as moneyEarned
        FROM orders
        WHERE user_id = ?
        GROUP BY asset_symbol
        ORDER BY orderCount DESC`, [userId]);
        // Calculate performance metrics
        const totalAssets = portfolioValue + user.balance;
        const initialBalance = 10000; // Assuming initial balance is 10,000
        const profitLoss = totalAssets - initialBalance;
        const profitLossPercent = (profitLoss / initialBalance) * 100;
        res.json({
            user: {
                id: user.id,
                username: user.username,
                balance: Math.round(user.balance * 100) / 100,
            },
            portfolio: {
                assets: portfolioWithValues,
                totalValue: Math.round(portfolioValue * 100) / 100,
                totalAssets: Math.round(totalAssets * 100) / 100,
                assetsCount: portfolio.length,
            },
            orders: {
                total: ordersStats.totalOrders || 0,
                buyOrders: ordersStats.buyOrders || 0,
                sellOrders: ordersStats.sellOrders || 0,
                totalSpent: Math.round((ordersStats.totalSpent || 0) * 100) / 100,
                totalEarned: Math.round((ordersStats.totalEarned || 0) * 100) / 100,
                recent: recentOrders,
                byAsset: ordersByAsset,
            },
            performance: {
                profitLoss: Math.round(profitLoss * 100) / 100,
                profitLossPercent: Math.round(profitLossPercent * 100) / 100,
                initialBalance: initialBalance,
            },
        });
    }
    catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});
// Update User Balance Endpoint
router.put("/update", authenticateToken, async (req, res) => {
    const db = getDB();
    const { amount } = req.body;
    if (!amount || isNaN(amount)) {
        res.status(400).json({ message: "Valid amount is required." });
        return;
    }
    try {
        await db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [
            amount,
            req.user.id,
        ]);
        const user = await db.get("SELECT balance FROM users WHERE id = ?", [
            req.user.id,
        ]);
        res.json({
            message: "Balance updated successfully.",
            balance: user.balance,
        });
    }
    catch (error) {
        console.error("Error updating balance:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});
// Delete User Account Endpoint
router.delete("/delete", authenticateToken, async (req, res) => {
    const db = getDB();
    const userId = req.user.id;
    try {
        await db.run("DELETE FROM portfolio WHERE user_id = ?", [userId]);
        await db.run("DELETE FROM orders WHERE user_id = ?", [userId]);
        await db.run("DELETE FROM users WHERE id = ?", [userId]);
        res.clearCookie("token");
        res.json({ message: "User account deleted successfully." });
    }
    catch (error) {
        console.error("Error deleting user account:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});
export default router;
//# sourceMappingURL=userRoutes.js.map