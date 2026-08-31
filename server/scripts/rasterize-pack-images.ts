/**
 * Convert medicine pack SVGs to JPEG so web + the mobile app can display them.
 * From server/: npx tsx scripts/rasterize-pack-images.ts
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DIR = path.join(process.cwd(), "uploads", "packs");
const CONCURRENCY = 8;

async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const item = items[i++];
      await fn(item);
    }
  }
  await Promise.all(Array.from({ length: n }, () => worker()));
}

async function main() {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".svg"));
  console.log(`Rasterizing ${files.length} packs…`);
  let done = 0;
  await pool(files, CONCURRENCY, async (file) => {
    const svgPath = path.join(DIR, file);
    const jpgPath = path.join(DIR, file.replace(/\.svg$/i, ".jpg"));
    if (fs.existsSync(jpgPath) && fs.statSync(jpgPath).size > 2000) {
      done++;
      return;
    }
    const svg = fs.readFileSync(svgPath);
    await sharp(svg)
      .resize(640, 640)
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82 })
      .toFile(jpgPath);
    done++;
    if (done % 2000 === 0) console.log(`Wrote ${done}/${files.length}…`);
  });

  const updated = await prisma.$executeRawUnsafe(`
    UPDATE "Product"
    SET image = replace(image, '.svg', '.jpg'),
        images = ARRAY[replace(image, '.svg', '.jpg')]
    WHERE image LIKE '/uploads/packs/%.svg'
  `);
  console.log(`Done. files=${done} dbUpdated=${updated}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
