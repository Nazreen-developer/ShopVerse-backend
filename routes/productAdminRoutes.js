import express from "express";
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
   GET ALL PRODUCTS
============================== */
router.get("/", protect, admin, async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
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
        description,
      } = req.body;

      const product = new Product({
        user: req.user._id,

        name,
        description,
        price: Number(price),
        discountPrice: Number(discountPrice) || 0,
        countInStock: Number(countInStock),
        sku,

        mainCategory,
        subCategory,

        brand,

        sizes: sizes ? JSON.parse(sizes) : [],
        colors: colors ? JSON.parse(colors) : [],

        collections,
        material,
        gender,

        images: req.file
          ? [
              {
                url: `/uploads/${req.file.filename}`,
                altText: name,
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

      const {
        name,
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
        description,
      } = req.body;

      product.name = name;
      product.description = description;
      product.price = Number(price);
      product.discountPrice = Number(discountPrice) || 0;
      product.countInStock = Number(countInStock);
      product.sku = sku;

      product.mainCategory = mainCategory;
      product.subCategory = subCategory;

      product.brand = brand;

      product.sizes = sizes ? JSON.parse(sizes) : [];
      product.colors = colors ? JSON.parse(colors) : [];

      product.collections = collections;
      product.material = material;
      product.gender = gender;

      if (req.file) {
        product.images = [
          {
            url: `/uploads/${req.file.filename}`,
            altText: name,
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
    console.error(error);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;