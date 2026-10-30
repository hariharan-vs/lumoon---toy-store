import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: String,
  character: String, // character name for the story-driven plush
  story: String,
  collection: String, // Core | Seasonal Limited | Collaboration
  price: Number,
  stock: { type: Number, default: 100 },
  emoji: String,
});

const customerSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  region: String,
  loyaltyPoints: { type: Number, default: 0 },
  tier: { type: String, default: "Cuddle" },
  createdAt: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
  customerEmail: String,
  customerName: String,
  region: String,
  channel: String, // Official Site | Marketplace | Pop-up | Gift Shop
  items: [
    {
      productId: mongoose.Schema.Types.ObjectId,
      name: String,
      collection: String,
      qty: Number,
      price: Number,
    },
  ],
  total: Number,
  pointsEarned: Number,
  createdAt: { type: Date, default: Date.now },
});

const feedbackSchema = new mongoose.Schema({
  customerEmail: String,
  rating: Number, // 1-5, used for CSAT
  comment: String,
  createdAt: { type: Date, default: Date.now },
});

export const Product = mongoose.model("Product", productSchema);
export const Customer = mongoose.model("Customer", customerSchema);
export const Order = mongoose.model("Order", orderSchema);
export const Feedback = mongoose.model("Feedback", feedbackSchema);
