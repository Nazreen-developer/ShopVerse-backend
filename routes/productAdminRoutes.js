import express from "express";
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
   MULTER MEMORY STORAGE (IMPORTANT)
============================== */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ==============================
   UPLOAD TO CLOUDINARY
============================== */
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "products" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

/* ==============================
   GET ALL PRODUCTS (ADMIN)
============================== */
router.get("/", protect, admin, async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
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

      // ✅ Upload to Cloudinary
      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
      }

      const product = new Product({
        user: req.user._id,

        name: req.body.name,
        description: req.body.description,

        price: Number(req.body.price),
        discountPrice: Number(req.body.discountPrice) || 0,
        countInStock: Number(req.body.countInStock),
        sku: req.body.sku,

        mainCategory: req.body.mainCategory,
        subCategory: req.body.subCategory,

        brand: req.body.brand,

        sizes: req.body.sizes ? JSON.parse(req.body.sizes) : [],
        colors: req.body.colors ? JSON.parse(req.body.colors) : [],

        collections: req.body.collections,
        material: req.body.material,
        gender: req.body.gender,

        images: imageUrl
          ? [
              {
                url: imageUrl,
                altText: req.body.name,
              },
            ]
          : [],
      });

      const createdProduct = await product.save();
      res.status(201).json(createdProduct);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Product creation failed" });
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
        return res.status(404).json({ message: "Product not found" });
      }

      Object.assign(product, {
        name: req.body.name,
        description: req.body.description,
        price: Number(req.body.price),
        discountPrice: Number(req.body.discountPrice) || 0,
        countInStock: Number(req.body.countInStock),
        sku: req.body.sku,
        mainCategory: req.body.mainCategory,
        subCategory: req.body.subCategory,
        brand: req.body.brand,
        collections: req.body.collections,
        material: req.body.material,
        gender: req.body.gender,
      });

      if (req.body.sizes) product.sizes = JSON.parse(req.body.sizes);
      if (req.body.colors) product.colors = JSON.parse(req.body.colors);

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
  }
);

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
    res.json({ message: "Product removed" });

  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;