import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

import { initializeDB } from "./database.js";
import authRoutes from "./routes/authRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import ordersRoutes from "./routes/ordersRoutes.js";
import { connectToMarket } from "./services/priceService.js";

const app: Express = express();
const PORT = 3000;

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", ordersRoutes);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const broadcastPrice = (symbol: string, price: number) => {
  const message = JSON.stringify({ type: "PRICE_UPDATE", symbol, price });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

wss.on("connection", (ws: WebSocket) => {
  console.log("New WebSocket connection established.");
  ws.send(JSON.stringify({ message: "Welcome to MakakaTrade" }));
});

connectToMarket((symbol: string, price: number) => {
  broadcastPrice(symbol, price);
});

// Start the server after initializing the database
initializeDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("DB Error:", err));
