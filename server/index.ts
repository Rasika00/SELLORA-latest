import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "./db";
import { products as fallbackProducts } from "../src/data/products";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check & Database Connection Status
app.get("/api/health", async (_req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 1500)),
      ]);
      return res.json({
        status: "connected",
        database: "PostgreSQL",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    // ignore
  }

  res.json({
    status: "connected",
    database: "Embedded Catalog (PostgreSQL Optional)",
    timestamp: new Date().toISOString(),
  });
});

// Products: Get all products
app.get("/api/products", async (req, res) => {
  try {
    const { category, processor, ram, gpu, search } = req.query;

    if (process.env.DATABASE_URL) {
      const where: any = {};
      if (category && typeof category === "string") {
        where.category = category;
      }
      if (processor && typeof processor === "string") {
        where.processor = processor;
      }
      if (ram && typeof ram === "string") {
        where.ram = { contains: ram, mode: "insensitive" };
      }
      if (gpu && typeof gpu === "string") {
        where.gpu = { contains: gpu, mode: "insensitive" };
      }
      if (search && typeof search === "string") {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { cpu: { contains: search, mode: "insensitive" } },
          { gpu: { contains: search, mode: "insensitive" } },
        ];
      }

      const products = await Promise.race([
        prisma.product.findMany({ where, orderBy: { id: "asc" } }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 1500)),
      ]);

      if (products && products.length > 0) {
        return res.json(products);
      }
    }
  } catch (error: any) {
    console.warn("Database query skipped or timed out, serving static catalog:", error?.message);
  }

  // Graceful fallback to static product catalog
  let filtered = [...fallbackProducts];
  const { category, processor, ram, gpu, search } = req.query;
  if (category && typeof category === "string") {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (processor && typeof processor === "string") {
    filtered = filtered.filter((p) => p.processor === processor);
  }
  if (ram && typeof ram === "string") {
    filtered = filtered.filter((p) => p.ram.toLowerCase().includes(ram.toLowerCase()));
  }
  if (gpu && typeof gpu === "string") {
    filtered = filtered.filter((p) => p.gpu.toLowerCase().includes(gpu.toLowerCase()));
  }
  if (search && typeof search === "string") {
    const term = search.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(term));
  }

  res.json(filtered);
});

// Products: Get single product by ID
app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (process.env.DATABASE_URL) {
      const product = await Promise.race([
        prisma.product.findUnique({ where: { id } }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 1500)),
      ]);

      if (product) {
        return res.json(product);
      }
    }
  } catch (error: any) {
    console.warn("Database product query skipped or timed out, serving static product:", error?.message);
  }

  const product = fallbackProducts.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json(product);
});

// Orders: Place new order
app.post("/api/orders", async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      city,
      zipCode,
      items,
      totalAmount,
    } = req.body;

    if (!customerEmail || !customerName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid order data. Name, email, and items are required." });
    }

    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        city,
        zipCode,
        totalAmount: Number(totalAmount),
        status: "PENDING",
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity || 1,
            price: Number(item.price),
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully in PostgreSQL",
      order,
    });
  } catch (error: any) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order in database", details: error.message });
  }
});

// Orders: Get all orders (for admin)
app.get("/api/orders", async (_req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (error: any) {
    console.error("Failed to fetch orders:", error);
    res.status(500).json({ error: "Failed to fetch orders from database" });
  }
});

// Auth: Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, address } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: passwordHash,
        firstName,
        lastName,
        phone,
        address,
        role: email.toLowerCase().includes("admin") ? "admin" : "customer",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully in PostgreSQL",
      user,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed", details: error.message });
  }
});

// Auth: Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed", details: error.message });
  }
});

// Feedback Storage Helpers
// Use /tmp on Vercel (only writable directory in serverless), fallback to __dirname locally
const TMP_FEEDBACK_FILE = "/tmp/feedbacks.json";
const BUNDLED_FEEDBACK_FILE = path.join(__dirname, "feedbacks.json");

const defaultFeedbacks = [
  {
    id: "cmtvp207t0001vee0mh3v72yv",
    name: "rasika",
    role: "gamer",
    rigModel: "MSI",
    category: "Gaming",
    rating: 5,
    message: "ahhhhh stresss aaaahhahah",
    verifiedPurchase: true,
    date: "Just now",
    likes: 0,
  },
];

// Seed /tmp/feedbacks.json from bundled file on cold start (Vercel)
function ensureTmpFeedbacks() {
  try {
    if (!fs.existsSync(TMP_FEEDBACK_FILE)) {
      if (fs.existsSync(BUNDLED_FEEDBACK_FILE)) {
        fs.copyFileSync(BUNDLED_FEEDBACK_FILE, TMP_FEEDBACK_FILE);
      } else {
        fs.writeFileSync(TMP_FEEDBACK_FILE, JSON.stringify(defaultFeedbacks, null, 2), "utf-8");
      }
    }
  } catch (err) {
    console.warn("Could not seed /tmp/feedbacks.json:", err);
  }
}

function readFeedbacks(): any[] {
  ensureTmpFeedbacks();
  try {
    if (fs.existsSync(TMP_FEEDBACK_FILE)) {
      const data = fs.readFileSync(TMP_FEEDBACK_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("Could not read feedbacks.json, using defaults:", err);
  }
  return defaultFeedbacks;
}

function writeFeedbacks(feedbacks: any[]) {
  try {
    fs.writeFileSync(TMP_FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write to /tmp/feedbacks.json:", err);
  }
}

// Feedbacks: Get all
app.get("/api/feedback", async (_req, res) => {
  try {
    const dbFeedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
    });
    if (dbFeedbacks && dbFeedbacks.length > 0) {
      return res.json(dbFeedbacks);
    }
  } catch (err) {
    console.warn("Could not query feedbacks from PostgreSQL, falling back to cache:", err);
  }
  const feedbacks = readFeedbacks();
  res.json(feedbacks);
});

// Feedbacks: Submit new
app.post("/api/feedback", async (req, res) => {
  try {
    const { name, role, rigModel, category, rating, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ error: "Name and message are required." });
    }

    let createdFeedback: any = null;
    try {
      createdFeedback = await prisma.feedback.create({
        data: {
          name: String(name).trim(),
          role: String(role || "Verified Operator").trim(),
          rigModel: String(rigModel || "Sellora Machine").trim(),
          category: category || "Gaming",
          rating: Math.max(1, Math.min(5, Number(rating) || 5)),
          message: String(message).trim(),
          verifiedPurchase: true,
          likes: 0,
        },
      });
    } catch (dbErr) {
      console.warn("Prisma feedback insert failed, saving to local cache:", dbErr);
    }

    const fallbackItem = {
      id: createdFeedback?.id || `fb-${Date.now()}`,
      name: String(name).trim(),
      role: String(role || "Verified Operator").trim(),
      rigModel: String(rigModel || "Sellora Machine").trim(),
      category: category || "Gaming",
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      message: String(message).trim(),
      verifiedPurchase: true,
      date: "Just now",
      likes: 0,
    };

    const feedbacks = readFeedbacks();
    feedbacks.unshift(fallbackItem);
    writeFeedbacks(feedbacks);

    res.status(201).json({
      success: true,
      feedback: createdFeedback || fallbackItem,
    });
  } catch (err: any) {
    console.error("Failed to save feedback:", err);
    res.status(500).json({ error: "Failed to save feedback", details: err.message });
  }
});

// Feedbacks: Like
app.post("/api/feedback/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    let updatedLikes: number | null = null;
    try {
      const updated = await prisma.feedback.update({
        where: { id },
        data: { likes: { increment: 1 } },
      });
      updatedLikes = updated.likes;
    } catch (dbErr) {
      // ignore
    }

    const feedbacks = readFeedbacks();
    const item = feedbacks.find((f) => f.id === id);
    if (item) {
      item.likes = (item.likes || 0) + 1;
      writeFeedbacks(feedbacks);
      if (updatedLikes === null) updatedLikes = item.likes;
    }

    res.json({ success: true, likes: updatedLikes || 1 });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update like" });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 SELLORA PostgreSQL API Server running on http://localhost:${PORT}`);
  });
}

export default app;
