
import dns from "node:dns";
import "dotenv/config";

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import {
  Product,
  Customer,
  Order,
  Feedback
} from "./models.js";

import {
  pushToPowerBI,
  orderToRows
} from "./powerbi.js";

// ==========================================
// 1. DNS CONFIGURATION
// ==========================================

dns.setServers(["8.8.8.8", "1.1.1.1"]);

console.log("LUMOON API starting...");

// ==========================================
// 2. EXPRESS CONFIGURATION
// ==========================================

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173"
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("LUMOON API is running successfully!");
});

// ==========================================
// 3. LOYALTY TIER CALCULATION
// ==========================================

const tierFor = (pts) =>
  pts >= 1500
    ? "Heirloom"
    : pts >= 500
      ? "Companion"
      : "Cuddle";

// ==========================================
// 4. PRODUCTS API
// ==========================================

// GET all products

app.get("/api/products", async (_req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error("Products error:", err);
    res.status(500).json({ error: "Could not fetch products" });
  }
});

// ==========================================
// 5. ORDERS API
// ==========================================

// POST new order

app.post("/api/orders", async (req, res) => {
  try {
    const {
      name,
      email,
      region = "India",
      channel = "Official Site",
      items
    } = req.body;

    if (!email || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "email and items are required"
      });
    }

    const lines = [];
    let total = 0;

    for (const { productId, qty = 1 } of items) {
      if (!Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({
          error: "Quantity must be a positive integer"
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          error: `Product ${productId} not found`
        });
      }

      if (product.stock < qty) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}`
        });
      }

      lines.push({
        productId: product._id,
        name: product.name,
        collection: product.collection,
        qty,
        price: product.price
      });

      total += product.price * qty;
    }

    // Calculate loyalty points

    const pointsEarned = Math.floor(total / 10);

    // Save order in MongoDB

    const order = await Order.create({
      customerEmail: email,
      customerName: name,
      region,
      channel,
      items: lines,
      total,
      pointsEarned
    });

    // Update stock after order creation

    for (const line of lines) {
      await Product.updateOne(
        { _id: line.productId },
        { $inc: { stock: -line.qty } }
      );
    }

    // Update customer loyalty points

    const customer = await Customer.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          name,
          region
        },
        $inc: {
          loyaltyPoints: pointsEarned
        }
      },
      {
        upsert: true,
        new: true
      }
    );

    customer.tier = tierFor(customer.loyaltyPoints);

    await customer.save();

    // Push order to Power BI

    Promise.resolve()
      .then(() => pushToPowerBI(orderToRows(order)))
      .catch((err) => {
        console.error("Power BI push failed:", err.message);
      });

    res.status(201).json(order);

  } catch (err) {
    console.error("Order creation error:", err);

    res.status(500).json({
      error: "Could not place order"
    });
  }
});

// ==========================================
// 6. CUSTOMER DASHBOARD API
// ==========================================

app.get("/api/customer/:email", async (req, res) => {
  try {
    const email = req.params.email;

    const customer = await Customer.findOne({ email });

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found"
      });
    }

    const orders = await Order.find({
      customerEmail: email
    }).sort({ createdAt: -1 });

    const nextTier =
      customer.loyaltyPoints >= 1500
        ? null
        : customer.loyaltyPoints >= 500
          ? 1500
          : 500;

    res.json({
      customer,
      orders,
      nextTierAt: nextTier
    });

  } catch (err) {
    console.error("Customer dashboard error:", err);

    res.status(500).json({
      error: "Could not fetch customer details"
    });
  }
});

// ==========================================
// 7. FEEDBACK / CSAT API
// ==========================================

app.post("/api/feedback", async (req, res) => {
  try {
    const feedback = await Feedback.create(req.body);

    res.status(201).json(feedback);

  } catch (err) {
    console.error("Feedback error:", err);

    res.status(500).json({
      error: "Could not save feedback"
    });
  }
});

// ==========================================
// 8. ADMIN DASHBOARD API
// ==========================================

app.get("/api/admin/stats", async (_req, res) => {
  try {

    // Overall sales and orders

    const [totals] = await Order.aggregate([
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          orders: { $sum: 1 }
        }
      }
    ]);

    // Collection-wise revenue

    const byCollection = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.collection",
          revenue: {
            $sum: {
              $multiply: [
                "$items.qty",
                "$items.price"
              ]
            }
          },
          units: { $sum: "$items.qty" }
        }
      }
    ]);

    // Region-wise sales

    const byRegion = await Order.aggregate([
      {
        $group: {
          _id: "$region",
          revenue: { $sum: "$total" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Customer satisfaction

    const [csat] = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          avg: { $avg: "$rating" },
          satisfied: {
            $sum: {
              $cond: [
                { $gte: ["$rating", 4] },
                1,
                0
              ]
            }
          },
          n: { $sum: 1 }
        }
      }
    ]);

    // Total customers

    const customers = await Customer.countDocuments();

    // Low-stock products

    const lowStock = await Product.find({
      stock: { $lt: 20 }
    }).select("name stock");

    // Recent orders

    const recent = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      revenue: totals?.revenue || 0,
      orders: totals?.orders || 0,
      customers,
      csatPercent: csat
        ? Math.round((csat.satisfied / csat.n) * 100)
        : null,
      byCollection,
      byRegion,
      lowStock,
      recent
    });

  } catch (err) {
    console.error("Admin stats error:", err);

    res.status(500).json({
      error: "Could not fetch admin statistics"
    });
  }
});

// ==========================================
// 9. HEALTH CHECK API
// ==========================================

app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    application: "LUMOON",
    database: mongoose.connection.readyState === 1
      ? "Connected"
      : "Disconnected",
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 10. SERVER BOOT
// ==========================================

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function startServer() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    console.log("Connecting to MongoDB Atlas...");

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, () => {
      console.log("-----------------------------------");
      console.log("LUMOON SERVER STARTED");
      console.log(`API: http://localhost:${PORT}`);
      console.log("-----------------------------------");
    });

  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

startServer();
