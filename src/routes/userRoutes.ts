import express, { Router, Response } from "express";
import { getDB } from "../database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { AuthRequest, User } from "../types/types.js";
import {
  parsePagination,
  validateSortField,
  validateSortOrder,
  parseNumericFilter,
  buildPaginationResponse,
} from "../utils/helpers.js";
import { ALLOWED_USER_SORT_FIELDS } from "../utils/constants.js";

const router: Router = express.Router();

// GET /api/user - Get User Info with Pagination, Sorting, and Filtering
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();

    const { page, limit, offset } = parsePagination(
      req.query.page as string,
      req.query.limit as string,
    );
    const sortBy = validateSortField(
      req.query.sortBy as string,
      ALLOWED_USER_SORT_FIELDS,
      "id",
    );
    const sortOrder = validateSortOrder(req.query.sortOrder as string);
    const sortOrderSQL = sortOrder.toUpperCase();

    const search = req.query.search as string | undefined;
    const minBalance = parseNumericFilter(req.query.minBalance as string);
    const maxBalance = parseNumericFilter(req.query.maxBalance as string);

    try {
      // Build WHERE clause
      const conditions: string[] = [];
      const params: (string | number)[] = [];

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

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Get total count
      const countResult = await db.get(
        `SELECT COUNT(*) as total FROM users ${whereClause}`,
        params,
      );
      const total = countResult?.total || 0;

      // Get paginated users
      const users = await db.all(
        `SELECT id, username, balance FROM users ${whereClause} ORDER BY ${sortBy} ${sortOrderSQL} LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );

      const response = buildPaginationResponse(
        users,
        page,
        limit,
        total,
        sortBy,
        sortOrder,
      );

      res.json(response);
    } catch (error) {
      console.error("Error fetching user info:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// Update User Balance Endpoint
router.put(
  "/update",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      res.status(400).json({ message: "Valid amount is required." });
      return;
    }

    try {
      await db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [
        amount,
        req.user!.id,
      ]);

      const user = await db.get("SELECT balance FROM users WHERE id = ?", [
        req.user!.id,
      ]);

      res.json({
        message: "Balance updated successfully.",
        balance: user.balance,
      });
    } catch (error) {
      console.error("Error updating balance:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

// Delete User Account Endpoint
router.delete(
  "/delete",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const db = getDB();
    const userId = req.user!.id;

    try {
      await db.run("DELETE FROM portfolio WHERE user_id = ?", [userId]);
      await db.run("DELETE FROM orders WHERE user_id = ?", [userId]);
      await db.run("DELETE FROM users WHERE id = ?", [userId]);

      res.clearCookie("token");
      res.json({ message: "User account deleted successfully." });
    } catch (error) {
      console.error("Error deleting user account:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },
);

export default router;
