import express, { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { getDB } from "../database.js";
import { SECRET_KEY } from "../config/secret.js";
import { DB, User } from "../types/types.js";
import { resolveAvatarDataUrl } from "../utils/avatar.js";

// Create a router for authentication routes
const router: Router = express.Router();

const getGoogleClientId = (): string | null => {
	const clientId = process.env.GOOGLE_CLIENT_ID;
	if (!clientId) {
		return null;
	}
	return clientId;
};

const sanitizeUsername = (value: string): string => {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "")
		.replace(/^\d+/, "");
};

const buildUniqueUsername = async (db: DB, base: string): Promise<string> => {
	const cleaned = sanitizeUsername(base);
	const safeBase = cleaned.length > 0 ? cleaned : "user";
	let username = safeBase;
	let suffix = 1;

	while (true) {
		const existing = await db.get<User>("SELECT * FROM users WHERE username = ?", [username]);
		if (!existing) return username;
		username = `${safeBase}${suffix}`;
		suffix += 1;
	}
};

// User Registration Endpoint
router.post("/register", async (req: Request, res: Response): Promise<void> => {
	const { username, password, avatar } = req.body;
	const db = getDB();

	if (!username || !password) {
		res.status(400).json({ message: "Username and password are required." });
		return;
	}

	try {
		const existingUser = await db.get<User>("SELECT * FROM users WHERE username = ?", [username]);
		if (existingUser) {
			res.status(400).json({ message: "Username already exists." });
			return;
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		await db.run("INSERT INTO users (username, password, avatar) VALUES (?, ?, ?)", [
			username,
			hashedPassword,
			avatar,
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
		const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
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
		const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, {
			expiresIn: "1h",
		});

		// Set token in HTTP-only cookie
		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production", // Use secure cookies in production
			sameSite: "strict", // Prevent CSRF
			maxAge: 3600000, // 1 hour
		});

		await db.run(
			`INSERT INTO profile_activity (user_id, event_type, title, meta)
			VALUES (?, 'login', 'Signed in', ?)`,
			[user.id, JSON.stringify({ method: "password" })],
		);

		res.json({
			message: "Login successful.",
			user: {
				id: user.id,
				username: user.username,
				avatar: user.avatar,
				balance: user.balance,
			},
		});
	} catch (error) {
		console.error("Error during login:", error);
		res.status(500).json({ message: "Internal server error." });
	}
});

// User Logout Endpoint
router.post("/logout", (_req: Request, res: Response): void => {
	res.clearCookie("token");
	res.json({ message: "Logout successful." });
});

// Google Login Endpoint
router.post("/google", async (req: Request, res: Response): Promise<void> => {
	const { credential } = req.body;
	const db = getDB();
	const googleClientId = getGoogleClientId();

	if (!googleClientId) {
		res.status(500).json({ message: "Google client ID is not configured." });
		return;
	}

	if (!credential) {
		res.status(400).json({ message: "Google credential is required." });
		return;
	}

	try {
		const client = new OAuth2Client(googleClientId);
		const ticket = await client.verifyIdToken({
			idToken: credential,
			audience: googleClientId,
		});
		const payload = ticket.getPayload();

		if (!payload || !payload.sub) {
			res.status(400).json({ message: "Invalid Google token." });
			return;
		}

		const googleId = payload.sub;
		const email = payload.email || null;
		const avatar = await resolveAvatarDataUrl(payload.picture || null);
		const baseUsername =
			(email ? email.split("@")[0] : payload.name) || `user_${googleId.slice(0, 6)}`;

		let user = await db.get<User>("SELECT * FROM users WHERE google_id = ? OR email = ?", [
			googleId,
			email,
		]);

		if (!user) {
			const username = await buildUniqueUsername(db, baseUsername);
			await db.run(
				"INSERT INTO users (username, password, avatar, google_id, email) VALUES (?, ?, ?, ?, ?)",
				[username, null, avatar, googleId, email],
			);
			user = await db.get<User>("SELECT * FROM users WHERE google_id = ?", [googleId]);
		} else {
			await db.run(
				"UPDATE users SET avatar = COALESCE(?, avatar), email = COALESCE(?, email), google_id = COALESCE(?, google_id) WHERE id = ?",
				[avatar, email, googleId, user.id],
			);
		}

		if (!user) {
			res.status(500).json({ message: "Failed to create user." });
			return;
		}

		const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, {
			expiresIn: "1h",
		});

		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 3600000,
		});

		await db.run(
			`INSERT INTO profile_activity (user_id, event_type, title, meta)
			VALUES (?, 'login', 'Signed in with Google', ?)`,
			[user.id, JSON.stringify({ method: "google" })],
		);

		res.json({
			message: "Login successful.",
			user: {
				id: user.id,
				username: user.username,
				avatar: user.avatar,
				balance: user.balance,
			},
		});
	} catch (error) {
		console.error("Error during Google login:", error);
		res.status(500).json({ message: "Google login failed." });
	}
});

export default router;
