/**
 * Write a unique pack SVG for every medicine and point Product.image at it.
 * From server/: npx tsx scripts/generate-pack-images.ts
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { medicinePackSvg } from "../src/catalog/pack-art";

const prisma = new PrismaClient();
const OUT = path.join(process.cwd(), "uploads", "packs");

function strengthFrom(name: string, shortDesc: string | null): string {
  const m = `${name} ${shortDesc || ""}`.match(
    /(\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|iu|%)(?:\s*\/\s*\d+(?:\.\d+)?\s?(?:ml|mg))?)/i,
  );
  return m ? m[1] : "";
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const products = await prisma.product.findMany({
    where: { isMedicine: true, sku: { not: null } },
    select: {
      id: true,
      sku: true,
      name: true,
      shortDesc: true,
      unit: true,
      requiresRx: true,
      brand: { select: { name: true } },
    },
  });

  let written = 0;
  for (const p of products) {
    const sku = p.sku!;
    const svg = medicinePackSvg({
      sku,
      name: p.name,
      strength: strengthFrom(p.name, p.shortDesc),
      form: p.unit || "",
      manufacturer: p.brand?.name,
      requiresRx: p.requiresRx,
    });
    fs.writeFileSync(path.join(OUT, `${sku}.svg`), svg);
    await sharp(Buffer.from(svg))
      .resize(640, 640)
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82 })
      .toFile(path.join(OUT, `${sku}.jpg`));
    written++;
    if (written % 2000 === 0) console.log(`Wrote ${written} packs…`);
  }

  const updated = await prisma.$executeRawUnsafe(`
    UPDATE "Product"
    SET image = '/uploads/packs/' || sku || '.jpg',
        images = ARRAY['/uploads/packs/' || sku || '.jpg']
    WHERE "isMedicine" = true
      AND sku IS NOT NULL
      AND sku LIKE 'BD-%'
  `);

  console.log(`Done. files=${written} dbUpdated=${updated} dir=${OUT}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
