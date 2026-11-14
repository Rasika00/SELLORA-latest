import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { products } from "../src/data/products";
import { initialFeedbacks } from "../src/data/feedbacks";

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return "NULL";
  return `'${str.replace(/'/g, "''")}'`;
}

function escapeJson(obj: any): string {
  if (!obj) return "NULL";
  const jsonStr = JSON.stringify(obj);
  return `'${jsonStr.replace(/'/g, "''")}'::jsonb`;
}

async function generate() {
  const adminHash = bcrypt.hashSync("admin", 10);
  const userHash = bcrypt.hashSync("password123", 10);

  const lines: string[] = [
    `-- ==============================================================================`,
    `-- SELLORA High-Performance Computing Platform`,
    `-- Complete PostgreSQL Database Schema & Production Seed Data`,
    `-- Compatible with pgAdmin 4, PostgreSQL 13+, and Prisma ORM`,
    `-- Generated on: ${new Date().toISOString()}`,
    `-- ==============================================================================`,
    ``,
    `-- STEP 1: CREATE DATABASE (Run this line if you have not created sellora_db yet)`,
    `-- In pgAdmin, you can right-click 'Databases' -> 'Create' -> 'Database...' -> Name: sellora_db`,
    `-- Or run: CREATE DATABASE sellora_db;`,
    ``,
    `-- Connect to the sellora_db database before running the script below.`,
    ``,
    `-- STEP 2: DROP EXISTING TABLES (Reverse dependency order)`,
    `DROP TABLE IF EXISTS "OrderItem" CASCADE;`,
    `DROP TABLE IF EXISTS "Order" CASCADE;`,
    `DROP TABLE IF EXISTS "Product" CASCADE;`,
    `DROP TABLE IF EXISTS "User" CASCADE;`,
    `DROP TABLE IF EXISTS "Feedback" CASCADE;`,
    ``,
    `-- STEP 3: CREATE TABLES`,
    ``,
    `-- Table: Product`,
    `CREATE TABLE "Product" (`,
    `    "id" VARCHAR(255) PRIMARY KEY,`,
    `    "name" VARCHAR(255) NOT NULL,`,
    `    "badge" VARCHAR(100),`,
    `    "badgeColor" VARCHAR(50) DEFAULT 'cyan',`,
    `    "category" VARCHAR(100) NOT NULL,`,
    `    "processor" VARCHAR(100) NOT NULL,`,
    `    "price" DOUBLE PRECISION NOT NULL,`,
    `    "priceUsd" VARCHAR(50),`,
    `    "cpu" VARCHAR(255) NOT NULL,`,
    `    "ram" VARCHAR(100) NOT NULL,`,
    `    "gpu" VARCHAR(255) NOT NULL,`,
    `    "display" TEXT,`,
    `    "batteryWeight" VARCHAR(100),`,
    `    "specialHighlight" TEXT,`,
    `    "img" TEXT NOT NULL,`,
    `    "detailedSpecs" JSONB,`,
    `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,`,
    `    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    `);`,
    ``,
    `-- Table: User`,
    `CREATE TABLE "User" (`,
    `    "id" VARCHAR(255) PRIMARY KEY,`,
    `    "email" VARCHAR(255) UNIQUE NOT NULL,`,
    `    "password" VARCHAR(255) NOT NULL,`,
    `    "firstName" VARCHAR(100),`,
    `    "lastName" VARCHAR(100),`,
    `    "phone" VARCHAR(50),`,
    `    "address" TEXT,`,
    `    "role" VARCHAR(50) NOT NULL DEFAULT 'customer',`,
    `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,`,
    `    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    `);`,
    ``,
    `-- Table: Order`,
    `CREATE TABLE "Order" (`,
    `    "id" VARCHAR(255) PRIMARY KEY,`,
    `    "orderNumber" VARCHAR(100) UNIQUE NOT NULL,`,
    `    "userId" VARCHAR(255) REFERENCES "User"("id") ON DELETE SET NULL,`,
    `    "customerName" VARCHAR(255) NOT NULL,`,
    `    "customerEmail" VARCHAR(255) NOT NULL,`,
    `    "customerPhone" VARCHAR(50),`,
    `    "shippingAddress" TEXT NOT NULL,`,
    `    "city" VARCHAR(100),`,
    `    "zipCode" VARCHAR(50),`,
    `    "totalAmount" DOUBLE PRECISION NOT NULL,`,
    `    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',`,
    `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,`,
    `    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    `);`,
    ``,
    `-- Table: OrderItem`,
    `CREATE TABLE "OrderItem" (`,
    `    "id" VARCHAR(255) PRIMARY KEY,`,
    `    "orderId" VARCHAR(255) NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,`,
    `    "productId" VARCHAR(255) NOT NULL REFERENCES "Product"("id") ON DELETE RESTRICT,`,
    `    "quantity" INTEGER NOT NULL DEFAULT 1,`,
    `    "price" DOUBLE PRECISION NOT NULL,`,
    `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    `);`,
    ``,
    `-- Table: Feedback`,
    `CREATE TABLE "Feedback" (`,
    `    "id" VARCHAR(255) PRIMARY KEY,`,
    `    "name" VARCHAR(255) NOT NULL,`,
    `    "role" VARCHAR(100) DEFAULT 'Verified Operator',`,
    `    "rigModel" VARCHAR(255) DEFAULT 'Sellora Machine',`,
    `    "category" VARCHAR(100) DEFAULT 'Gaming',`,
    `    "rating" INTEGER NOT NULL DEFAULT 5,`,
    `    "message" TEXT NOT NULL,`,
    `    "verifiedPurchase" BOOLEAN NOT NULL DEFAULT true,`,
    `    "likes" INTEGER NOT NULL DEFAULT 0,`,
    `    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,`,
    `    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`,
    `);`,
    ``,
    `-- Indexes for High Performance Querying`,
    `CREATE INDEX "idx_product_category" ON "Product"("category");`,
    `CREATE INDEX "idx_product_processor" ON "Product"("processor");`,
    `CREATE INDEX "idx_product_price" ON "Product"("price");`,
    `CREATE INDEX "idx_order_user" ON "Order"("userId");`,
    `CREATE INDEX "idx_order_status" ON "Order"("status");`,
    `CREATE INDEX "idx_orderitem_order" ON "OrderItem"("orderId");`,
    `CREATE INDEX "idx_orderitem_product" ON "OrderItem"("productId");`,
    ``,
    `-- ==============================================================================`,
    `-- STEP 4: SEED DATA`,
    `-- ==============================================================================`,
    ``,
    `-- Seed Users (Pre-registered Admin & Customers)`,
    `INSERT INTO "User" ("id", "email", "password", "firstName", "lastName", "phone", "address", "role") VALUES`,
    `('usr-admin-1', 'admin@sellora.dev', '${adminHash}', 'Rasika', 'Admin', '+94 77 123 4567', 'Sellora Headquarters, Colombo 03', 'admin'),`,
    `('usr-admin-2', 'admin@sellora.com', '${adminHash}', 'System', 'Admin', '+94 77 987 6543', 'Sellora Tech Hub, Kandy', 'admin'),`,
    `('usr-cust-1', 'alex.mercer@gmail.com', '${userHash}', 'Alex', 'Mercer', '+94 71 234 5678', 'No 45 Galle Road, Colombo', 'customer'),`,
    `('usr-cust-2', 'maya.lin@visuals.io', '${userHash}', 'Maya', 'Lin', '+94 72 345 6789', '28 Flower Road, Colombo 07', 'customer');`,
    ``,
    `-- Seed Products (${products.length} High-Performance Laptops)`,
    `INSERT INTO "Product" ("id", "name", "badge", "badgeColor", "category", "processor", "price", "priceUsd", "cpu", "ram", "gpu", "display", "batteryWeight", "specialHighlight", "img", "detailedSpecs") VALUES`,
  ];

  const productRows: string[] = [];
  for (const p of products) {
    productRows.push(
      `(${escapeSql(p.id)}, ${escapeSql(p.name)}, ${escapeSql(p.badge)}, ${escapeSql(p.badgeColor)}, ${escapeSql(p.category)}, ${escapeSql(p.processor)}, ${p.price}, ${escapeSql(p.priceUsd)}, ${escapeSql(p.cpu)}, ${escapeSql(p.ram)}, ${escapeSql(p.gpu)}, ${escapeSql(p.display)}, ${escapeSql(p.batteryWeight)}, ${escapeSql(p.specialHighlight)}, ${escapeSql(p.img)}, ${escapeJson(p.detailedSpecs)})`
    );
  }
  lines.push(productRows.join(",\n") + ";");
  lines.push("");

  lines.push(`-- Seed Feedbacks (${initialFeedbacks.length} Community Reviews)`);
  lines.push(
    `INSERT INTO "Feedback" ("id", "name", "role", "rigModel", "category", "rating", "message", "verifiedPurchase", "likes") VALUES`
  );
  const feedbackRows: string[] = [];
  for (const fb of initialFeedbacks) {
    feedbackRows.push(
      `(${escapeSql(fb.id)}, ${escapeSql(fb.name)}, ${escapeSql(fb.role)}, ${escapeSql(fb.rigModel)}, ${escapeSql(fb.category)}, ${fb.rating}, ${escapeSql(fb.message)}, ${fb.verifiedPurchase}, ${fb.likes})`
    );
  }
  lines.push(feedbackRows.join(",\n") + ";");
  lines.push("");

  lines.push(`-- Seed Orders (Demonstration Orders)`);
  lines.push(
    `INSERT INTO "Order" ("id", "orderNumber", "userId", "customerName", "customerEmail", "customerPhone", "shippingAddress", "city", "zipCode", "totalAmount", "status") VALUES`,
    `('ord-1001', 'ORD-2026-9041', 'usr-cust-1', 'Alex Mercer', 'alex.mercer@gmail.com', '+94 71 234 5678', 'No 45 Galle Road', 'Colombo', '00300', 399900.00, 'COMPLETED'),`,
    `('ord-1002', 'ORD-2026-9042', 'usr-cust-2', 'Maya Lin', 'maya.lin@visuals.io', '+94 72 345 6789', '28 Flower Road', 'Colombo', '00700', 349900.00, 'PROCESSING');`,
    ``
  );

  lines.push(`-- Seed Order Items`);
  lines.push(
    `INSERT INTO "OrderItem" ("id", "orderId", "productId", "quantity", "price") VALUES`,
    `('item-1', 'ord-1001', '1', 1, 399900.00),`,
    `('item-2', 'ord-1002', '2', 1, 349900.00);`,
    ``
  );

  lines.push(
    `-- ==============================================================================`,
    `-- VERIFICATION QUERIES (Run these in pgAdmin to verify all data is loaded)`,
    `-- ==============================================================================`,
    `SELECT 'Users count: ' || COUNT(*) FROM "User";`,
    `SELECT 'Products count: ' || COUNT(*) FROM "Product";`,
    `SELECT 'Feedbacks count: ' || COUNT(*) FROM "Feedback";`,
    `SELECT 'Orders count: ' || COUNT(*) FROM "Order";`,
    `SELECT 'OrderItems count: ' || COUNT(*) FROM "OrderItem";`,
    ``,
    `-- Preview Top Machines`,
    `SELECT id, name, category, processor, price, gpu FROM "Product" ORDER BY price DESC LIMIT 5;`
  );

  const outputSql = lines.join("\n");
  const destPath = path.resolve("./prisma/sellora_database.sql");
  const rootDestPath = path.resolve("./sellora_database.sql");

  fs.writeFileSync(destPath, outputSql, "utf-8");
  fs.writeFileSync(rootDestPath, outputSql, "utf-8");

  console.log(`✅ Successfully generated SQL dump files:`);
  console.log(`   - ${destPath}`);
  console.log(`   - ${rootDestPath}`);
}

generate().catch(console.error);
