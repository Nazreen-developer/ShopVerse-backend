import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";

const router = express.Router();

/* ==============================
   MULTER CONFIG
============================== */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage });

/* ==============================
   GET ALL PRODUCTS (WITH FILTER)
============================== */
router.get("/", async (req, res) => {
  try {
    const { mainCategory, subCategory } = req.query;

    let filter = {};

    if (mainCategory) {
      filter.mainCategory = mainCategory;
    }

    if (subCategory) {
      filter.subCategory = subCategory;
    }

    const products = await Product.find(filter);

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ==============================
   SEARCH PRODUCTS
============================== */
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q;

    const products = await Product.find({
      name: { $regex: q, $options: "i" },
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Search failed" });
  }
});

/* ==============================
   GET SINGLE PRODUCT
============================== */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);

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
router.post(
  "/",
  protect,
  admin,
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        name,
        description,
        price,
        discountPrice,
        countInStock,
        sku,
        mainCategory,
        subCategory,
        brand,
        sizes,
        colors,
        collections,
        material,
        gender,
      } = req.body;

      const product = new Product({
        name,
        description,
        price: Number(price),
        discountPrice: Number(discountPrice),
        countInStock: Number(countInStock),
        sku,
        mainCategory,
        subCategory,
        brand,
        sizes: sizes ? sizes.split(",") : [],
        colors: colors ? colors.split(",") : [],
        collections,
        material,
        gender,
        images: [
          {
            url: req.file ? `/uploads/${req.file.filename}` : "",
            altText: name,
          },
        ],
        user: req.user._id,
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
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const {
        name,
        description,
        price,
        discountPrice,
        countInStock,
        sku,
        mainCategory,
        subCategory,
        brand,
        sizes,
        colors,
        collections,
        material,
        gender,
      } = req.body;

      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.discountPrice = discountPrice || product.discountPrice;
      product.countInStock = countInStock || product.countInStock;
      product.sku = sku || product.sku;
      product.mainCategory = mainCategory || product.mainCategory;
      product.subCategory = subCategory || product.subCategory;
      product.brand = brand || product.brand;
      product.collections = collections || product.collections;
      product.material = material || product.material;
      product.gender = gender || product.gender;

      if (sizes) product.sizes = sizes.split(",");
      if (colors) product.colors = colors.split(",");

      if (req.file) {
        product.images = [
          {
            url: `/uploads/${req.file.filename}`,
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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();

    res.json({ message: "Product removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;