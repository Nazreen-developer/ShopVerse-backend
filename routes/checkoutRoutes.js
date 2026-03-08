import express from "express";
import Checkout from "../models/Checkout.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


// ==============================
// CREATE CHECKOUT
// ==============================
router.post("/", async (req, res) => {
  try {

    const { checkoutItems, shippingAddress, paymentMethod, totalPrice } = req.body;

    if (!checkoutItems || checkoutItems.length === 0) {
      return res.status(400).json({ message: "No items in checkout" });
    }

    const formattedItems = checkoutItems.map((item) => ({
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity || 1,
      product: item.product || item.productId || item._id
    }));

    const newCheckout = await Checkout.create({
      checkoutItems: formattedItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      paymentStatus: "Pending",
      isPaid: false
    });

    res.status(201).json(newCheckout);

  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ==============================
// MARK PAYMENT AS PAID
// ==============================
router.put("/:id/pay", async (req, res) => {

  try {

    const { paymentStatus, paymentDetails } = req.body;

    const checkout = await Checkout.findById(req.params.id);

    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    if (paymentStatus !== "paid") {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    checkout.isPaid = true;
    checkout.paymentStatus = paymentStatus;
    checkout.paymentDetails = paymentDetails;
    checkout.paidAt = Date.now();

    await checkout.save();

    res.status(200).json(checkout);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


// ==============================
// FINALIZE ORDER
// ==============================
router.post("/:id/finalize", async (req, res) => {

  try {

    const checkout = await Checkout.findById(req.params.id);

    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    if (!checkout.isPaid) {
      return res.status(400).json({ message: "Checkout not paid yet" });
    }

    const finalOrder = await Order.create({
      orderItems: checkout.checkoutItems.map((item) => ({
        productId: item.product,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity
      })),
      shippingAddress: checkout.shippingAddress,
      paymentMethod: checkout.paymentMethod,
      totalPrice: checkout.totalPrice,
      isPaid: true,
      paidAt: checkout.paidAt,
      isDelivered: false
    });

    await Cart.deleteMany({});

    res.status(201).json(finalOrder);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;