import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById
} from "../controllers/orderController.js";

import { protect } from "../middleware/authMiddleware.js";
import { protectOptional } from "../middleware/protectOptional.js"; // new

const router = express.Router();

// ==============================
// CREATE ORDER - allow guest
// ==============================
router.post("/", protectOptional, createOrder);

// ==============================
// GET USER ORDERS - still protected
// ==============================
router.get("/", protect, getOrders);

// ==============================
// GET ORDER BY ID - still protected
// ==============================
router.get("/:id", protect, getOrderById);

export default router;