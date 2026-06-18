import express, { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { getDB } from "../database.js";
import { SECRET_KEY } from "../config/secret.js";
import { DB, User } from "../types/types.js";
import { resolveAvatarDataUrl } from "../utils/avatar.js";

// Create a router for authentication routes
const router: Router = express.Router();

type FirebaseServiceAccount = {
        projectId: string;
        clientEmail: string;
        privateKey: string;
};

const stripWrappingQuotes = (value: string): string => {
        if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
        ) {
                return value.slice(1, -1);
        }
        return value;
};

const getFirebaseServiceAccount = (): FirebaseServiceAccount | null => {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;

        if (projectId && clientEmail && privateKey) {
                return {
                        projectId: stripWrappingQuotes(projectId),
                        clientEmail: stripWrappingQuotes(clientEmail),
                        privateKey: stripWrappingQuotes(privateKey).replace(/\\n/g, "\n"),
                };
        }

        const serviceAccountPaths = [
                path.resolve(process.cwd(), "serviceAccountKey.json"),
                path.resolve(process.cwd(), "src/serviceAccountKey.json"),
        ];

        for (const serviceAccountPath of serviceAccountPaths) {
                if (!existsSync(serviceAccountPath)) {
                        continue;
                }

                const parsed = JSON.parse(readFileSync(serviceAccountPath, "utf-8")) as {
                        project_id?: string;
                        client_email?: string;
                        private_key?: string;
                };

                if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
                        continue;
                }

                return {
                        projectId: parsed.project_id,
                        clientEmail: parsed.client_email,
                        privateKey: parsed.private_key,
                };
        }

        return null;
};

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
        try {
                const serviceAccount = getFirebaseServiceAccount();
                if (!serviceAccount) {
                        throw new Error(
                                "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or provide backend-project/serviceAccountKey.json.",
                        );
                }

                initializeApp({
                        credential: cert({
                                projectId: serviceAccount.projectId,
                                clientEmail: serviceAccount.clientEmail,
                                privateKey: serviceAccount.privateKey,
                        }),
                });
                console.log("Firebase Admin initialized.");
        } catch (error) {
                console.warn("Firebase Admin SDK not initialized:", error);
        }
}

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

                if (!user.password) {
                        res.status(400).json({ message: "This account uses Google sign-in." });
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
                        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Lax for dev cross-origin
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

        if (getApps().length === 0) {
                res.status(500).json({ message: "Firebase is not configured on the server." });
                return;
        }

        if (!credential) {
                res.status(400).json({ message: "Google credential is required." });
                return;
        }

        try {
                const decodedToken = await getAuth().verifyIdToken(credential);
                const googleId = decodedToken.uid;
                const email = decodedToken.email || null;
                const avatar = await resolveAvatarDataUrl(decodedToken.picture || null);
                const baseUsername =
                        (email ? email.split("@")[0] : decodedToken.name) || `user_${googleId.slice(0, 6)}`;

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
                        user = await db.get<User>("SELECT * FROM users WHERE id = ?", [user.id]);
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
