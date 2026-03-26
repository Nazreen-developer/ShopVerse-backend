import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

/* ==============================
   CLOUDINARY CONFIG
============================== */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ==============================
   MULTER MEMORY STORAGE
============================== */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ==============================
   HELPER: UPLOAD TO CLOUDINARY
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
      return res.status(404).json({ message: "Not found" });
    }

    res.json(product);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

/* ==============================
   CREATE PRODUCT
============================== */
router.post(
  "/",
  protect,
  admin,
  upload.single("image"),
  async (req, res) => {
    try {
      let imageUrl = "";

      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
      }

      const product = new Product({
        ...req.body,
        price: Number(req.body.price),
        discountPrice: Number(req.body.discountPrice),
        countInStock: Number(req.body.countInStock),
        sizes: req.body.sizes ? req.body.sizes.split(",") : [],
        colors: req.body.colors ? req.body.colors.split(",") : [],
        images: imageUrl
          ? [{ url: imageUrl, altText: req.body.name }]
          : [],
        user: req.user._id,
      });

      const created = await product.save();
      res.status(201).json(created);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Create failed" });
    }
  }
);

/* ==============================
   UPDATE PRODUCT
============================== */
router.put(
  "/:id",
  protect,
  admin,
  upload.single("image"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Not found" });
      }

      Object.assign(product, {
        ...req.body,
        price: Number(req.body.price),
        discountPrice: Number(req.body.discountPrice),
        countInStock: Number(req.body.countInStock),
      });

      if (req.body.sizes) product.sizes = req.body.sizes.split(",");
      if (req.body.colors) product.colors = req.body.colors.split(",");

      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer);

        product.images = [
          {
            url: result.secure_url,
            altText: product.name,
          },
        ];
      }

      const updated = await product.save();
      res.json(updated);

    } catch (error) {
      res.status(500).json({ message: "Update failed" });
    }
  }
);

/* ==============================
   DELETE PRODUCT
============================== */
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Not found" });
    }

    await product.deleteOne();
    res.json({ message: "Deleted" });

  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;