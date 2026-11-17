import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { products } from "../src/data/products";
import { initialFeedbacks } from "../src/data/feedbacks";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting PostgreSQL database seed...");

  const accounts = [
    {
      email: "admin@sellora.dev",
      password: "admin",
      firstName: "Rasika",
      lastName: "Admin",
      role: "admin",
      sellerStatus: "APPROVED",
    },
    {
      email: "admin@sellora.com",
      password: "admin",
      firstName: "System",
      lastName: "Admin",
      role: "admin",
      sellerStatus: "APPROVED",
    },
    {
      email: "titan.gaming@vendor.lk",
      password: "password123",
      firstName: "Titan",
      lastName: "Gaming",
      role: "seller",
      storeName: "Titan Gaming",
      sellerStatus: "APPROVED",
    },
    {
      email: "apex.tech@vendor.lk",
      password: "password123",
      firstName: "Apex",
      lastName: "Tech",
      role: "seller",
      storeName: "Apex Tech",
      sellerStatus: "APPROVED",
    },
    {
      email: "zenith.creator@vendor.lk",
      password: "password123",
      firstName: "Zenith",
      lastName: "Creator",
      role: "seller",
      storeName: "Zenith Creator",
      sellerStatus: "APPROVED",
    },
    {
      email: "alex.mercer@gmail.com",
      password: "password123",
      firstName: "Alex",
      lastName: "Mercer",
      role: "customer",
      sellerStatus: "NONE",
    },
    {
      email: "maya.lin@visuals.io",
      password: "password123",
      firstName: "Maya",
      lastName: "Lin",
      role: "customer",
      sellerStatus: "NONE",
    },
  ];

  console.log("\n👤 Seeding sample login accounts...");
  for (const account of accounts) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        password: await bcrypt.hash(account.password, 10),
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role,
        storeName: account.storeName,
        sellerStatus: account.sellerStatus,
        isActive: true,
      },
      create: {
        email: account.email,
        password: await bcrypt.hash(account.password, 10),
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role,
        storeName: account.storeName,
        sellerStatus: account.sellerStatus,
        isActive: true,
      },
    });
    console.log(`✅ Seeded account: ${user.email} (${user.role})`);
  }

  for (const item of products) {
    const product = await prisma.product.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        badge: item.badge,
        badgeColor: item.badgeColor,
        category: item.category,
        processor: item.processor,
        price: item.price,
        priceUsd: item.priceUsd,
        cpu: item.cpu,
        ram: item.ram,
        gpu: item.gpu,
        display: item.display,
        batteryWeight: item.batteryWeight,
        specialHighlight: item.specialHighlight,
        img: item.img,
        detailedSpecs: item.detailedSpecs ? (item.detailedSpecs as any) : undefined,
      },
      create: {
        id: item.id,
        name: item.name,
        badge: item.badge,
        badgeColor: item.badgeColor,
        category: item.category,
        processor: item.processor,
        price: item.price,
        priceUsd: item.priceUsd,
        cpu: item.cpu,
        ram: item.ram,
        gpu: item.gpu,
        display: item.display,
        batteryWeight: item.batteryWeight,
        specialHighlight: item.specialHighlight,
        img: item.img,
        detailedSpecs: item.detailedSpecs ? (item.detailedSpecs as any) : undefined,
      },
    });

    console.log(`✅ Seeded product: ${product.name} (ID: ${product.id})`);
  }

  console.log(`\n💬 Seeding initial community feedbacks...`);
  for (const fb of initialFeedbacks) {
    await prisma.feedback.upsert({
      where: { id: fb.id },
      update: {
        name: fb.name,
        role: fb.role,
        rigModel: fb.rigModel,
        category: fb.category,
        rating: fb.rating,
        message: fb.message,
        verifiedPurchase: fb.verifiedPurchase,
        likes: fb.likes,
      },
      create: {
        id: fb.id,
        name: fb.name,
        role: fb.role,
        rigModel: fb.rigModel,
        category: fb.category,
        rating: fb.rating,
        message: fb.message,
        verifiedPurchase: fb.verifiedPurchase,
        likes: fb.likes,
      },
    });
    console.log(`💬 Seeded feedback: ${fb.name} (${fb.category})`);
  }

  console.log(`\n🎉 Seed finished: ${products.length} products and ${initialFeedbacks.length} feedbacks synced.`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
