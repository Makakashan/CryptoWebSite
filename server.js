import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { initializeDB } from "./database.js";
import authRoutes from "./routes/authRoutes.js"; // Import auth routes

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

// Start the server after initializing the database
initializeDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("DB Error:", err));
