import express from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ==========================
   Helper to get cart by user or guest
========================== */
const getCart = async (userId, guestId) => {
  if (userId) return await Cart.findOne({ user: userId });
  if (guestId) return await Cart.findOne({ guestId });
  return null;
};

/* ==========================
   Add product to cart
========================== */
router.post("/", async (req, res) => {
  try {
    const { productId, quantity, size, color, guestId, userId } = req.body;
    if (!productId || !quantity) return res.status(400).json({ message: "ProductId and quantity required" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await getCart(userId, guestId);

    if (cart) {
      const index = cart.products.findIndex(
        (p) => p.productId.toString() === productId && p.size === size && p.color === color
      );

      if (index > -1) cart.products[index].quantity += quantity;
      else
        cart.products.push({
          productId,
          name: product.name,
          image: product.images?.[0]?.url || "",
          price: product.price,
          size,
          color,
          quantity,
        });

      cart.totalPrice = cart.products.reduce((acc, item) => acc + item.price * item.quantity, 0);
      await cart.save();
      return res.status(200).json(cart);
    }

    // New cart
    const newCart = await Cart.create({
      user: userId || undefined,
      guestId: guestId || `guest_${Date.now()}`,
      products: [{ productId, name: product.name, image: product.images?.[0]?.url || "", price: product.price, size, color, quantity }],
      totalPrice: product.price * quantity,
    });

    res.status(201).json(newCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ==========================
   Update product quantity
========================== */
router.put("/", async (req, res) => {
  try {
    const { productId, quantity, size, color, guestId, userId } = req.body;
    const cart = await getCart(userId, guestId);
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const index = cart.products.findIndex(
      (p) => p.productId.toString() === productId && p.size === size && p.color === color
    );
    if (index === -1) return res.status(404).json({ message: "Product not found in cart" });

    if (quantity > 0) cart.products[index].quantity = quantity;
    else cart.products.splice(index, 1);

    cart.totalPrice = cart.products.reduce((acc, item) => acc + item.price * item.quantity, 0);
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ==========================
   Delete single product or entire cart
========================== */
router.delete("/", async (req, res) => {
  try {
    const { productId, size, color, guestId, userId } = req.body;
    const cart = await getCart(userId, guestId);
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    if (productId) {
      // Remove single product
      const index = cart.products.findIndex(
        (p) => p.productId.toString() === productId && p.size === size && p.color === color
      );
      if (index === -1) return res.status(404).json({ message: "Product not found in cart" });
      cart.products.splice(index, 1);
      cart.totalPrice = cart.products.reduce((acc, item) => acc + item.price * item.quantity, 0);
      await cart.save();
      return res.status(200).json(cart);
    }

    // Remove entire cart
    await Cart.findByIdAndDelete(cart._id);
    res.status(200).json({ message: "Cart deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ==========================
   Get cart
========================== */
router.get("/", async (req, res) => {
  try {
    const { guestId, userId } = req.query;
    const cart = await getCart(userId, guestId);
    if (cart) return res.json(cart);
    res.status(404).json({ message: "Cart not found" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ==========================
   Merge guest cart on login
========================== */
router.post("/merge", protect, async (req, res) => {
  try {
    const { guestId } = req.body;
    const guestCart = await Cart.findOne({ guestId });
    const userCart = await Cart.findOne({ user: req.user._id });

    if (!guestCart) return userCart ? res.status(200).json(userCart) : res.status(404).json({ message: "Guest cart not found" });
    if (guestCart.products.length === 0) return res.status(400).json({ message: "Guest cart is empty" });

    if (userCart) {
      guestCart.products.forEach((item) => {
        const index = userCart.products.findIndex(
          (p) => p.productId.toString() === item.productId.toString() && p.size === item.size && p.color === item.color
        );
        if (index > -1) userCart.products[index].quantity += item.quantity;
        else userCart.products.push(item);
      });
      userCart.totalPrice = userCart.products.reduce((acc, item) => acc + item.price * item.quantity, 0);
      await userCart.save();
      await Cart.findByIdAndDelete(guestCart._id);
      return res.status(200).json(userCart);
    }

    guestCart.user = req.user._id;
    guestCart.guestId = undefined;
    await guestCart.save();
    res.status(200).json(guestCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;