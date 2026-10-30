
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";
import mongoose from "mongoose";
import { Product } from "./models.js";

const products = [
  {
    name: "Luna the Moon Bear",
    character: "Luna",
    collection: "Core",
    price: 1499,
    emoji: "🐻",
    story: "Luna guards bedtime dreams and hums when you are sad."
  },
  {
    name: "Pip the Star Bunny",
    character: "Pip",
    collection: "Core",
    price: 1299,
    emoji: "🐰",
    story: "Pip collects fallen stars and gifts one to every friend."
  },
  {
    name: "Ollie the Cloud Owl",
    character: "Ollie",
    collection: "Core",
    price: 1399,
    emoji: "🦉",
    story: "Ollie keeps secrets safe inside his fluffy feathers."
  },
  {
    name: "Frost Fox (Winter Drop)",
    character: "Frost",
    collection: "Seasonal Limited",
    price: 1899,
    emoji: "🦊",
    story: "Frost appears only when the first snow falls."
  },
  {
    name: "Diwali Glow Elephant",
    character: "Glow",
    collection: "Seasonal Limited",
    price: 1999,
    emoji: "🐘",
    story: "Glow lights up every home with warmth and sweets."
  },
  {
    name: "Lumoon x Studio Collab Panda",
    character: "Bao",
    collection: "Collaboration",
    price: 2299,
    emoji: "🐼",
    story: "Bao is a limited collaboration companion with a numbered collectible card."
  }
];

try {
  console.log("Connecting to MongoDB Atlas...");

  await mongoose.connect(process.env.MONGO_URI);

  console.log("MongoDB Connected Successfully!");

  await Product.deleteMany({});
  console.log("Existing products cleared.");

  await Product.insertMany(products);

  console.log(`Successfully seeded ${products.length} products!`);

} catch (error) {
  console.error("Database Error:", error.message);
  process.exitCode = 1;

} finally {
  await mongoose.disconnect();
}
