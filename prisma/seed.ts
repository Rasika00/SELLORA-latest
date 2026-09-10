import { PrismaClient } from "@prisma/client";
import { products } from "../src/data/products";
import { initialFeedbacks } from "../src/data/feedbacks";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting PostgreSQL database seed...");

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
