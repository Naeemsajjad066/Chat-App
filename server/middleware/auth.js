import User from "../models/User.js";
import jwt from "jsonwebtoken";

/**
 * Protects routes — verifies JWT and attaches req.user.
 * Accepts token from custom `token` header OR standard `Authorization: Bearer`.
 */
export const protectRoute = async (req, res, next) => {
  try {
    const token =
      req.headers.token ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password").lean();
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }
    next(error);
  }
};
