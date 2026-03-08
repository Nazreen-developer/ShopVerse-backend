import User from "../models/User.js";
import jwt from "jsonwebtoken";

// ==============================
// PROTECT ROUTES
// ==============================
const protect = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userId = decoded.user?.id || decoded.id;

      req.user = await User.findById(userId).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      next();
    } else {
      return res
        .status(401)
        .json({ message: "Not authorized, no token provided" });
    }
  } catch (error) {
    console.error("Token Verification Failed:", error);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// ==============================
// ADMIN MIDDLEWARE
// ==============================
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Not authorized as admin" });
  }
};

export { protect, admin };