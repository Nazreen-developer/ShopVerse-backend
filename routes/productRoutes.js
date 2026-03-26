import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js"; // ✅ USE CONFIG FILE
import streamifier from "streamifier";

const router = express.Router();

/* ==============================
   MULTER MEMORY STORAGE
============================== */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ==============================
   CLOUDINARY UPLOAD HELPER
============================== */
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "products" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

/* ==============================
   GET ALL PRODUCTS
============================== */
router.get("/", async (req, res) => {
  try {
    const { mainCategory, subCategory } = req.query;

    let filter = {};
    if (mainCategory) filter.mainCategory = mainCategory;
    if (subCategory) filter.subCategory = subCategory;

    const products = await Product.find(filter);
    res.json(products);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ==============================
   GET SINGLE PRODUCT
============================== */
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ==============================
   CREATE PRODUCT
============================== */
router.post("/", protect, admin, upload.single("image"), async (req, res) => {
  try {
    let imageUrl = "";

    // ✅ Upload to Cloudinary
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price) || 0,
      discountPrice: Number(req.body.discountPrice) || 0,
      countInStock: Number(req.body.countInStock) || 0,
      sku: req.body.sku,
      mainCategory: req.body.mainCategory,
      subCategory: req.body.subCategory,
      brand: req.body.brand,
      collections: req.body.collections,
      material: req.body.material,
      gender: req.body.gender,
      sizes: req.body.sizes ? req.body.sizes.split(",") : [],
      colors: req.body.colors ? req.body.colors.split(",") : [],
      images: imageUrl
        ? [{ url: imageUrl, altText: req.body.name }]
        : [],
      user: req.user._id,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Create failed" });
  }
});

/* ==============================
   UPDATE PRODUCT
============================== */
router.put("/:id", protect, admin, upload.single("image"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Update fields safely
    product.name = req.body.name || product.name;
    product.description = req.body.description || product.description;
    product.price = Number(req.body.price) || product.price;
    product.discountPrice = Number(req.body.discountPrice) || product.discountPrice;
    product.countInStock = Number(req.body.countInStock) || product.countInStock;
    product.sku = req.body.sku || product.sku;
    product.mainCategory = req.body.mainCategory || product.mainCategory;
    product.subCategory = req.body.subCategory || product.subCategory;
    product.brand = req.body.brand || product.brand;
    product.collections = req.body.collections || product.collections;
    product.material = req.body.material || product.material;
    product.gender = req.body.gender || product.gender;

    if (req.body.sizes) product.sizes = req.body.sizes.split(",");
    if (req.body.colors) product.colors = req.body.colors.split(",");

    // ✅ Upload new image if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);

      product.images = [
        {
          url: result.secure_url,
          altText: product.name,
        },
      ];
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Update failed" });
  }
});

/* ==============================
   DELETE PRODUCT
============================== */
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;