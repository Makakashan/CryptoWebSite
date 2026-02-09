import express, { Router, Request, Response } from "express";
import { getDB } from "../database.js";
import { authenticateToken } from "../middleware/authMiddleware";
import { AuthRequest } from "../types/types";

const router = express.Router();

// Upload avatar
router.post(
  "/avatar",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { avatar } = req.body;
      const userId = req.user!.id;

      if (!avatar) {
        res.status(400).json({ message: "Avatar is required" });
        return;
      }

      if (!avatar.startsWith("data:image/")) {
        res.status(400).json({ message: "Invalid avatar format" });
        return;
      }

      const db = getDB();
      await db.run("UPDATE users SET avatar = ? WHERE id = ?", [
        avatar,
        userId,
      ]);

      res.json({ message: "Avatar updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

router.delete(
  "/avatar",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const db = getDB();
      await db.run("UPDATE users SET avatar = NULL WHERE id = ?", [userId]);

      res.json({ message: "Avatar deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default router;
