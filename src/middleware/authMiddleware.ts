import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config/secret.js";
import { Response, NextFunction } from "express";
import { AuthRequest, JWTPayload } from "../types/types.js";

// Middleware to authenticate JWT token from cookies
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ message: "Access denied. No token provided." });
    return;
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as JWTPayload;
    req.user = decoded; // Attach user info to request object
    next();
  } catch (err) {
    res.clearCookie("token");
    res.status(400).json({ message: "Invalid token." });
    return;
  }
};
