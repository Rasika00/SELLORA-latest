import { PrismaClient } from "@prisma/client";
import { products } from "../src/data/products";

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

  console.log(`\n🎉 Seed finished: ${products.length} products upserted.`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
