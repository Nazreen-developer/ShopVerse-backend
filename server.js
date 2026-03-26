import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import productRoute from "./routes/productRoutes.js";
import userRoute from "./routes/userRoutes.js";
import cartRoute from "./routes/cartRoutes.js";
import orderRoute from "./routes/orderRoutes.js";
import checkoutRoute from "./routes/checkoutRoutes.js";
import uploadRoute from "./routes/uploadRoutes.js";
import adminRoute from "./routes/adminRoutes.js";
import productAdminRoute from "./routes/productAdminRoutes.js";
import adminOrderRoute from "./routes/adminOrderRoutes.js";

dotenv.config();

const app = express();

/* ==============================
   MIDDLEWARE
============================== */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://shop-verse-eight.vercel.app",
    ],
    credentials: true,
  })
);

/* ==============================
   ROUTES
============================== */
app.use("/api/products", productRoute);
app.use("/api/users", userRoute);
app.use("/api/carts", cartRoute);
app.use("/api/checkout", checkoutRoute);
app.use("/api/orders", orderRoute);
app.use("/api/upload", uploadRoute);

app.use("/api/admin/users", adminRoute);
app.use("/api/admin/products", productAdminRoute);
app.use("/api/admin/orders", adminOrderRoute);

/* ==============================
   HEALTH CHECK
============================== */
app.get("/", (req, res) => {
  res.send("API is running...");
});

/* ==============================
   DATABASE CONNECTION
============================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database Connected Successfully!");

    const PORT = process.env.PORT || 3500;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB Error:", err);
  });