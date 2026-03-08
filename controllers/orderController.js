// controllers/orderController.js
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";

/* ==========================
   CREATE ORDER
========================== */
export const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, totalPrice, guestId, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    // Format order items
    const formattedItems = orderItems.map((item) => {
      const productId = item.productId || item.product || item._id;

      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID in order item");
      }

      return {
        productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity || item.qty || 1,
        color: item.color || "",
        size: item.size || "",
      };
    });

    // Create order: logged-in user or guest
    const order = await Order.create({
      user: req.user ? req.user._id : null,
      guestId: !req.user ? guestId || null : null,
      orderItems: formattedItems,
      shippingAddress,
      totalPrice,
      paymentMethod: paymentMethod || "COD",
      isPaid: false,
      isDelivered: false,
      paymentStatus: "pending",
      status: "Processing",
    });

    // Automatically remove guest cart after order
    if (guestId) {
      await Cart.findOneAndDelete({ guestId });
    }

    res.status(201).json(order);

  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      message: error.message || "Server Error",
    });
  }
};

/* ==========================
   GET ALL ORDERS (for admin or logged-in users)
========================== */
export const getOrders = async (req, res) => {
  try {
    // Logged-in user: show only their orders
    // Admin can implement role check to fetch all orders
    const filter = req.user ? { user: req.user._id } : {};

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ==========================
   GET ORDER BY ID
========================== */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(id).populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Logged-in users can only access their own orders
    if (req.user && order.user && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden: Cannot access this order" });
    }

    res.json(order);

  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};