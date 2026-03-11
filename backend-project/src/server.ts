import "dotenv/config";
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
import assetsRoutes from "./routes/assetsRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import {
	connectToMarket,
	getCurrentPrice,
	updateSubscribedSymbols,
} from "./services/priceService.js";

const app: Express = express();
const PORT = 3000;

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/assets", assetsRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/upload", uploadRoutes);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const wsSubscriptions = new Map<WebSocket, Set<string>>();

const broadcastPrice = (symbol: string, price: number) => {
	const message = JSON.stringify({ type: "PRICE_UPDATE", symbol, price });

	wss.clients.forEach((client) => {
		if (client.readyState !== WebSocket.OPEN) {
			return;
		}
		const subscribed = wsSubscriptions.get(client);
		if (subscribed && subscribed.has(symbol)) {
			client.send(message);
		}
	});
};

wss.on("connection", (ws: WebSocket) => {
	console.log("New WebSocket connection established.");
	wsSubscriptions.set(ws, new Set());
	ws.send(JSON.stringify({ type: "WELCOME", message: "Welcome to MakakaTrade" }));

	ws.on("message", (raw) => {
		try {
			const payload = JSON.parse(raw.toString()) as {
				type?: string;
				symbols?: string[];
			};

			if (payload.type === "SUBSCRIBE" && Array.isArray(payload.symbols)) {
				const symbols = payload.symbols
					.filter((symbol) => typeof symbol === "string")
					.map((symbol) => symbol.trim().toUpperCase())
					.filter(Boolean);

				wsSubscriptions.set(ws, new Set(symbols));
				updateSubscribedSymbols(
					Array.from(wsSubscriptions.values()).flatMap((set) =>
						Array.from(set),
					),
				);

				// Send any cached prices immediately
				symbols.forEach((symbol) => {
					const price = getCurrentPrice(symbol);
					if (price > 0 && ws.readyState === WebSocket.OPEN) {
						ws.send(
							JSON.stringify({
								type: "PRICE_UPDATE",
								symbol,
								price,
							}),
						);
					}
				});
			}
		} catch (error) {
			console.error("Invalid WS payload:", error);
		}
	});

	ws.on("close", () => {
		wsSubscriptions.delete(ws);
		updateSubscribedSymbols(
			Array.from(wsSubscriptions.values()).flatMap((set) => Array.from(set)),
		);
	});
});

// Start the server after initializing the database
initializeDB()
	.then(() => {
		connectToMarket((symbol: string, price: number) => {
			broadcastPrice(symbol, price);
		});
		server.listen(PORT, () => {
			console.log(`Server is running on http://localhost:${PORT}`);
		});
	})
	.catch((err) => console.error("DB Error:", err));
