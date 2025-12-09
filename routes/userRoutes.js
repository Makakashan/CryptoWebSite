import express from "express";
import { getDB } from "../database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get User Info Endpoint
router.get("/", authenticateToken, async (req, res) => {
  const db = getDB();
  const { search } = req.query;

  try {
    let query = "SELECT id, username, balance FROM users";
    let params = [];

    if (search) {
      query += " WHERE username LIKE ?";
      params.push(`%${search}%`);
    }

    const users = await db.all(query, params);
    res.json({ users });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.delete("/delete", authenticateToken, async (req, res) => {
  const db = getDB();
  const userId = req.user.id;

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
});

export default router;
