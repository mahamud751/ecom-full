/**
 * Copy remote Open Beauty / Open Food Facts pack photos into /uploads
 * and point Product.image at the local file.
 *
 * From server/: npx tsx scripts/mirror-open-images.ts
 */
import { PrismaClient } from "@prisma/client";
import { saveRemoteImage } from "./catalog-media";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.product.findMany({
    where: {
      OR: [
        { image: { contains: "openbeautyfacts.org" } },
        { image: { contains: "openfoodfacts.org" } },
        { sku: { startsWith: "OBF-" } },
        { sku: { startsWith: "OFF-" } },
      ],
    },
    select: { id: true, sku: true, image: true },
  });

  let saved = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const sku = row.sku || row.id;
    const alreadyLocal = row.image.startsWith("/uploads/");
    const remote = alreadyLocal ? "" : row.image;
    if (!remote.startsWith("http")) {
      skipped++;
      continue;
    }
    const folder = sku.startsWith("OFF-") ? "food" : "beauty";
    const local = await saveRemoteImage({ url: remote, folder, filename: sku });
    if (!local) {
      failed++;
      continue;
    }
    await prisma.product.update({
      where: { id: row.id },
      data: { image: local, images: [local] },
    });
    saved++;
    if (saved % 50 === 0) console.log(`Mirrored ${saved}/${rows.length}…`);
    await new Promise((r) => setTimeout(r, 80));
  }

  console.log(`Done. saved=${saved} skipped=${skipped} failed=${failed} scanned=${rows.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
