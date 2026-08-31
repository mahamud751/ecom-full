/**
 * Stamp each medicine with a real studio photo for its dosage form
 * (tablet strip, syrup bottle, etc.) plus a name label.
 *
 * From server/: npx tsx scripts/apply-medicine-photos.ts
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { detectForm } from "../src/catalog/pack-art";

const prisma = new PrismaClient();
const FORMS = path.join(process.cwd(), "uploads", "forms");
const PACKS = path.join(process.cwd(), "uploads", "packs");
const CONCURRENCY = 6;

const FORM_FILE: Record<string, string> = {
  Tablet: "tablet.jpg",
  Capsule: "capsule.jpg",
  Syrup: "syrup.jpg",
  Cream: "cream.jpg",
  Injection: "injection.jpg",
  Drops: "drops.jpg",
  Inhaler: "inhaler.jpg",
  Powder: "powder.jpg",
  Suppository: "tablet.jpg",
};

function xml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(s: string, n = 22): [string, string] {
  const t = s.trim();
  if (t.length <= n) return [t, ""];
  const i = t.lastIndexOf(" ", n);
  const cut = i > 8 ? i : n;
  return [t.slice(0, cut).trim(), t.slice(cut).trim().slice(0, n)];
}

function labelSvg(opts: {
  name: string;
  strength: string;
  form: string;
  maker: string;
  rx: boolean;
}): Buffer {
  const [l1, l2] = wrap(opts.name, 24);
  const meta = [opts.strength, opts.form].filter(Boolean).join(" · ");
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640">
  <rect x="28" y="492" width="584" height="120" rx="20" fill="#ffffff" fill-opacity="0.96"/>
  <text x="320" y="528" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#14201f">${xml(l1)}</text>
  ${l2 ? `<text x="320" y="554" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="600" fill="#164f4a">${xml(l2)}</text>` : ""}
  <text x="320" y="${l2 ? 578 : 558}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#5c6b69">${xml(meta)}</text>
  ${opts.maker ? `<text x="320" y="598" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#8a9694">${xml(opts.maker.slice(0, 36))}</text>` : ""}
  <rect x="24" y="24" width="${opts.rx ? 52 : 48}" height="26" rx="8" fill="${opts.rx ? "#9B2C2C" : "#1F6B5A"}"/>
  <text x="${opts.rx ? 50 : 48}" y="42" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" font-weight="700" fill="#fff">${opts.rx ? "Rx" : "OTC"}</text>
</svg>`);
}

function strengthFrom(name: string, shortDesc: string | null): string {
  const m = `${name} ${shortDesc || ""}`.match(
    /(\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|iu|%)(?:\s*\/\s*\d+(?:\.\d+)?\s?(?:ml|mg))?)/i,
  );
  return m ? m[1] : "";
}

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

async function makeHero() {
  const tiles = ["tablet", "syrup", "capsule", "drops"];
  const resized = await Promise.all(
    tiles.map((name) =>
      sharp(path.join(FORMS, `${name}.jpg`)).resize(560, 560, { fit: "cover" }).jpeg().toBuffer(),
    ),
  );
  await sharp({
    create: { width: 1200, height: 1200, channels: 3, background: "#f4f1ea" },
  })
    .composite([
      { input: resized[0], left: 32, top: 32 },
      { input: resized[1], left: 608, top: 32 },
      { input: resized[2], left: 32, top: 608 },
      { input: resized[3], left: 608, top: 608 },
    ])
    .jpeg({ quality: 86 })
    .toFile(path.join(FORMS, "medicine-hero.jpg"));
}

async function main() {
  fs.mkdirSync(PACKS, { recursive: true });
  await makeHero();

  const buffers = new Map<string, Buffer>();
  for (const [form, file] of Object.entries(FORM_FILE)) {
    const fp = path.join(FORMS, file);
    if (!fs.existsSync(fp)) continue;
    buffers.set(
      form,
      await sharp(fp).resize(640, 640, { fit: "cover" }).jpeg({ quality: 88 }).toBuffer(),
    );
  }

  const products = await prisma.product.findMany({
    where: { isMedicine: true, sku: { not: null } },
    select: {
      sku: true,
      name: true,
      shortDesc: true,
      unit: true,
      requiresRx: true,
      brand: { select: { name: true } },
    },
  });

  console.log(`Compositing ${products.length} medicine photos…`);
  let done = 0;
  const formCounts = new Map<string, number>();

  await pool(products, CONCURRENCY, async (p) => {
    const form = detectForm(p.name, p.unit || "");
    formCounts.set(form, (formCounts.get(form) || 0) + 1);
    const base = buffers.get(form) || buffers.get("Tablet");
    if (!base) return;
    const overlay = await sharp(
      labelSvg({
        name: p.name,
        strength: strengthFrom(p.name, p.shortDesc),
        form,
        maker: p.brand?.name || "",
        rx: p.requiresRx,
      }),
    )
      .png()
      .toBuffer();
    await sharp(base)
      .composite([{ input: overlay }])
      .jpeg({ quality: 84 })
      .toFile(path.join(PACKS, `${p.sku}.jpg`));
    done++;
    if (done % 2000 === 0) console.log(`Wrote ${done}/${products.length}…`);
  });

  for (const [form, file] of Object.entries(FORM_FILE)) {
    const formPath = `/uploads/forms/${file}`;
    await prisma.$executeRawUnsafe(
      `
      UPDATE "Product"
      SET images = ARRAY['/uploads/packs/' || sku || '.jpg', $1]
      WHERE "isMedicine" = true
        AND sku IS NOT NULL
        AND (
          CASE
            WHEN $2 = 'Syrup' THEN (name ILIKE '%syrup%' OR name ILIKE '%suspension%' OR name ILIKE '%elixir%' OR name ILIKE '%solution%')
            WHEN $2 = 'Capsule' THEN (name ILIKE '%capsule%')
            WHEN $2 = 'Cream' THEN (name ILIKE '%cream%' OR name ILIKE '%ointment%' OR name ILIKE '%gel%' OR name ILIKE '%lotion%')
            WHEN $2 = 'Injection' THEN (name ILIKE '%inject%' OR name ILIKE '%vial%' OR name ILIKE '%ampoule%' OR name ILIKE '%infusion%')
            WHEN $2 = 'Drops' THEN (name ILIKE '%drop%' OR name ILIKE '%nasal%' OR name ILIKE '%ophthalmic%' OR name ILIKE '%eye %')
            WHEN $2 = 'Inhaler' THEN (name ILIKE '%inhal%' OR name ILIKE '%nebul%')
            WHEN $2 = 'Powder' THEN (name ILIKE '%powder%' OR name ILIKE '%sachet%')
            WHEN $2 = 'Tablet' THEN (name ILIKE '%tablet%' OR name ILIKE '%suppositor%' OR (
              name NOT ILIKE '%syrup%' AND name NOT ILIKE '%capsule%' AND name NOT ILIKE '%cream%'
              AND name NOT ILIKE '%inject%' AND name NOT ILIKE '%drop%' AND name NOT ILIKE '%inhal%'
              AND name NOT ILIKE '%powder%'
            ))
            ELSE false
          END
        )
      `,
      formPath,
      form,
    );
  }

  await prisma.category.update({
    where: { slug: "medicine" },
    data: { image: "/uploads/forms/medicine-hero.jpg" },
  });

  console.log(`Done. files=${done} forms=${JSON.stringify(Object.fromEntries(formCounts))}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
