import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns/promises";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");

import Product from "./models/Product.js";
import User from "./models/User.js";
import Cart from "./models/Cart.js";
import productsData from "./data/products.js";

dotenv.config();

const seedData = async () => {
  try {
    // 🔥 CONNECT FIRST
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected for Seeding");

    await Product.deleteMany();
    await User.deleteMany();
    await Cart.deleteMany();

    const createdUser = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "123456",
      role: "admin",
    });

    const sampleProducts = productsData.map((product) => {
      return { ...product, user: createdUser._id };
    });

    await Product.insertMany(sampleProducts);

    console.log("Data Seeded Successfully!");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();