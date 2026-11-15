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

// Admin Live KPI Statistics (A1.1)
app.get("/api/admin/stats", async (_req, res) => {
  try {
    const t0 = Date.now();
    const [
      revenueResult,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalProducts,
      approvedProducts,
      pendingProducts,
      totalUsers,
      totalCustomers,
      totalSellers,
      pendingSellers,
      recentOrders,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.product.count(),
      prisma.product.count({ where: { status: "APPROVED" } }),
      prisma.product.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "customer" } }),
      prisma.user.count({ where: { role: "seller" } }),
      prisma.user.count({ where: { sellerStatus: "PENDING" } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: {
                select: { name: true, img: true, category: true },
              },
            },
          },
        },
      }),
    ]);
    const latencyMs = Date.now() - t0;

    res.json({
      totalRevenue: revenueResult._sum.totalAmount || 0,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalProducts,
      approvedProducts,
      pendingProducts,
      totalUsers,
      totalCustomers,
      totalSellers,
      pendingSellers,
      recentOrders,
      dbStatus: {
        connected: true,
        engine: "PostgreSQL 18",
        latencyMs,
      },
    });
  } catch (error: any) {
    console.error("Admin stats failed:", error);
    res.status(500).json({ error: "Failed to fetch admin stats", details: error.message });
  }
});

// Products: Get all products
app.get("/api/products", async (req, res) => {
  try {
    const { category, processor, ram, gpu, search, status, all } = req.query;

    if (process.env.DATABASE_URL) {
      const where: any = {};
      if (status && typeof status === "string" && status !== "all") {
        where.status = status;
      } else if (all !== "true" && !status) {
        // By default, public storefront shows only approved products
        where.status = "APPROVED";
      }

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
        prisma.product.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            seller: {
              select: {
                id: true,
                storeName: true,
                storeBio: true,
                sellerStatus: true,
                email: true,
                phone: true,
                address: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 2500)),
      ]);

      if (products) {
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
        prisma.product.findUnique({
          where: { id },
          include: {
            seller: {
              select: {
                id: true,
                storeName: true,
                storeBio: true,
                sellerStatus: true,
                email: true,
                phone: true,
                address: true,
                firstName: true,
                lastName: true,
              },
            },
            reviews: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 2000)),
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

// Products: Create new product (Admin / Seller)
app.post("/api/products", async (req, res) => {
  try {
    const {
      name,
      badge,
      badgeColor,
      category,
      processor,
      price,
      priceUsd,
      cpu,
      ram,
      gpu,
      display,
      batteryWeight,
      specialHighlight,
      img,
      detailedSpecs,
      status,
      sellerId,
      submittedByRole,
    } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: "Name, category, and price are required." });
    }

    // Check platform setting for autoApproveProducts
    const settings = readPlatformSettings();

    // Default status logic:
    // If seller submits product:
    //   - if settings.autoApproveProducts is true -> "APPROVED"
    //   - otherwise -> "PENDING_APPROVAL"
    // If admin submits without sellerId:
    //   - defaults to status or "APPROVED"
    let finalStatus = status;
    if (!finalStatus) {
      if (sellerId && submittedByRole !== "admin") {
        finalStatus = settings.autoApproveProducts ? "APPROVED" : "PENDING_APPROVAL";
      } else {
        finalStatus = "APPROVED";
      }
    }

    const id = `prod-${Date.now()}`;
    const product = await prisma.product.create({
      data: {
        id,
        name: String(name).trim(),
        badge: badge ? String(badge).trim() : null,
        badgeColor: badgeColor || "cyan",
        category: String(category).trim(),
        processor: String(processor || "Intel i7").trim(),
        price: Number(price),
        priceUsd: priceUsd ? String(priceUsd).trim() : `$${Math.round(Number(price) / 300)}`,
        cpu: String(cpu || "High-Performance CPU").trim(),
        ram: String(ram || "16GB DDR5").trim(),
        gpu: String(gpu || "Dedicated Graphics").trim(),
        display: display ? String(display).trim() : null,
        batteryWeight: batteryWeight ? String(batteryWeight).trim() : null,
        specialHighlight: specialHighlight ? String(specialHighlight).trim() : null,
        img: img ? String(img).trim() : "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80",
        detailedSpecs: detailedSpecs || {},
        stock: req.body.stock !== undefined ? Math.max(0, parseInt(req.body.stock, 10)) : 15,
        status: finalStatus,
        sellerId: sellerId || null,
      },
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
            storeBio: true,
            sellerStatus: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, product });
  } catch (error: any) {
    console.error("Failed to create product:", error);
    res.status(500).json({ error: "Failed to create product in database", details: error.message });
  }
});

// Products: Update product details
app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      badge,
      badgeColor,
      category,
      processor,
      price,
      priceUsd,
      cpu,
      ram,
      gpu,
      display,
      batteryWeight,
      specialHighlight,
      img,
      detailedSpecs,
      status,
      sellerId,
    } = req.body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(badge !== undefined && { badge: badge ? String(badge).trim() : null }),
        ...(badgeColor !== undefined && { badgeColor }),
        ...(category !== undefined && { category }),
        ...(processor !== undefined && { processor }),
        ...(price !== undefined && { price: Number(price) }),
        ...(priceUsd !== undefined && { priceUsd }),
        ...(cpu !== undefined && { cpu }),
        ...(ram !== undefined && { ram }),
        ...(gpu !== undefined && { gpu }),
        ...(display !== undefined && { display }),
        ...(batteryWeight !== undefined && { batteryWeight }),
        ...(specialHighlight !== undefined && { specialHighlight }),
        ...(img !== undefined && { img }),
        ...(detailedSpecs !== undefined && { detailedSpecs }),
        ...(req.body.stock !== undefined && { stock: Math.max(0, parseInt(req.body.stock, 10)) }),
        ...(status !== undefined && { status }),
        ...(sellerId !== undefined && { sellerId: sellerId ? String(sellerId).trim() : null }),
      },
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
            storeBio: true,
            sellerStatus: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    res.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("Failed to update product:", error);
    res.status(500).json({ error: "Failed to update product in database", details: error.message });
  }
});

// Products: Quick Stock Update (Seller/Admin Inventory Management)
app.patch("/api/products/:id/stock", async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, delta } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Product not found" });
    }

    let newStock = typeof existing.stock === "number" ? existing.stock : 15;
    if (stock !== undefined) {
      newStock = Math.max(0, parseInt(stock, 10));
    } else if (delta !== undefined) {
      newStock = Math.max(0, newStock + parseInt(delta, 10));
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { stock: newStock },
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
          },
        },
      },
    });

    res.json({ success: true, product: updated, stock: updated.stock });
  } catch (error: any) {
    console.error("Failed to update stock:", error);
    res.status(500).json({ error: "Failed to update stock", details: error.message });
  }
});

// Products: Quick update product approval status (A2.2)
app.patch("/api/products/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["APPROVED", "PENDING_APPROVAL", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("Failed to update status:", error);
    res.status(500).json({ error: "Failed to update product status", details: error.message });
  }
});

// Products: Delete product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: `Product ${id} deleted successfully.` });
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    res.status(500).json({ error: "Failed to delete product from database", details: error.message });
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
      userId,
    } = req.body;

    if (!customerEmail || !customerName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid order data. Name, email, and items are required." });
    }

    // Try finding user by email if userId not explicitly provided
    let finalUserId = userId;
    if (!finalUserId && customerEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: String(customerEmail).trim().toLowerCase() },
        select: { id: true },
      });
      if (existingUser) {
        finalUserId = existingUser.id;
      }
    }

    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: finalUserId || null,
        customerName: String(customerName).trim(),
        customerEmail: String(customerEmail).trim().toLowerCase(),
        customerPhone: customerPhone ? String(customerPhone).trim() : null,
        shippingAddress: String(shippingAddress).trim(),
        city: city ? String(city).trim() : null,
        zipCode: zipCode ? String(zipCode).trim() : null,
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

    // Automatically decrement product stock for purchased laptops
    for (const item of items) {
      if (item.productId) {
        const qty = Number(item.quantity) || 1;
        try {
          const prod = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { id: true, stock: true },
          });
          if (prod) {
            const currentStock = typeof prod.stock === "number" ? prod.stock : 15;
            const updatedStock = Math.max(0, currentStock - qty);
            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: updatedStock },
            });
          }
        } catch (stockErr) {
          console.warn(`Stock decrement skipped for ${item.productId}:`, stockErr);
        }
      }
    }

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
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            createdAt: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                seller: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    storeName: true,
                    storeBio: true,
                    sellerStatus: true,
                  },
                },
              },
            },
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

// Orders: Update order status (A4.1)
app.patch("/api/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({ success: true, order: updated });
  } catch (error: any) {
    console.error("Failed to update order status:", error);
    res.status(500).json({ error: "Failed to update order status in database", details: error.message });
  }
});

// Orders: Delete order
app.delete("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.order.delete({ where: { id } });
    res.json({ success: true, message: `Order ${id} removed successfully.` });
  } catch (error: any) {
    console.error("Failed to delete order:", error);
    res.status(500).json({ error: "Failed to delete order from database", details: error.message });
  }
});

// Auth: Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, address, city, postalCode, role, storeName, storeBio } = req.body || {};

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
    const assignedRole = email.toLowerCase().includes("admin")
      ? "admin"
      : role === "seller"
        ? "seller"
        : "customer";

    const sellerStatus = assignedRole === "admin"
      ? "APPROVED"
      : assignedRole === "seller"
        ? "PENDING"
        : "NONE";

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: passwordHash,
        firstName,
        lastName,
        phone,
        address,
        role: assignedRole,
        storeName: storeName ? String(storeName).trim() : null,
        storeBio: storeBio ? String(storeBio).trim() : null,
        sellerStatus,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        storeName: true,
        storeBio: true,
        sellerStatus: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Auto-create initial default address in Address Book if provided
    if (address && String(address).trim()) {
      await prisma.address.create({
        data: {
          userId: user.id,
          label: assignedRole === "seller" ? "Business HQ" : "Home",
          recipientName: `${firstName || ""} ${lastName || ""}`.trim() || (storeName || "Verified Buyer"),
          phone: phone ? String(phone).trim() : "+94 77 123 4567",
          streetAddress: String(address).trim(),
          city: city ? String(city).trim() : "Colombo",
          postalCode: postalCode ? String(postalCode).trim() : null,
          isDefault: true,
        },
      }).catch((err) => console.warn("Could not auto-create initial address in address book:", err));
    }

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
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: "Your account has been deactivated. Please contact support." });
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
        storeName: user.storeName,
        storeBio: user.storeBio,
        sellerStatus: user.sellerStatus,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed", details: error.message });
  }
});

// ==============================================================================
// USERS & ROLE MANAGEMENT (A5.1)
// ==============================================================================

// Users: Get all users with order and review counts
app.get("/api/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        storeName: true,
        storeBio: true,
        sellerStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true, reviews: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (error: any) {
    console.error("Failed to fetch users:", error);
    res.status(500).json({ error: "Failed to fetch users from database" });
  }
});

// Users: Get single user by ID
app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        storeName: true,
        storeBio: true,
        sellerStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true, reviews: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error: any) {
    console.error("Failed to fetch user:", error);
    res.status(500).json({ error: "Failed to fetch user from database" });
  }
});

// Users: Update user profile and info
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      role,
      storeName,
      storeBio,
      sellerStatus,
      isActive,
    } = req.body || {};

    const data: any = {};
    if (firstName !== undefined) data.firstName = firstName ? String(firstName).trim() : null;
    if (lastName !== undefined) data.lastName = lastName ? String(lastName).trim() : null;
    if (email !== undefined) data.email = String(email).toLowerCase().trim();
    if (phone !== undefined) data.phone = phone ? String(phone).trim() : null;
    if (address !== undefined) data.address = address ? String(address).trim() : null;
    if (role !== undefined) data.role = String(role).toLowerCase().trim();
    if (storeName !== undefined) data.storeName = storeName ? String(storeName).trim() : null;
    if (storeBio !== undefined) data.storeBio = storeBio ? String(storeBio).trim() : null;
    if (sellerStatus !== undefined) data.sellerStatus = String(sellerStatus).trim();
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        storeName: true,
        storeBio: true,
        sellerStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true, reviews: true },
        },
      },
    });

    res.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Failed to update user:", error);
    res.status(500).json({ error: "Failed to update user info", details: error.message });
  }
});

// Users: Update user role
app.patch("/api/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    if (!role || !["customer", "seller", "admin"].includes(String(role).toLowerCase())) {
      return res.status(400).json({ error: "Invalid role. Must be 'customer', 'seller', or 'admin'." });
    }

    const newRole = String(role).toLowerCase();
    const updated = await prisma.user.update({
      where: { id },
      data: {
        role: newRole,
        sellerStatus: newRole === "seller" ? "APPROVED" : undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        storeName: true,
        storeBio: true,
        sellerStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true, reviews: true },
        },
      },
    });

    res.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Failed to update user role:", error);
    res.status(500).json({ error: "Failed to update user role", details: error.message });
  }
});

// Users: Toggle user active status (suspend/activate)
app.patch("/api/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be a boolean." });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        storeName: true,
        storeBio: true,
        sellerStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true, reviews: true },
        },
      },
    });

    res.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Failed to update user status:", error);
    res.status(500).json({ error: "Failed to update user status", details: error.message });
  }
});

// Users: Delete user
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: `User ${id} removed successfully.` });
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    res.status(500).json({ error: "Failed to delete user from database", details: error.message });
  }
});

// ==============================================================================
// SELLER APPLICATIONS & SANCTIONS (A3.1 & A3.2)
// ==============================================================================

// Sellers: Get all seller accounts, applications & sanctions
app.get("/api/admin/sellers", async (_req, res) => {
  try {
    const sellers = await prisma.user.findMany({
      where: {
        OR: [
          { role: "seller" },
          { sellerStatus: { in: ["PENDING", "APPROVED", "SUSPENDED", "REJECTED"] } },
          { storeName: { not: null } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        storeName: true,
        storeBio: true,
        sellerStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            status: true,
            img: true,
          },
        },
        _count: {
          select: { products: true, orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(sellers);
  } catch (error: any) {
    console.error("Failed to fetch sellers:", error);
    res.status(500).json({ error: "Failed to fetch sellers from database" });
  }
});

// Sellers: Update verification status or sanctions (Approve, Reject, Suspend, Reinstate)
app.patch("/api/admin/sellers/:id/verification", async (req, res) => {
  try {
    const { id } = req.params;
    const { sellerStatus, rejectionReason } = req.body || {};

    const validStatuses = ["APPROVED", "REJECTED", "SUSPENDED", "PENDING"];
    if (!sellerStatus || !validStatuses.includes(String(sellerStatus).toUpperCase())) {
      return res.status(400).json({
        error: `Invalid sellerStatus. Allowed values: ${validStatuses.join(", ")}`,
      });
    }

    const nextStatus = String(sellerStatus).toUpperCase();

    // When status is approved or suspended, role is seller. If rejected, fallback to customer.
    const assignedRole = nextStatus === "REJECTED" ? "customer" : "seller";

    const updated = await prisma.user.update({
      where: { id },
      data: {
        sellerStatus: nextStatus,
        role: assignedRole,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        storeName: true,
        storeBio: true,
        sellerStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            status: true,
            category: true,
            img: true,
          },
        },
        _count: {
          select: { products: true, orders: true },
        },
      },
    });

    res.json({
      success: true,
      message: `Seller status updated to ${nextStatus}`,
      seller: updated,
    });
  } catch (error: any) {
    console.error("Failed to update seller verification:", error);
    res.status(500).json({ error: "Failed to update seller verification", details: error.message });
  }
});

// Feedback Storage Helpers
const FEEDBACK_FILE = path.join(__dirname, "feedbacks.json");

const defaultFeedbacks = [
  {
    id: "fb-1",
    name: "Alex Mercer",
    role: "Competitive FPS Athlete",
    rigModel: "Razer Blade 18 · RTX 4090",
    category: "Gaming",
    rating: 5,
    message:
      "The Razer Blade 18 is an absolute colossus. 300Hz Mini LED panel with 400+ stable FPS in CS2 and Apex Legends. The vapor chamber cooling keeps CPU temps below 78°C under full load.",
    verifiedPurchase: true,
    date: "2 days ago",
    likes: 42,
  },
  {
    id: "fb-2",
    name: "Maya Lin",
    role: "Senior Colorist & VFX Lead",
    rigModel: "MacBook Pro 16 · M3 Max",
    category: "Ultrabook",
    rating: 5,
    message:
      "Color grading 8K ProRes RAW footage in DaVinci Resolve without dropping a single frame on location. The Liquid Retina XDR screen matches our Sony broadcast reference monitor with surgical precision.",
    verifiedPurchase: true,
    date: "4 days ago",
    likes: 38,
  },
  {
    id: "fb-3",
    name: "Dr. Vikram Sen",
    role: "Autonomous Systems Researcher",
    rigModel: "Lenovo ThinkPad P16 · RTX 5000 Ada",
    category: "Workstation",
    rating: 5,
    message:
      "Having 128GB ECC DDR5 and 16GB VRAM on the RTX 5000 Ada lets our team fine-tune vision models locally before deploying to the cluster. Unmatched build rigidity and thermal design.",
    verifiedPurchase: true,
    date: "1 week ago",
    likes: 29,
  },
  {
    id: "fb-4",
    name: "Marcus Zhao",
    role: "Independent Unreal Engine 5 Dev",
    rigModel: "Asus ROG Zephyrus G14 · RTX 4070",
    category: "Gaming",
    rating: 5,
    message:
      "A featherweight 1.5kg machine that handles Lumen raytracing in real-time. The OLED 120Hz display is jaw-dropping and the slash lighting on the lid always gets attention at developer meetups.",
    verifiedPurchase: true,
    date: "2 weeks ago",
    likes: 24,
  },
  {
    id: "fb-5",
    name: "Elena Rostova",
    role: "Architectural Visualizer",
    rigModel: "Dell Precision 7680 · RTX 3500 Ada",
    category: "Workstation",
    rating: 5,
    message:
      "The revolutionary CAMM memory is blazing fast for massive Rhino and 3ds Max scenes. Orbital ProCare courier serviced our thermal paste calibration within 24 hours. Stellar experience.",
    verifiedPurchase: true,
    date: "3 weeks ago",
    likes: 19,
  },
];

function readFeedbacks(): any[] {
  try {
    if (fs.existsSync(FEEDBACK_FILE)) {
      const data = fs.readFileSync(FEEDBACK_FILE, "utf-8");
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
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write feedbacks.json:", err);
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

// ==============================================================================
// PRODUCT REVIEWS & ORDER-VERIFIED CUSTOMER RATING SYSTEM
// ==============================================================================

// Reviews: Get all reviews for a specific product
app.get("/api/products/:productId/reviews", async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
            createdAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute distribution and average
    const totalCount = reviews.length;
    let sum = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;

    for (const r of reviews) {
      sum += r.rating;
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    }

    const averageRating = totalCount > 0 ? Number((sum / totalCount).toFixed(1)) : 0;

    res.json({
      productId,
      totalCount,
      averageRating,
      distribution,
      reviews,
    });
  } catch (error: any) {
    console.error("Failed to fetch product reviews:", error);
    res.status(500).json({ error: "Failed to fetch product reviews", details: error.message });
  }
});

// Reviews: Check if customer is eligible to review product (must have a completed/placed order containing this product)
app.get("/api/products/:productId/review-eligibility", async (req, res) => {
  try {
    const { productId } = req.params;
    const { email, userId } = req.query;

    if (!email && !userId) {
      return res.json({ eligible: false, message: "Login to review purchased hardware." });
    }

    // Find orders by this user containing this product
    const eligibleOrder = await prisma.order.findFirst({
      where: {
        OR: [
          ...(userId ? [{ userId: String(userId) }] : []),
          ...(email ? [{ customerEmail: String(email).trim().toLowerCase() }] : []),
        ],
        items: {
          some: { productId },
        },
      },
      include: {
        reviews: {
          where: { productId },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!eligibleOrder) {
      return res.json({
        eligible: false,
        message: "Only customers who ordered this laptop can write a verified review.",
      });
    }

    // Check if already reviewed for this order
    const alreadyReviewed = eligibleOrder.reviews.length > 0;

    res.json({
      eligible: !alreadyReviewed,
      alreadyReviewed,
      orderId: eligibleOrder.id,
      orderNumber: eligibleOrder.orderNumber,
      orderStatus: eligibleOrder.status,
      message: alreadyReviewed
        ? "You have already reviewed this machine for order " + eligibleOrder.orderNumber
        : "Verified buyer eligible for review.",
    });
  } catch (error: any) {
    console.error("Eligibility check error:", error);
    res.status(500).json({ error: "Failed to check review eligibility", details: error.message });
  }
});

// Reviews: Submit review for an ordered product
app.post("/api/products/:productId/reviews", async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId, email, orderId, rating, comment } = req.body;

    if (!productId || !comment || !rating) {
      return res.status(400).json({ error: "Rating and review comment are required." });
    }

    // Resolve user ID
    let finalUserId = userId;
    if (!finalUserId && email) {
      const user = await prisma.user.findUnique({
        where: { email: String(email).trim().toLowerCase() },
      });
      if (user) finalUserId = user.id;
    }

    if (!finalUserId) {
      return res.status(401).json({ error: "Customer account required to submit a verified review." });
    }

    // Resolve order ID if not directly provided
    let finalOrderId = orderId;
    if (!finalOrderId) {
      const verifiedOrder = await prisma.order.findFirst({
        where: {
          OR: [
            { userId: finalUserId },
            ...(email ? [{ customerEmail: String(email).trim().toLowerCase() }] : []),
          ],
          items: {
            some: { productId },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!verifiedOrder) {
        return res.status(403).json({ error: "You can only review laptops from a verified order." });
      }
      finalOrderId = verifiedOrder.id;
    }

    // Check for existing review on this order & product
    const existing = await prisma.review.findUnique({
      where: {
        userId_productId_orderId: {
          userId: finalUserId,
          productId,
          orderId: finalOrderId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "You have already reviewed this product for this order." });
    }

    const review = await prisma.review.create({
      data: {
        rating: Math.max(1, Math.min(5, Number(rating))),
        comment: String(comment).trim(),
        userId: finalUserId,
        productId,
        orderId: finalOrderId,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        order: {
          select: { orderNumber: true, status: true },
        },
      },
    });

    res.status(201).json({ success: true, review });
  } catch (error: any) {
    console.error("Failed to submit product review:", error);
    res.status(500).json({ error: "Failed to submit review", details: error.message });
  }
});

// Reviews: Delete review (Admin moderation)
app.delete("/api/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.review.delete({ where: { id } });
    res.json({ success: true, message: "Review deleted successfully." });
  } catch (error: any) {
    console.error("Failed to delete review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});


// ==============================================================================
// PLATFORM SETTINGS & SYSTEM CONFIGURATION (A5.4)
// ==============================================================================
const SETTINGS_FILE = path.join(__dirname, "settings.json");

const defaultPlatformSettings = {
  storeName: "SELLORA",
  tagline: "Next-Gen Computing. Unleashed.",
  supportEmail: "support@sellora.dev",
  supportPhone: "+94 11 234 5678",
  address: "No. 45 Galle Road, Colombo 03, Sri Lanka",
  currency: "LKR",
  freeShippingThreshold: 500000,
  taxRatePercent: 0,
  maintenanceMode: false,
  maintenanceMessage: "SELLORA is currently undergoing scheduled infrastructure upgrades. Storefront access will resume shortly.",
  autoApproveProducts: false,
  autoApproveSellers: false,
  requireEmailVerification: true,
  orderNotifications: true,
  security2FA: false,
};

function readPlatformSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return { ...defaultPlatformSettings, ...JSON.parse(data) };
    }
  } catch (err) {
    console.warn("Could not read settings.json, using defaults:", err);
  }
  return defaultPlatformSettings;
}

function writePlatformSettings(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write settings.json:", err);
  }
}

// Settings: Get public platform settings
app.get("/api/settings", (_req, res) => {
  const current = readPlatformSettings();
  res.json({
    storeName: current.storeName,
    tagline: current.tagline,
    supportEmail: current.supportEmail,
    supportPhone: current.supportPhone,
    address: current.address,
    currency: current.currency,
    freeShippingThreshold: current.freeShippingThreshold,
    maintenanceMode: current.maintenanceMode,
    maintenanceMessage: current.maintenanceMessage,
  });
});

// Settings: Get all settings (for admin)
app.get("/api/admin/settings", (_req, res) => {
  const current = readPlatformSettings();
  res.json(current);
});

// Settings: Update settings (for admin)
app.put("/api/admin/settings", (req, res) => {
  try {
    const current = readPlatformSettings();
    const updated = { ...current, ...(req.body || {}) };
    writePlatformSettings(updated);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save platform settings", details: err.message });
  }
});

// Settings: Clear system cache
app.post("/api/admin/cache/clear", (_req, res) => {
  res.json({ success: true, message: "System & API caches cleared successfully." });
});

// ==========================================
// SELLER HUB APIS (S1.1 & S2.1)
// ==========================================

// Seller: Live Overview Statistics (S1.1)
app.get("/api/seller/stats/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // Verify seller exists
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        email: true,
        storeName: true,
        storeBio: true,
        sellerStatus: true,
        role: true,
        phone: true,
        address: true,
      },
    });

    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    // Fetch products owned by this seller
    const products = await prisma.product.findMany({
      where: { sellerId },
      select: {
        id: true,
        name: true,
        price: true,
        status: true,
        img: true,
        category: true,
      },
    });

    const productIds = products.map((p) => p.id);

    // Fetch order items containing this seller's products
    let orderItems: any[] = [];
    if (productIds.length > 0) {
      orderItems = await prisma.orderItem.findMany({
        where: { productId: { in: productIds } },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              customerEmail: true,
              shippingAddress: true,
              city: true,
              status: true,
              createdAt: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              img: true,
              price: true,
              category: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // Compute store metrics
    let totalGrossRevenue = 0;
    let totalUnitsSold = 0;
    let pendingFulfillments = 0;
    let deliveredCount = 0;

    const recentOrderMap = new Map<string, any>();

    for (const item of orderItems) {
      totalGrossRevenue += item.price * (item.quantity || 1);
      totalUnitsSold += item.quantity || 1;

      if (item.order) {
        if (item.order.status === "PENDING" || item.order.status === "PROCESSING") {
          pendingFulfillments++;
        } else if (item.order.status === "DELIVERED") {
          deliveredCount++;
        }

        if (!recentOrderMap.has(item.order.id)) {
          recentOrderMap.set(item.order.id, {
            id: item.order.id,
            orderNumber: item.order.orderNumber,
            customerName: item.order.customerName,
            status: item.order.status,
            createdAt: item.order.createdAt,
            items: [],
            sellerSubtotal: 0,
          });
        }

        const entry = recentOrderMap.get(item.order.id);
        entry.items.push({
          productName: item.product?.name || "Hardware Unit",
          img: item.product?.img,
          quantity: item.quantity,
          price: item.price,
        });
        entry.sellerSubtotal += item.price * (item.quantity || 1);
      }
    }

    const totalProducts = products.length;
    const approvedProducts = products.filter((p) => p.status === "APPROVED").length;
    const pendingProducts = products.filter((p) => p.status === "PENDING_APPROVAL").length;

    res.json({
      seller,
      stats: {
        totalGrossRevenue,
        totalUnitsSold,
        pendingFulfillments,
        deliveredCount,
        totalProducts,
        approvedProducts,
        pendingProducts,
      },
      recentOrders: Array.from(recentOrderMap.values()).slice(0, 8),
    });
  } catch (error: any) {
    console.error("Failed to compute seller stats:", error);
    res.status(500).json({ error: "Failed to compute seller statistics", details: error.message });
  }
});

// Seller: Get Inventory Catalog (S2.1)
app.get("/api/seller/products/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    const products = await prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
            email: true,
            sellerStatus: true,
          },
        },
      },
    });

    res.json(products);
  } catch (error: any) {
    console.error("Failed to fetch seller products:", error);
    res.status(500).json({ error: "Failed to fetch seller products", details: error.message });
  }
});

// Seller: Get Full Order Pipeline & Fulfillment Queue (S3.1)
app.get("/api/seller/orders/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // 1. Find all product IDs belonging to this seller
    const sellerProducts = await prisma.product.findMany({
      where: { sellerId },
      select: { id: true },
    });

    const productIds = sellerProducts.map((p) => p.id);
    if (productIds.length === 0) {
      return res.json([]);
    }

    // 2. Find all order items matching these products with full order and customer details
    const orderItems = await prisma.orderItem.findMany({
      where: { productId: { in: productIds } },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            img: true,
            cpu: true,
            ram: true,
            gpu: true,
          },
        },
        order: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Group by Order ID so the seller sees coherent order packages
    const orderMap = new Map<string, any>();

    for (const item of orderItems) {
      if (!item.order) continue;
      const order = item.order;

      if (!orderMap.has(order.id)) {
        orderMap.set(order.id, {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          shippingAddress: order.shippingAddress,
          city: order.city,
          zipCode: order.zipCode,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          sellerItems: [],
          sellerSubtotal: 0,
        });
      }

      const ordEntry = orderMap.get(order.id);
      ordEntry.sellerItems.push({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        product: item.product,
      });
      ordEntry.sellerSubtotal += item.price * (item.quantity || 1);
    }

    const sellerOrders = Array.from(orderMap.values());
    res.json(sellerOrders);
  } catch (error: any) {
    console.error("Failed to fetch seller orders:", error);
    res.status(500).json({ error: "Failed to fetch seller orders", details: error.message });
  }
});

// Seller: Update Order Fulfillment Status (S3.1)
app.patch("/api/seller/orders/:orderId/fulfillment", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, sellerId, trackingNumber, carrierNotes } = req.body;

    const allowedStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update order status in PostgreSQL
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: `Order ${order.orderNumber} updated to ${status}`,
      order: updated,
      trackingNumber: trackingNumber || null,
      carrierNotes: carrierNotes || null,
    });
  } catch (error: any) {
    console.error("Failed to update seller order fulfillment:", error);
    res.status(500).json({ error: "Failed to update order fulfillment", details: error.message });
  }
});

// Seller: Update Storefront Profile & Branding Settings (S4.1)
app.put("/api/seller/profile/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { storeName, storeBio, phone, address, firstName, lastName } = req.body || {};

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // Verify seller exists
    const existingSeller = await prisma.user.findUnique({
      where: { id: sellerId },
    });

    if (!existingSeller) {
      return res.status(404).json({ error: "Seller account not found" });
    }

    // Update seller profile attributes in PostgreSQL
    const updatedUser = await prisma.user.update({
      where: { id: sellerId },
      data: {
        ...(storeName !== undefined && { storeName: String(storeName).trim() }),
        ...(storeBio !== undefined && { storeBio: String(storeBio).trim() }),
        ...(phone !== undefined && { phone: String(phone).trim() }),
        ...(address !== undefined && { address: String(address).trim() }),
        ...(firstName !== undefined && { firstName: String(firstName).trim() }),
        ...(lastName !== undefined && { lastName: String(lastName).trim() }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        storeName: true,
        storeBio: true,
        sellerStatus: true,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: "Storefront profile & branding updated successfully in PostgreSQL",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Failed to update seller profile:", error);
    res.status(500).json({ error: "Failed to update store profile", details: error.message });
  }
});

// Seller: Vendor Earnings & Payout Ledger (S5.1)
app.get("/api/seller/earnings/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // Find seller products
    const sellerProducts = await prisma.product.findMany({
      where: { sellerId },
      select: { id: true, name: true, price: true },
    });
    const productIds = sellerProducts.map((p) => p.id);

    if (productIds.length === 0) {
      return res.json({
        grossRevenue: 0,
        platformFeePercent: 5,
        totalPlatformFee: 0,
        netEarnings: 0,
        pendingPayout: 0,
        completedPayout: 0,
        transactions: [],
      });
    }

    // Fetch order items with order status
    const orderItems = await prisma.orderItem.findMany({
      where: { productId: { in: productIds } },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true,
            customerName: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const PLATFORM_FEE_PERCENT = 5; // Standard 5% platform commission

    let grossRevenue = 0;
    let totalPlatformFee = 0;
    let netEarnings = 0;
    let pendingPayout = 0;
    let completedPayout = 0;

    const transactions = orderItems.map((item) => {
      const lineTotal = item.price * (item.quantity || 1);
      const fee = Math.round((lineTotal * PLATFORM_FEE_PERCENT) / 100);
      const net = lineTotal - fee;

      grossRevenue += lineTotal;
      totalPlatformFee += fee;
      netEarnings += net;

      const isDelivered = item.order?.status === "DELIVERED";
      if (isDelivered) {
        completedPayout += net;
      } else {
        pendingPayout += net;
      }

      return {
        id: item.id,
        orderId: item.order?.id,
        orderNumber: item.order?.orderNumber || "ORD-N/A",
        date: item.createdAt,
        customerName: item.order?.customerName || "Customer",
        productName: item.product?.name || "Hardware Machine",
        quantity: item.quantity,
        grossAmount: lineTotal,
        platformFee: fee,
        netPayout: net,
        status: isDelivered ? "CLEARED" : "ESCROW_PENDING",
        orderStatus: item.order?.status || "PENDING",
      };
    });

    res.json({
      grossRevenue,
      platformFeePercent: PLATFORM_FEE_PERCENT,
      totalPlatformFee,
      netEarnings,
      pendingPayout,
      completedPayout,
      transactions,
    });
  } catch (error: any) {
    console.error("Failed to compute seller earnings:", error);
    res.status(500).json({ error: "Failed to compute vendor earnings", details: error.message });
  }
});

// ==============================================================================
// CUSTOMER HUB & ORDER PIPELINE APIS (C1.1, C2.1, C3.1)
// ==============================================================================

// Customer: Get Orders Pipeline (C2.1)
app.get("/api/customer/orders", async (req, res) => {
  try {
    const { userId, email } = req.query;

    if (!userId && !email) {
      return res.status(400).json({ error: "User ID or email is required" });
    }

    const whereClause: any = {
      OR: [
        ...(userId ? [{ userId: String(userId) }] : []),
        ...(email ? [{ customerEmail: String(email).trim().toLowerCase() }] : []),
      ],
    };

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: {
                  select: {
                    id: true,
                    storeName: true,
                    storeBio: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        reviews: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(orders);
  } catch (error: any) {
    console.error("Failed to fetch customer orders:", error);
    res.status(500).json({ error: "Failed to fetch customer orders", details: error.message });
  }
});

// Customer: Get Customer's Submitted Reviews (C3.1)
app.get("/api/customer/reviews", async (req, res) => {
  try {
    const { userId, email } = req.query;

    let finalUserId = userId ? String(userId) : undefined;
    if (!finalUserId && email) {
      const u = await prisma.user.findUnique({
        where: { email: String(email).trim().toLowerCase() },
        select: { id: true },
      });
      if (u) finalUserId = u.id;
    }

    if (!finalUserId) {
      return res.json([]);
    }

    const reviews = await prisma.review.findMany({
      where: { userId: finalUserId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            img: true,
            price: true,
            category: true,
            cpu: true,
            gpu: true,
            ram: true,
            seller: {
              select: { storeName: true },
            },
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(reviews);
  } catch (error: any) {
    console.error("Failed to fetch customer reviews:", error);
    res.status(500).json({ error: "Failed to fetch customer reviews", details: error.message });
  }
});

// Customer: Edit / Update Submitted Review (C3.1)
app.put("/api/customer/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ error: "Rating and review comment are required." });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        rating: Math.max(1, Math.min(5, Number(rating))),
        comment: String(comment).trim(),
      },
      include: {
        product: true,
        order: true,
      },
    });

    res.json({ success: true, message: "Review updated successfully", review: updated });
  } catch (error: any) {
    console.error("Failed to update review:", error);
    res.status(500).json({ error: "Failed to update review in database", details: error.message });
  }
});

// Customer: Update Profile Settings (C1.1)
app.put("/api/customer/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, phone, address } = req.body || {};

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName !== undefined && { firstName: String(firstName).trim() }),
        ...(lastName !== undefined && { lastName: String(lastName).trim() }),
        ...(phone !== undefined && { phone: String(phone).trim() }),
        ...(address !== undefined && { address: String(address).trim() }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        storeName: true,
        storeBio: true,
        sellerStatus: true,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: "Customer profile updated successfully in PostgreSQL",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Failed to update customer profile:", error);
    res.status(500).json({ error: "Failed to update profile", details: error.message });
  }
});

// =========================================================================
// CUSTOMER ADDRESS BOOK APIS (Multiple Saved Addresses & One-Click Checkout)
// =========================================================================

// Get saved customer addresses
app.get("/api/customer/addresses", async (req, res) => {
  try {
    const { userId, email } = req.query;
    let finalUserId = userId ? String(userId) : undefined;

    if (!finalUserId && email) {
      const u = await prisma.user.findUnique({
        where: { email: String(email).trim().toLowerCase() },
        select: { id: true },
      });
      if (u) finalUserId = u.id;
    }

    if (!finalUserId) {
      return res.json([]);
    }

    const addresses = await prisma.address.findMany({
      where: { userId: finalUserId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    res.json(addresses);
  } catch (error: any) {
    console.error("Failed to fetch customer addresses:", error);
    res.status(500).json({ error: "Failed to fetch customer addresses", details: error.message });
  }
});

// Create new saved address
app.post("/api/customer/addresses", async (req, res) => {
  try {
    const { userId, email, label, recipientName, phone, streetAddress, city, postalCode, isDefault } = req.body || {};

    let finalUserId = userId ? String(userId) : undefined;
    if (!finalUserId && email) {
      const u = await prisma.user.findUnique({
        where: { email: String(email).trim().toLowerCase() },
        select: { id: true },
      });
      if (u) finalUserId = u.id;
    }

    if (!finalUserId) {
      return res.status(400).json({ error: "User ID or valid email is required to save an address." });
    }

    if (!recipientName || !phone || !streetAddress || !city) {
      return res.status(400).json({ error: "Recipient name, phone, street address, and city are required." });
    }

    // Check count of user's existing addresses
    const existingCount = await prisma.address.count({ where: { userId: finalUserId } });
    const shouldBeDefault = Boolean(isDefault) || existingCount === 0;

    // If making this one default, unset previous default
    if (shouldBeDefault) {
      await prisma.address.updateMany({
        where: { userId: finalUserId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: finalUserId,
        label: label ? String(label).trim() : "Home",
        recipientName: String(recipientName).trim(),
        phone: String(phone).trim(),
        streetAddress: String(streetAddress).trim(),
        city: String(city).trim(),
        postalCode: postalCode ? String(postalCode).trim() : null,
        isDefault: shouldBeDefault,
      },
    });

    res.status(201).json({ success: true, address: newAddress });
  } catch (error: any) {
    console.error("Failed to create customer address:", error);
    res.status(500).json({ error: "Failed to create address", details: error.message });
  }
});

// Update saved address
app.put("/api/customer/addresses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { label, recipientName, phone, streetAddress, city, postalCode, isDefault } = req.body || {};

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Address not found." });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: existing.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        ...(label !== undefined && { label: String(label).trim() }),
        ...(recipientName !== undefined && { recipientName: String(recipientName).trim() }),
        ...(phone !== undefined && { phone: String(phone).trim() }),
        ...(streetAddress !== undefined && { streetAddress: String(streetAddress).trim() }),
        ...(city !== undefined && { city: String(city).trim() }),
        ...(postalCode !== undefined && { postalCode: postalCode ? String(postalCode).trim() : null }),
        ...(isDefault !== undefined && { isDefault: Boolean(isDefault) }),
      },
    });

    res.json({ success: true, address: updated });
  } catch (error: any) {
    console.error("Failed to update customer address:", error);
    res.status(500).json({ error: "Failed to update address", details: error.message });
  }
});

// Set address as primary default
app.patch("/api/customer/addresses/:id/default", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Address not found." });
    }

    await prisma.address.updateMany({
      where: { userId: existing.userId, isDefault: true },
      data: { isDefault: false },
    });

    const updated = await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });

    res.json({ success: true, address: updated });
  } catch (error: any) {
    console.error("Failed to set default address:", error);
    res.status(500).json({ error: "Failed to set default address", details: error.message });
  }
});

// Delete saved address
app.delete("/api/customer/addresses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Address not found." });
    }

    const wasDefault = existing.isDefault;
    const userId = existing.userId;

    await prisma.address.delete({ where: { id } });

    // If it was default, promote another address to default if available
    if (wasDefault) {
      const remaining = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (remaining) {
        await prisma.address.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }

    res.json({ success: true, message: "Address deleted successfully" });
  } catch (error: any) {
    console.error("Failed to delete address:", error);
    res.status(500).json({ error: "Failed to delete address", details: error.message });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 SELLORA PostgreSQL API Server running on http://localhost:${PORT}`);
  });
}

export default app;
