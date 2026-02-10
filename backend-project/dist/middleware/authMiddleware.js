import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config/secret.js";
// Middleware to authenticate JWT token from cookies
export const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        res.status(401).json({ message: "Access denied. No token provided." });
        return;
    }
    // Verify token
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // Attach user info to request object
        next();
    }
    catch (err) {
        res.clearCookie("token");
        res.status(400).json({ message: "Invalid token." });
        return;
    }
};
//# sourceMappingURL=authMiddleware.js.map