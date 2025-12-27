import express, { Router, Response } from "express";
import { getDB } from "../database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { getCurrentPrice } from "../services/priceService.js";
import { AuthRequest, User, PortfolioAsset, Order } from "../types/types.js";
import {
  parsePagination,
  validateSortField,
  validateSortOrder,
  parseNumericFilter,
  parseDateFilter,
  buildPaginationResponse,
} from "../utils/helpers.js";
import {
  ALLOWED_ORDER_TYPES,
  ALLOWED_ORDER_SORT_FIELDS,
} from "../utils/constants.js";

const router: Router = express.Router();

// POST /api/orders/place - Place Buy/Sell Order
router.post(
  "/place",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const userId = req.user!.id;
    const { asset_symbol, amount, order_type } = req.body;

    if (!asset_symbol || !amount || !order_type) {
      res.status(400).json({
        message: "Asset symbol, amount, and order type are required.",
      });
      return;
    }

    const price = getCurrentPrice(asset_symbol);
    if (!price || price <= 0) {
      res.status(400).json({
        message: `Price unavaible for ${asset_symbol}. Wait for MQTT update`,
      });
      return;
    }

    const totalCost = amount * price;

    // Start a transaction
    try {
      if (order_type === "BUY") {
        const user = await db.get<User>(
          "SELECT balance FROM users WHERE id = ?",
          [userId],
        );
        if (!user || user.balance < totalCost) {
          res.status(400).json({ message: "Insufficient balance.(USD)" });
          return;
        }

        await db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [
          totalCost,
          userId,
        ]);
        const existingAsset = await db.get<PortfolioAsset>(
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
        const existingAsset = await db.get<PortfolioAsset>(
          "SELECT * FROM portfolio WHERE user_id = ? AND asset_symbol = ?",
          [userId, asset_symbol],
        );
        if (!existingAsset || existingAsset.amount < amount) {
          res
            .status(400)
            .json({ message: "Insufficient asset amount to sell." });
          return;
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
        res
          .status(400)
          .json({ message: "Invalid order type. Use 'BUY' or 'SELL'." });
        return;
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
  },
);

// GET /api/orders/history - Get Order History with Pagination, Sorting, and Filtering
router.get(
  "/history",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const userId = req.user!.id;

    const { page, limit, offset } = parsePagination(
      req.query.page as string,
      req.query.limit as string,
    );

    const sortBy = validateSortField(
      req.query.sortBy as string,
      ALLOWED_ORDER_SORT_FIELDS,
      "timestamp",
    );

    const sortOrder = validateSortOrder(req.query.sortOrder as string);
    const sortOrderSQL = sortOrder.toUpperCase();

    const assetSymbol = req.query.asset_symbol as string | undefined;
    const orderType = req.query.order_type as string | undefined;
    const dateFrom = parseDateFilter(req.query.dateFrom as string);
    const dateTo = parseDateFilter(req.query.dateTo as string);
    const minAmount = parseNumericFilter(req.query.minAmount as string);
    const maxAmount = parseNumericFilter(req.query.maxAmount as string);

    try {
      // Build WHERE clause
      const conditions: string[] = [];
      const params: (string | number)[] = [];

      if (assetSymbol) {
        conditions.push("(asset_symbol = ?)");
        params.push(assetSymbol.toUpperCase());
      }

      if (orderType && ALLOWED_ORDER_TYPES.includes(orderType.toUpperCase())) {
        conditions.push("order_type = ?");
        params.push(orderType.toUpperCase());
      }

      if (dateFrom) {
        conditions.push("timestamp >= ?");
        params.push(dateFrom);
      }

      if (dateTo) {
        conditions.push("timestamp <= ?");
        params.push(dateTo);
      }

      if (minAmount !== null) {
        conditions.push("amount >= ?");
        params.push(minAmount);
      }

      if (maxAmount !== null) {
        conditions.push("amount <= ?");
        params.push(maxAmount);
      }

      // Price filtering will be handled after fetching data since price is not stored in DB
      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Get total count for pagination
      const countResult = await db.get(
        `SELECT COUNT(*) as total FROM assets ${whereClause}`,
        params,
      );
      const total = countResult?.total || 0;

      const orders = await db.all(
        `SELECT * FROM orders ${whereClause} ORDER BY ${sortBy} ${sortOrderSQL} LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );

      const response = buildPaginationResponse(
        orders,
        page,
        limit,
        total,
        sortBy,
        sortOrder,
      );

      res.json(response);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// GET /api/orders/:id - Get Specific Order by ID
router.get(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const orderId = req.params.id;

    try {
      const order = await db.get(
        "SELECT * FROM orders WHERE id = ? AND user_id = ?",
        [orderId, req.user!.id],
      );

      if (!order) {
        res.status(404).json({ message: "Order not found." });
        return;
      }

      res.json({ order });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// Delete /api/orders/:id - Delete Specific Order by ID
router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const orderId = req.params.id;

    try {
      const result = await db.run(
        "DELETE FROM orders WHERE id = ? AND user_id = ?",
        [orderId, req.user!.id],
      );

      if (result.changes === 0) {
        res
          .status(404)
          .json({ message: "Order not found or not authorized to delete." });
        return;
      }

      res.json({ message: "Order deleted successfully." });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

export default router;
