import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import initializeDb from "./database.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let db;

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
