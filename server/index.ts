import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check & Database Connection Status
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "connected",
      database: "PostgreSQL",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: "disconnected",
      database: "PostgreSQL",
      error: error.message || "Database connection error",
      timestamp: new Date().toISOString(),
    });
  }
});

// Products: Get all products
app.get("/api/products", async (req, res) => {
  try {
    const { category, processor, ram, gpu, search } = req.query;

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

    const products = await prisma.product.findMany({
      where,
      orderBy: { id: "asc" },
    });

    res.json(products);
  } catch (error: any) {
    console.error("Failed to fetch products:", error);
    res.status(500).json({ error: "Failed to fetch products from database" });
  }
});

// Products: Get single product by ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error: any) {
    console.error("Failed to fetch product:", error);
    res.status(500).json({ error: "Failed to fetch product from database" });
  }
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

app.listen(PORT, () => {
  console.log(`🚀 SELLORA PostgreSQL API Server running on http://localhost:${PORT}`);
});
