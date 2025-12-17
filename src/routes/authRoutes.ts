import express, { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDB } from "../database.js";
import { SECRET_KEY } from "../config/secret.js";
import { User } from "../types/types.js";

// Create a router for authentication routes
const router: Router = express.Router();

// User Registration Endpoint
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  const db = getDB();

  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required." });
    return;
  }

  try {
    const existingUser = await db.get<User>(
      "SELECT * FROM users WHERE username = ?",
      [username],
    );
    if (existingUser) {
      res.status(400).json({ message: "Username already exists." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run("INSERT INTO users (username, password) VALUES (?, ?)", [
      username,
      hashedPassword,
    ]);

    res.json({ message: "User registered successfully." });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// User Login Endpoint
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  const db = getDB();

  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required." });
    return;
  }

  try {
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (!user) {
      res.status(400).json({ message: "Invalid Username." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid Password." });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET_KEY,
      {
        expiresIn: "1h",
      },
    );

    // Set token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "strict", // Prevent CSRF
      maxAge: 3600000, // 1 hour
    });

    res.json({
      message: "Login successful.",
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// User Logout Endpoint
router.post("/logout", (res: Response): void => {
  res.clearCookie("token");
  res.json({ message: "Logout successful." });
});

// Export the router
export default router;
