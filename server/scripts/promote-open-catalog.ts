/**
 * Put real pack-photo SKUs on the homepage (featured / flash / Himalaya).
 * From server/: npx tsx scripts/promote-open-catalog.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const unfeature = await prisma.product.updateMany({
    where: { image: { contains: "unsplash.com" } },
    data: { isFeatured: false, isFlashSale: false },
  });

  const beauty = await prisma.product.findMany({
    where: { sku: { startsWith: "OBF-" }, isActive: true, image: { startsWith: "/uploads/" } },
    orderBy: { reviewCount: "desc" },
    take: 24,
    select: { id: true },
  });
  const food = await prisma.product.findMany({
    where: { sku: { startsWith: "OFF-" }, isActive: true, image: { startsWith: "/uploads/" } },
    orderBy: { reviewCount: "desc" },
    take: 12,
    select: { id: true },
  });
  const devices = await prisma.product.findMany({
    where: { sku: { startsWith: "DEV-" }, isActive: true },
    take: 8,
    select: { id: true },
  });
  const himalaya = await prisma.product.findMany({
    where: {
      isActive: true,
      image: { startsWith: "/uploads/" },
      brand: { slug: { contains: "himalaya" } },
    },
    take: 12,
    select: { id: true },
  });

  const featuredIds = [...beauty.slice(0, 12), ...food.slice(0, 6), ...devices.slice(0, 4)].map(
    (p) => p.id,
  );
  const flashIds = [...beauty.slice(12, 20), ...food.slice(6, 12)].map((p) => p.id);

  if (featuredIds.length) {
    await prisma.product.updateMany({
      where: { id: { in: featuredIds } },
      data: { isFeatured: true },
    });
  }
  if (flashIds.length) {
    await prisma.product.updateMany({
      where: { id: { in: flashIds } },
      data: { isFlashSale: true },
    });
  }
  if (himalaya.length) {
    await prisma.product.updateMany({
      where: { id: { in: himalaya.map((p) => p.id) } },
      data: { section: "himalaya" },
    });
  }

  console.log(
    JSON.stringify({
      unfeaturedUnsplash: unfeature.count,
      featured: featuredIds.length,
      flash: flashIds.length,
      himalaya: himalaya.length,
    }),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
