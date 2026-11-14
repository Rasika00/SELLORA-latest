-- ==============================================================================
-- SELLORA High-Performance Computing Platform
-- Complete PostgreSQL Database Schema & Production Seed Data
-- Compatible with pgAdmin 4, PostgreSQL 13+, and Prisma ORM
-- Generated on: 2026-09-28T16:34:52.374Z
-- ==============================================================================

-- STEP 1: CREATE DATABASE (Run this line if you have not created sellora_db yet)
-- In pgAdmin, you can right-click 'Databases' -> 'Create' -> 'Database...' -> Name: sellora_db
-- Or run: CREATE DATABASE sellora_db;

-- Connect to the sellora_db database before running the script below.

-- STEP 2: DROP EXISTING TABLES (Reverse dependency order)
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Feedback" CASCADE;

-- STEP 3: CREATE TABLES

-- Table: Product
CREATE TABLE "Product" (
    "id" VARCHAR(255) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "badge" VARCHAR(100),
    "badgeColor" VARCHAR(50) DEFAULT 'cyan',
    "category" VARCHAR(100) NOT NULL,
    "processor" VARCHAR(100) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "priceUsd" VARCHAR(50),
    "cpu" VARCHAR(255) NOT NULL,
    "ram" VARCHAR(100) NOT NULL,
    "gpu" VARCHAR(255) NOT NULL,
    "display" TEXT,
    "batteryWeight" VARCHAR(100),
    "specialHighlight" TEXT,
    "img" TEXT NOT NULL,
    "detailedSpecs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: User
CREATE TABLE "User" (
    "id" VARCHAR(255) PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "phone" VARCHAR(50),
    "address" TEXT,
    "role" VARCHAR(50) NOT NULL DEFAULT 'customer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Order
CREATE TABLE "Order" (
    "id" VARCHAR(255) PRIMARY KEY,
    "orderNumber" VARCHAR(100) UNIQUE NOT NULL,
    "userId" VARCHAR(255) REFERENCES "User"("id") ON DELETE SET NULL,
    "customerName" VARCHAR(255) NOT NULL,
    "customerEmail" VARCHAR(255) NOT NULL,
    "customerPhone" VARCHAR(50),
    "shippingAddress" TEXT NOT NULL,
    "city" VARCHAR(100),
    "zipCode" VARCHAR(50),
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: OrderItem
CREATE TABLE "OrderItem" (
    "id" VARCHAR(255) PRIMARY KEY,
    "orderId" VARCHAR(255) NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "productId" VARCHAR(255) NOT NULL REFERENCES "Product"("id") ON DELETE RESTRICT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Feedback
CREATE TABLE "Feedback" (
    "id" VARCHAR(255) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(100) DEFAULT 'Verified Operator',
    "rigModel" VARCHAR(255) DEFAULT 'Sellora Machine',
    "category" VARCHAR(100) DEFAULT 'Gaming',
    "rating" INTEGER NOT NULL DEFAULT 5,
    "message" TEXT NOT NULL,
    "verifiedPurchase" BOOLEAN NOT NULL DEFAULT true,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for High Performance Querying
CREATE INDEX "idx_product_category" ON "Product"("category");
CREATE INDEX "idx_product_processor" ON "Product"("processor");
CREATE INDEX "idx_product_price" ON "Product"("price");
CREATE INDEX "idx_order_user" ON "Order"("userId");
CREATE INDEX "idx_order_status" ON "Order"("status");
CREATE INDEX "idx_orderitem_order" ON "OrderItem"("orderId");
CREATE INDEX "idx_orderitem_product" ON "OrderItem"("productId");

-- ==============================================================================
-- STEP 4: SEED DATA
-- ==============================================================================

-- Seed Users (Pre-registered Admin & Customers)
INSERT INTO "User" ("id", "email", "password", "firstName", "lastName", "phone", "address", "role") VALUES
('usr-admin-1', 'admin@sellora.dev', '$2b$10$grDI8M/Z9has4eYokbhvLOAdAnTD2wPgxcEcUgU7uo8JbtuX9P3lO', 'Rasika', 'Admin', '+94 77 123 4567', 'Sellora Headquarters, Colombo 03', 'admin'),
('usr-admin-2', 'admin@sellora.com', '$2b$10$grDI8M/Z9has4eYokbhvLOAdAnTD2wPgxcEcUgU7uo8JbtuX9P3lO', 'System', 'Admin', '+94 77 987 6543', 'Sellora Tech Hub, Kandy', 'admin'),
('usr-cust-1', 'alex.mercer@gmail.com', '$2b$10$O/8WaPVIlDrdsSWEbhYfm.8wD3AI7/gsUZQl3SjQiYRoty71D0wTa', 'Alex', 'Mercer', '+94 71 234 5678', 'No 45 Galle Road, Colombo', 'customer'),
('usr-cust-2', 'maya.lin@visuals.io', '$2b$10$O/8WaPVIlDrdsSWEbhYfm.8wD3AI7/gsUZQl3SjQiYRoty71D0wTa', 'Maya', 'Lin', '+94 72 345 6789', '28 Flower Road, Colombo 07', 'customer');

-- Seed Products (35 High-Performance Laptops)
INSERT INTO "Product" ("id", "name", "badge", "badgeColor", "category", "processor", "price", "priceUsd", "cpu", "ram", "gpu", "display", "batteryWeight", "specialHighlight", "img", "detailedSpecs") VALUES
('1', 'Razer Blade 18', 'GAMING BEAST', 'cyan', 'Gaming', 'Intel i9', 399900, '$4,199', 'Core i9 14900HX', '64GB DDR5', 'RTX 4090 16GB', '18" QHD+ Mini LED 300Hz', '91.7Wh · 3.10 kg', 'Vapor Chamber Cooling with 3 Fan System', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031922/Laptop_1_mi69bv.jpg', '{"displayTech":"18 inch Mini LED QHD+ HDR","refreshRate":"300Hz / 3ms","ports":"Thunderbolt 4, 2.5Gb Ethernet, HDMI 2.1","cooling":"Extra large Vapor Chamber","chassis":"CNC Aluminum Black Anodized","benchmarkScore":9750}'::jsonb),
('2', 'MacBook Pro 16', 'CREATOR PRO', 'purple', 'Ultrabook', 'Apple M Max', 349900, '$3,499', 'M3 Max 16 Core', '48GB Unified', '40 Core Apple GPU', '16.2" Liquid Retina XDR', '100Wh · 2.16 kg', 'Incredible battery life with ProRes hardware acceleration', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031922/Laptop_3_sdawxh.jpg', '{"displayTech":"Liquid Retina XDR, 1600 nits peak","refreshRate":"ProMotion 120Hz","ports":"3x Thunderbolt 4, HDMI, MagSafe 3, SDXC","cooling":"Advanced Thermal Architecture","chassis":"100% Recycled Aluminum Space Black","benchmarkScore":9800}'::jsonb),
('3', 'Lenovo ThinkPad P16', 'WORKSTATION', 'blue', 'Workstation', 'Intel i9', 459900, '$4,599', 'Core i9 13980HX', '128GB ECC DDR5', 'RTX 5000 Ada 16GB', '16.0" WQUXGA OLED Touch', '94Wh · 2.95 kg', 'ISV certified for professional 3D and CAD software', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031922/Laptop_2_rzy6al.jpg', '{"displayTech":"16 inch 4K OLED Pantone Validated","refreshRate":"60Hz Standard","ports":"2x Thunderbolt 4, SD Express, Smart Card","cooling":"Dual Vapor Chamber Cooling","chassis":"Magnesium Alloy internal frame","benchmarkScore":9450}'::jsonb),
('4', 'Dell XPS 14', 'ULTRABOOK', 'cyan', 'Ultrabook', 'Intel i9', 199900, '$1,999', 'Core Ultra 9 185H', '32GB LPDDR5X', 'RTX 4050 6GB', '14.5" 3.2K OLED 120Hz', '69.5Wh · 1.68 kg', 'Seamless glass touchpad and CNC machined chassis', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031923/Laptop_16_b3haqq.jpg', '{"displayTech":"3.2K OLED Touch 100% DCI P3","refreshRate":"120Hz Variable","ports":"3x Thunderbolt 4, MicroSD, 3.5mm","cooling":"Dual fan and heat pipe","chassis":"CNC Machined Aluminum Platinum","benchmarkScore":7850}'::jsonb),
('5', 'Asus ROG Zephyrus G14', 'ESPORTS', 'purple', 'Gaming', 'AMD Ryzen 9', 219900, '$2,199', 'Ryzen 9 8945HS', '32GB LPDDR5X', 'RTX 4070 8GB', '14.0" 3K OLED 120Hz', '73Wh · 1.50 kg', 'Slash Lighting array on a premium CNC aluminum lid', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031923/Laptop_17_iom266.jpg', '{"displayTech":"ROG Nebula Display OLED","refreshRate":"120Hz / 0.2ms","ports":"USB4, Type C 100W PD, HDMI 2.1","cooling":"ROG Intelligent Cooling with Liquid Metal","chassis":"CNC Aluminum Eclipse Gray","benchmarkScore":8850}'::jsonb),
('6', 'HP ZBook Fury 16', 'PRO WORKSTATION', 'blue', 'Workstation', 'Intel i9', 389900, '$3,899', 'Core i9 13950HX', '64GB DDR5', 'RTX 4000 Ada 12GB', '16.0" WUXGA DreamColor', '95Wh · 2.40 kg', 'Tool less chassis access for easy RAM and storage upgrades', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031923/Laptop_4_lj1sn1.jpg', '{"displayTech":"HP DreamColor 100% DCI P3","refreshRate":"120Hz","ports":"2x Thunderbolt 4, Mini DisplayPort, RJ 45","cooling":"HP Vaporforce Thermals","chassis":"Aluminum unibody design","benchmarkScore":9150}'::jsonb),
('7', 'Alienware m18 R2', 'DESKTOP REPLACEMENT', 'cyan', 'Gaming', 'Intel i9', 359900, '$3,599', 'Core i9 14900HX', '32GB DDR5', 'RTX 4080 12GB', '18" QHD+ 165Hz', '97Wh · 4.23 kg', 'Cryo tech cooling technology with quad fans', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031924/Laptop_18_aed4k6.jpg', '{"displayTech":"QHD+ ComfortView Plus","refreshRate":"165Hz","ports":"2x Thunderbolt 4, HDMI 2.1, Mini DisplayPort","cooling":"Alienware Cryo tech","chassis":"Dark Metallic Moon Aluminum","benchmarkScore":9200}'::jsonb),
('8', 'MSI Titan 18 HX', 'ULTIMATE GAMING', 'blue', 'Gaming', 'Intel i9', 499900, '$4,999', 'Core i9 14900HX', '128GB DDR5', 'RTX 4090 16GB', '18" UHD+ Mini LED 120Hz', '99.9Wh · 3.60 kg', 'Cherry MX Ultra Low Profile mechanical keyboard', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031924/Laptop_7_ipsysm.jpg', '{"displayTech":"18 inch 4K Mini LED HDR 1000","refreshRate":"120Hz","ports":"2x Thunderbolt 4, SD Express, HDMI 2.1","cooling":"Vapor Chamber Cooler","chassis":"Magnesium Aluminum Alloy","benchmarkScore":9850}'::jsonb),
('9', 'Asus ROG Strix SCAR 16', 'COMPETITIVE', 'purple', 'Gaming', 'Intel i9', 319900, '$3,199', 'Core i9 14900HX', '32GB DDR5', 'RTX 4080 12GB', '16" ROG Nebula HDR', '90Wh · 2.65 kg', 'Tri Fan technology with full surround vents', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031924/Laptop_5_qsvxkl.jpg', '{"displayTech":"Mini LED QHD+","refreshRate":"240Hz / 3ms","ports":"Thunderbolt 4, 2.5G LAN","cooling":"Tri Fan + Liquid Metal","chassis":"Translucent Keyboard Deck","benchmarkScore":9100}'::jsonb),
('10', 'MacBook Air 15', 'EVERYDAY ULTRA', 'cyan', 'Ultrabook', 'Apple M Max', 149900, '$1,499', 'Apple M3 8 Core', '16GB Unified', '10 Core Apple GPU', '15.3" Liquid Retina', '66.5Wh · 1.51 kg', 'Fanless design for completely silent operation', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031924/Laptop_5_qsvxkl.jpg', '{"displayTech":"Liquid Retina IPS 500 nits","refreshRate":"60Hz","ports":"2x Thunderbolt, MagSafe 3","cooling":"Fanless Passive Cooling","chassis":"100% Recycled Aluminum","benchmarkScore":7100}'::jsonb),
('11', 'Surface Laptop Studio 2', 'CREATIVE PRO', 'purple', 'Ultrabook', 'Intel i7', 279900, '$2,799', 'Core i7 13700H', '64GB LPDDR5x', 'RTX 4060 8GB', '14.4" PixelSense Flow', '58Wh · 1.98 kg', 'Dynamic woven hinge for seamless transitions', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031924/Laptop_8_wkgwx7.jpg', '{"displayTech":"PixelSense Touch with HDR","refreshRate":"120Hz","ports":"2x Thunderbolt 4, MicroSDXC","cooling":"Dual fans with vapor chamber","chassis":"Platinum Aluminum","benchmarkScore":8200}'::jsonb),
('12', 'HP Spectre x360 14', 'PREMIUM 2 IN 1', 'blue', 'Ultrabook', 'Intel i7', 169900, '$1,699', 'Core Ultra 7 155H', '32GB LPDDR5x', 'Arc Graphics', '14" 2.8K OLED Touch', '68Wh · 1.44 kg', '9MP camera with hardware privacy controls', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031924/Laptop_19_a41l7n.jpg', '{"displayTech":"OLED Touch with IMAX Enhanced","refreshRate":"120Hz Variable","ports":"2x Thunderbolt 4, USB A","cooling":"Smart Sense AI Thermals","chassis":"Nightfall Black Aluminum","benchmarkScore":7500}'::jsonb),
('13', 'Asus Zenbook 14 OLED', 'ULTRA PORTABLE', 'cyan', 'Ultrabook', 'AMD Ryzen 7', 139900, '$1,399', 'Ryzen 7 8840HS', '16GB LPDDR5x', 'Radeon 780M', '14" 3K OLED', '75Wh · 1.20 kg', 'Incredibly light at just 1.2kg with a 75Wh battery', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031925/Laptop_10_h0hpgt.jpg', '{"displayTech":"ASUS Lumina OLED","refreshRate":"120Hz","ports":"USB4, HDMI 2.1, Audio Jack","cooling":"IceCool Technology","chassis":"Ponder Blue Aluminum","benchmarkScore":7400}'::jsonb),
('14', 'Dell Precision 7680', 'MOBILE WORKSTATION', 'blue', 'Workstation', 'Intel i9', 419900, '$4,199', 'Core i9 13950HX', '64GB CAMM DDR5', 'RTX 3500 Ada 12GB', '16" 4K OLED Touch', '93Wh · 2.67 kg', 'Revolutionary CAMM memory module for increased speed', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031925/Laptop_9_poxul9.jpg', '{"displayTech":"16 inch UHD+ OLED 100% DCI P3","refreshRate":"60Hz","ports":"2x Thunderbolt 4, SD Card, Smart Card","cooling":"Advanced thermals with DOO fans","chassis":"Titan Gray Aluminum","benchmarkScore":9200}'::jsonb),
('15', 'Asus ProArt Studiobook 16', 'CREATIVE POWER', 'purple', 'Workstation', 'Intel i9', 329900, '$3,299', 'Core i9 13980HX', '64GB DDR5', 'RTX 4070 8GB', '16" 3.2K OLED Touch', '90Wh · 2.40 kg', 'Built in Asus Dial for precise creative control', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031925/Laptop_6_xgjpda.jpg', '{"displayTech":"120Hz 3.2K OLED Calman Verified","refreshRate":"120Hz","ports":"2x Thunderbolt 4, HDMI 2.1, SD Express","cooling":"IceCool Pro with Liquid Metal","chassis":"Mineral Black Anti fingerprint","benchmarkScore":8900}'::jsonb),
('16', 'Lenovo Legion Pro 7i', 'PERFORMANCE', 'cyan', 'Gaming', 'Intel i9', 289900, '$2,899', 'Core i9 14900HX', '32GB DDR5', 'RTX 4080 12GB', '16" WQXGA IPS 240Hz', '99.9Wh · 2.80 kg', 'Legion Coldfront 5.0 with AI tuned performance', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031925/Laptop_20_a4pz4q.jpg', '{"displayTech":"PureSight Gaming IPS","refreshRate":"240Hz","ports":"Thunderbolt 4, USB C 140W PD, RJ 45","cooling":"Coldfront 5.0 Vapor Chamber","chassis":"Onyx Grey Aluminum","benchmarkScore":9150}'::jsonb),
('17', 'Acer Predator Helios 18', 'RGB BEAST', 'purple', 'Gaming', 'Intel i9', 309900, '$3,099', 'Core i9 14900HX', '32GB DDR5', 'RTX 4080 12GB', '18" WQXGA Mini LED', '90Wh · 3.25 kg', 'MagKey 3.0 swappable mechanical switches', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031926/Laptop_11_wojfiq.jpg', '{"displayTech":"Mini LED 1000 nits Peak","refreshRate":"250Hz","ports":"2x Thunderbolt 4, HDMI 2.1","cooling":"5th Gen AeroBlade 3D Fans","chassis":"Abyssal Black Aluminum","benchmarkScore":9050}'::jsonb),
('18', 'LG Gram 17', 'LIGHTWEIGHT BIG SCREEN', 'blue', 'Ultrabook', 'Intel i7', 189900, '$1,899', 'Core Ultra 7 155H', '32GB LPDDR5x', 'Arc Graphics', '17" WQXGA IPS', '77Wh · 1.35 kg', 'Unbelievably light for a 17 inch display at just 1.35kg', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031926/Laptop_12_efhyvu.jpg', '{"displayTech":"Anti glare IPS display","refreshRate":"144Hz Variable","ports":"2x Thunderbolt 4, HDMI","cooling":"Mega cooling system","chassis":"Magnesium Alloy","benchmarkScore":7300}'::jsonb),
('19', 'Acer Swift 3', 'BUDGET ULTRABOOK', 'cyan', 'Ultrabook', 'AMD Ryzen 5', 55000, '$650', 'Ryzen 5 5500U', '8GB LPDDR4X', 'AMD Radeon Graphics', '14" FHD IPS', '48Wh · 1.2 kg', 'Excellent portability and battery life at an entry level price', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031926/Laptop_21_lf8noi.jpg', '{"displayTech":"100% sRGB IPS","refreshRate":"60Hz","ports":"USB C, USB A, HDMI","cooling":"Single fan design","chassis":"Aluminum Silver","benchmarkScore":3500}'::jsonb),
('20', 'Lenovo IdeaPad Gaming 3', 'ENTRY GAMING', 'blue', 'Gaming', 'AMD Ryzen 5', 75000, '$900', 'Ryzen 5 6600H', '16GB DDR5', 'RTX 3050 4GB', '15.6" FHD 120Hz', '60Wh · 2.3 kg', 'Great entry level gaming laptop with dedicated RTX graphics', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031926/Laptop_22_jz0khc.jpg', '{"displayTech":"FHD IPS Anti glare","refreshRate":"120Hz","ports":"USB C, 2x USB A, HDMI, RJ45","cooling":"Dual Fan Cooling","chassis":"Onyx Grey","benchmarkScore":5200}'::jsonb),
('21', 'HP Pavilion Plus 14', 'PREMIUM MID TIER', 'purple', 'Ultrabook', 'Intel i7', 95000, '$1,150', 'Core i7 1355U', '16GB LPDDR5x', 'RTX 2050 4GB', '14" 2.8K OLED 90Hz', '51Wh · 1.4 kg', 'Stunning 2.8K OLED display in a thin aluminum chassis', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031926/Laptop_14_shebrb.jpg', '{"displayTech":"OLED HDR 500 nits","refreshRate":"90Hz","ports":"2x USB C, 2x USB A, HDMI","cooling":"Dual fans","chassis":"Natural Silver Aluminum","benchmarkScore":6100}'::jsonb),
('22', 'Asus TUF Gaming A15', 'DURABLE GAMER', 'cyan', 'Gaming', 'AMD Ryzen 7', 115000, '$1,350', 'Ryzen 7 7735HS', '16GB DDR5', 'RTX 4060 8GB', '15.6" FHD 144Hz', '90Wh · 2.2 kg', 'MIL STD 810H durability with a massive 90Wh battery', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031927/Laptop_13_w2upfg.jpg', '{"displayTech":"FHD IPS Level","refreshRate":"144Hz","ports":"USB C, 3x USB A, HDMI, RJ45","cooling":"Arc Flow Fans","chassis":"Mecha Gray","benchmarkScore":7800}'::jsonb),
('23', 'MSI Prestige 14', 'CREATOR', 'blue', 'Workstation', 'Intel i7', 135000, '$1,550', 'Core i7 13700H', '32GB LPDDR5', 'RTX 4050 6GB', '14" QHD+ 100% DCI P3', '72Wh · 1.6 kg', 'Perfect balance of creator performance and portability', 'https://res.cloudinary.com/dpdsdpmgg/image/upload/v1786031927/Laptop_23_eox4hh.jpg', '{"displayTech":"QHD+ True Pixel Display","refreshRate":"60Hz","ports":"2x Thunderbolt 4, USB A, MicroSD","cooling":"Cooler Boost 3","chassis":"Urban Silver Aluminum","benchmarkScore":8400}'::jsonb),
('24', 'Acer Aspire 5', 'BUDGET CHAMPION', 'blue', 'Ultrabook', 'Intel i5', 48000, '$499', 'Core i5 1335U', '8GB DDR4', 'Intel Iris Xe Integrated', '15.6" FHD IPS Anti-Glare', '50Wh · 1.78 kg', 'Reliable daily driver for college students and everyday office productivity', 'https://res.cloudinary.com/fqizrdtg/image/upload/v1789059787/Acer_Aspire_5_laptop_render_20260910220244.jpg', '{"displayTech":"FHD IPS SlimBezel","refreshRate":"60Hz","ports":"Thunderbolt 4, 3x USB 3.2 Gen 1, HDMI 2.1","cooling":"TwinAir Technology with dual fans","chassis":"Steel Gray Aluminum Top Cover","benchmarkScore":3200}'::jsonb),
('25', 'Dell Inspiron 15 3520', 'DAILY PRODUCTIVITY', 'cyan', 'Ultrabook', 'Intel i5', 52000, '$549', 'Core i5 1235U', '16GB DDR4', 'Intel Iris Xe Integrated', '15.6" FHD 120Hz WVA', '54Wh · 1.65 kg', 'Smooth 120Hz display with lift hinge design for ergonomic typing comfort', 'https://res.cloudinary.com/fqizrdtg/image/upload/v1789059787/Dell_laptop_product_render_20260910220246.jpg', '{"displayTech":"FHD 120Hz Anti-glare Narrow Border","refreshRate":"120Hz","ports":"2x USB 3.2, USB 2.0, HDMI 1.4, SD Card","cooling":"Single Silent Fan Thermal Design","chassis":"Carbon Black Recycled Plastic","benchmarkScore":3600}'::jsonb),
('26', 'Lenovo IdeaPad Slim 3', 'STUDENT FAVORITE', 'purple', 'Ultrabook', 'AMD Ryzen 5', 56000, '$589', 'Ryzen 5 7520U', '16GB LPDDR5', 'AMD Radeon 610M Integrated', '14" FHD IPS 300 nits', '47Wh · 1.37 kg', 'Ultra-lightweight chassis with military-grade MIL-STD-810H durability', 'https://res.cloudinary.com/fqizrdtg/image/upload/v1789059789/Lenovo_IdeaPad_Slim_3_render_20260910220249.jpg', '{"displayTech":"14 inch FHD Anti-glare 300 nits","refreshRate":"60Hz","ports":"USB-C 3.2 Gen 1 (PD/DP), 2x USB 3.2, HDMI 1.4b","cooling":"Intelligent Thermal Cooling","chassis":"Arctic Grey Polycarbonate","benchmarkScore":3900}'::jsonb),
('27', 'HP 15 Laptop', 'VALUE WORKHORSE', 'blue', 'Ultrabook', 'Intel i5', 61000, '$649', 'Core i5 1334U', '16GB DDR4', 'Intel Iris Xe Integrated', '15.6" FHD Micro-Edge', '41Wh · 1.59 kg', 'Fast-charging battery with hardware camera privacy shutter and mic mute', 'https://res.cloudinary.com/fqizrdtg/image/upload/v1789059788/HP_laptop_product_render_20260910220251.jpg', '{"displayTech":"FHD Micro-edge Anti-glare","refreshRate":"60Hz","ports":"USB-C 5Gbps, 2x USB-A, HDMI 1.4b","cooling":"HP CoolSense Thermal Management","chassis":"Natural Silver Finished Frame","benchmarkScore":4100}'::jsonb),
('28', 'Asus Vivobook 15', 'ALL-ROUNDER', 'cyan', 'Ultrabook', 'AMD Ryzen 7', 68000, '$720', 'Ryzen 7 7730U 8-Core', '16GB DDR4', 'AMD Radeon Vega Integrated', '15.6" FHD NanoEdge', '42Wh · 1.70 kg', '8-core processing power with 180-degree lay-flat hinge and Antimicrobial Guard', 'https://res.cloudinary.com/fqizrdtg/image/upload/v1789059787/ASUS_Vivobook_15_product_render_20260910220550.jpg', '{"displayTech":"15.6 inch FHD TÜV Rheinland-certified","refreshRate":"60Hz","ports":"USB-C 3.2, 2x USB 3.2 Type-A, USB 2.0, HDMI","cooling":"IceBlade fan with heat pipe","chassis":"Quiet Blue with textured finish","benchmarkScore":4800}'::jsonb),
('29', 'Lenovo ThinkBook 14 Gen 6', 'BUSINESS STANDARD', 'purple', 'Ultrabook', 'Intel i7', 79000, '$850', 'Core i7 1355U', '16GB DDR5', 'Intel Iris Xe Integrated', '14" 16:10 WUXGA IPS', '60Wh · 1.38 kg', 'Enterprise-grade security with dual SSD slots and spill-resistant keyboard', 'https://res.cloudinary.com/fqizrdtg/image/upload/v1789059788/Lenovo_ThinkBook_laptop_product___20260910220254.jpg', '{"displayTech":"14 inch 16:10 WUXGA 300 nits IPS","refreshRate":"60Hz","ports":"Thunderbolt 4, USB-C 3.2, 2x USB-A, HDMI 2.1, RJ45","cooling":"Dual heat pipe Intelligent Cooling","chassis":"Dual-tone Mineral Grey Aluminum","benchmarkScore":5400}'::jsonb),
('30', 'Acer Swift Go 14', 'OLED BRILLIANCE', 'cyan', 'Ultrabook', 'Intel i7', 88000, '$950', 'Core i7 13700H', '16GB LPDDR5', 'Intel Iris Xe Integrated', '14" 2.8K 90Hz OLED HDR 500', '65Wh · 1.25 kg', 'Incredible 2.8K 90Hz OLED panel in an ultra-portable 1.25kg aluminum body', 'https://res.cloudinary.com/fqizrdtg/image/upload/v1789059787/Acer_Swift_Go_laptop_render_20260910220257.jpg', '{"displayTech":"2.8K OLED 100% DCI-P3 500 nits","refreshRate":"90Hz / 0.2ms","ports":"2x Thunderbolt 4, 2x USB 3.2, HDMI 2.1, MicroSD","cooling":"TwinAir Dual Copper Heat Pipe Fans","chassis":"Pure Silver Anodized Aluminum","benchmarkScore":6800}'::jsonb),
('31', 'HP Victus 15', 'BUDGET GAMER', 'blue', 'Gaming', 'AMD Ryzen 5', 72000, '$780', 'Ryzen 5 7535HS', '16GB DDR5', 'RTX 2050 4GB', '15.6" FHD 144Hz IPS', '52.5Wh · 2.29 kg', 'Affordable dedicated GPU gaming with dual speakers custom tuned by B&O', 'https://res.cloudinary.com/fqizrdtg/image/upload/v1789059788/HP_laptop_product_render_20260910220251.jpg', '{"displayTech":"15.6 inch FHD 144Hz IPS 9ms","refreshRate":"144Hz","ports":"USB-C 5Gbps, 2x USB-A, HDMI 2.1, RJ45","cooling":"OMEN Tempest Dual Fan Airflow","chassis":"Mica Silver Gaming Shell","benchmarkScore":5600}'::jsonb),
('32', 'Dell G15 5530', 'MAINSTREAM GAMER', 'purple', 'Gaming', 'Intel i5', 82000, '$890', 'Core i5 13450HX', '16GB DDR5', 'RTX 3050 6GB', '15.6" FHD 120Hz', '56Wh · 2.65 kg', 'Alienware-inspired thermal engineering with dedicated Game Shift boost button', 'https://res.cloudinary.com/fqizrdtg/image/upload/v1789059787/Dell_G15_gaming_laptop_render_20260910220311.jpg', '{"displayTech":"FHD 120Hz 250 nits Anti-Glare","refreshRate":"120Hz","ports":"USB-C with DP, 3x USB 3.2, HDMI 2.1, RJ45","cooling":"Quad Vents with Dual Ultra-Thin Blade Fans","chassis":"Dark Shadow Gray with Black Thermal Shelf","benchmarkScore":6300}'::jsonb),
('33', 'Apple MacBook Air 13 M2', 'BATTERY KING', 'purple', 'Ultrabook', 'Apple M Max', 99000, '$1,099', 'Apple M2 8-Core', '8GB Unified', 'Apple 8-Core GPU', '13.6" Liquid Retina 500 nits', '52.6Wh · 1.24 kg', 'Completely silent fanless architecture with up to 18 hours of real battery life', 'https://res.cloudinary.com/fqizrdtg/image/upload/v1789059788/Laptop_product_render_20260910220303.jpg', '{"displayTech":"13.6 inch Liquid Retina with True Tone","refreshRate":"60Hz","ports":"MagSafe 3, 2x Thunderbolt 4 / USB 4, Headphone Jack","cooling":"Fanless Passive Thermal Design","chassis":"100% Recycled Midnight Aluminum","benchmarkScore":6900}'::jsonb),
('34', 'Asus Zenbook 14 OLED', 'PORTABLE LUXURY', 'cyan', 'Ultrabook', 'Intel i7', 105000, '$1,199', 'Core Ultra 7 155H', '16GB LPDDR5X', 'Intel Arc Graphics Integrated', '14" 3K 120Hz OLED Lumina', '75Wh · 1.20 kg', 'Intel AI Boost NPU processor paired with a massive 75Wh battery in a 1.2kg frame', 'https://res.cloudinary.com/fqizrdtg/image/upload/v1789059787/ASUS_Zenbook_14_OLED_render_20260910220635.jpg', '{"displayTech":"3K 120Hz OLED 16:10 600 nits HDR","refreshRate":"120Hz / 0.2ms","ports":"2x Thunderbolt 4, USB 3.2 Type-A, HDMI 2.1","cooling":"ASUS IceCool Thermal System","chassis":"Ponder Blue Military-Grade Aluminum","benchmarkScore":7400}'::jsonb),
('35', 'Lenovo Yoga 7 2-in-1', 'CONVERTIBLE PRO', 'blue', 'Ultrabook', 'AMD Ryzen 7', 92000, '$999', 'Ryzen 7 8840HS AI', '16GB LPDDR5X', 'AMD Radeon 780M Integrated', '14" 2.8K OLED Touch 120Hz', '71Wh · 1.49 kg', 'Versatile 360-degree convertibility with stylus pen support and Dolby Atmos sound', 'https://res.cloudinary.com/fqizrdtg/image/upload/v1789059788/Lenovo_Yoga_7_laptop_render_20260910220314.jpg', '{"displayTech":"14 inch 2.8K OLED PureSight Touch 400 nits","refreshRate":"120Hz","ports":"2x USB-C (USB4), USB-A 3.2, HDMI 2.1, MicroSD","cooling":"Smart Power Turbo Cooling","chassis":"Storm Grey Comfort-Edge Aluminum","benchmarkScore":7100}'::jsonb);

-- Seed Feedbacks (5 Community Reviews)
INSERT INTO "Feedback" ("id", "name", "role", "rigModel", "category", "rating", "message", "verifiedPurchase", "likes") VALUES
('fb-1', 'Alex Mercer', 'Competitive FPS Athlete', 'Razer Blade 18 · RTX 4090', 'Gaming', 5, 'The Razer Blade 18 is an absolute colossus. 300Hz Mini LED panel with 400+ stable FPS in CS2 and Apex Legends. The vapor chamber cooling keeps CPU temps below 78°C under full load.', true, 42),
('fb-2', 'Maya Lin', 'Senior Colorist & VFX Lead', 'MacBook Pro 16 · M3 Max', 'Ultrabook', 5, 'Color grading 8K ProRes RAW footage in DaVinci Resolve without dropping a single frame on location. The Liquid Retina XDR screen matches our Sony broadcast reference monitor with surgical precision.', true, 38),
('fb-3', 'Dr. Vikram Sen', 'Autonomous Systems Researcher', 'Lenovo ThinkPad P16 · RTX 5000 Ada', 'Workstation', 5, 'Having 128GB ECC DDR5 and 16GB VRAM on the RTX 5000 Ada lets our team fine-tune vision models locally before deploying to the cluster. Unmatched build rigidity and thermal design.', true, 29),
('fb-4', 'Marcus Zhao', 'Independent Unreal Engine 5 Dev', 'Asus ROG Zephyrus G14 · RTX 4070', 'Gaming', 5, 'A featherweight 1.5kg machine that handles Lumen raytracing in real-time. The OLED 120Hz display is jaw-dropping and the slash lighting on the lid always gets attention at developer meetups.', true, 24),
('fb-5', 'Elena Rostova', 'Architectural Visualizer', 'Dell Precision 7680 · RTX 3500 Ada', 'Workstation', 5, 'The revolutionary CAMM memory is blazing fast for massive Rhino and 3ds Max scenes. Orbital ProCare courier serviced our thermal paste calibration within 24 hours. Stellar experience.', true, 19);

-- Seed Orders (Demonstration Orders)
INSERT INTO "Order" ("id", "orderNumber", "userId", "customerName", "customerEmail", "customerPhone", "shippingAddress", "city", "zipCode", "totalAmount", "status") VALUES
('ord-1001', 'ORD-2026-9041', 'usr-cust-1', 'Alex Mercer', 'alex.mercer@gmail.com', '+94 71 234 5678', 'No 45 Galle Road', 'Colombo', '00300', 399900.00, 'COMPLETED'),
('ord-1002', 'ORD-2026-9042', 'usr-cust-2', 'Maya Lin', 'maya.lin@visuals.io', '+94 72 345 6789', '28 Flower Road', 'Colombo', '00700', 349900.00, 'PROCESSING');

-- Seed Order Items
INSERT INTO "OrderItem" ("id", "orderId", "productId", "quantity", "price") VALUES
('item-1', 'ord-1001', '1', 1, 399900.00),
('item-2', 'ord-1002', '2', 1, 349900.00);

-- ==============================================================================
-- VERIFICATION QUERIES (Run these in pgAdmin to verify all data is loaded)
-- ==============================================================================
SELECT 'Users count: ' || COUNT(*) FROM "User";
SELECT 'Products count: ' || COUNT(*) FROM "Product";
SELECT 'Feedbacks count: ' || COUNT(*) FROM "Feedback";
SELECT 'Orders count: ' || COUNT(*) FROM "Order";
SELECT 'OrderItems count: ' || COUNT(*) FROM "OrderItem";

-- Preview Top Machines
SELECT id, name, category, processor, price, gpu FROM "Product" ORDER BY price DESC LIMIT 5;