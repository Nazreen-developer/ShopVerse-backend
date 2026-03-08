import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";

import productRoute from "./routes/productRoutes.js";
import userRoute from "./routes/userRoutes.js";
import cartRoute from "./routes/cartRoutes.js";
import orderRoute from "./routes/orderRoutes.js";
import checkoutRoute from "./routes/checkoutRoutes.js";
import uploadRoute from "./routes/uploadRoutes.js";
import adminRoute from "./routes/adminRoutes.js";
import productAdminRoute from "./routes/prodcutAdminRoutes.js";
import adminOrderRoute from "./routes/adminOrderRoutes.js";

import Product from "./models/Product.js";
import products from "./data/products.js";
import dns from "node:dns/promises";
import path from "path";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
dotenv.config();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use(
  cors({
    origin: 'http://localhost:5173', // removed trailing slash
    credentials: true,
  })
);

app.use("/api/products", productRoute);
app.use("/api/users", userRoute);
app.use("/api/carts", cartRoute);
app.use("/api/checkout", checkoutRoute);
app.use("/api/orders", orderRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/admin/users", adminRoute);
app.use("/api/admin/products", productAdminRoute);
app.use("/uploads", express.static("uploads"));
app.use("/api/admin/orders", adminOrderRoute);

app.get("/api/seed", async (req, res) => {
  try {
    await Product.deleteMany();
    await Product.insertMany(products);
    res.send("Database Seeded");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

mongoose.connect('mongodb+srv://nazreenb2512_db_user:vHcCE1S90zsn2CZ7@cluster1.5vhxha0.mongodb.net/demo')
  .then(() => {
    console.log('Database Connected Successfully!');
    app.listen(3500, () => {
      console.log('Server is running on port 3500');
    });
  })
  .catch((err) => console.log(err));