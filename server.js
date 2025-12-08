import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import initializeDb from "./database.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 3000;
const secretKey = "your_secret_key";

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

let db;

// User Registration Endpoint
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  try {
    const existingUser = await db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
    );
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists." });
    }

    //Project aquirement
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
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  try {
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (!user) {
      return res.status(400).json({ message: "Invalid Username." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password." });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      secretKey,
      {
        expiresIn: "1h",
      },
    );

    res.cookie("token", token, {
      httpOnly: true,
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
app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout successful." });
});

// Get Users Endpoint
app.get("/api/users", async (req, res) => {
  const users = await db.all("SELECT id, username, balance FROM users");
  res.json(users);
});

initializeDb()
  .then((database) => {
    db = database;
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
  });
