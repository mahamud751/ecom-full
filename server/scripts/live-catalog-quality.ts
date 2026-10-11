/**
 * Production catalog quality pass (does not wipe orders).
 * Unique labeled images, English-only Open Facts, homepage real photos.
 *
 * From server/: npx tsx scripts/live-catalog-quality.ts
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { devicePackSvg, medicinePackSvg } from "../src/catalog/pack-art";
import { FONT_BOLD, FONT_REG, packFontFace } from "../src/catalog/pack-font";
import { isShopperEnglish } from "../src/catalog/shopper-english";
import { saveRemoteImage } from "./catalog-media";

const prisma = new PrismaClient();
const PACKS = path.join(process.cwd(), "uploads", "packs");
const LABS = path.join(process.cwd(), "uploads", "lab");
const DOCS = path.join(process.cwd(), "uploads", "doctors");

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

async function raster(svg: string, dest: string) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(Buffer.from(svg))
    .resize(800, 800)
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 86 })
    .toFile(dest);
}

async function writeMedicinePack(opts: {
  sku: string;
  name: string;
  shortDesc?: string | null;
  unit?: string | null;
  maker?: string;
  rx?: boolean;
}): Promise<string> {
  const svg = medicinePackSvg({
    sku: opts.sku,
    name: opts.name,
    strength: `${opts.name} ${opts.shortDesc || ""}`.match(
      /(\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|iu|%)(?:\s*\/\s*\d+(?:\.\d+)?\s?(?:ml|mg))?)/i,
    )?.[1],
    form: opts.unit || "",
    manufacturer: opts.maker,
    requiresRx: opts.rx,
  });
  const dest = path.join(PACKS, `${opts.sku}.jpg`);
  await raster(svg, dest);
  return `/uploads/packs/${opts.sku}.jpg`;
}

async function writeDevicePack(opts: {
  sku: string;
  name: string;
  kind: string;
  maker?: string;
}): Promise<string> {
  const svg = devicePackSvg({
    sku: opts.sku,
    name: opts.name,
    kind: opts.kind,
    manufacturer: opts.maker || "Ahona Care",
  });
  const dest = path.join(PACKS, `${opts.sku}.jpg`);
  await raster(svg, dest);
  return `/uploads/packs/${opts.sku}.jpg`;
}

function labCardSvg(opts: {
  name: string;
  category: string;
  sample: string;
  accent: string;
}): string {
  const [l1, l2] = wrap(opts.name, 18);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 640 640">
  ${packFontFace()}
  <rect width="640" height="640" fill="#F4F7F8"/>
  <rect x="0" y="0" width="640" height="12" fill="${opts.accent}"/>
  <circle cx="520" cy="80" r="110" fill="${opts.accent}" opacity=".12"/>
  <circle cx="320" cy="250" r="92" fill="#fff" stroke="${opts.accent}" stroke-width="10"/>
  <circle cx="320" cy="250" r="48" fill="${opts.accent}" opacity=".2"/>
  <rect x="312" y="190" width="16" height="120" rx="6" fill="${opts.accent}"/>
  <rect x="48" y="400" width="544" height="188" rx="24" fill="#fff"/>
  <text x="320" y="452" text-anchor="middle" font-family="${FONT_BOLD}" font-size="28" font-weight="700" fill="#14201f">${xml(l1)}</text>
  ${l2 ? `<text x="320" y="486" text-anchor="middle" font-family="${FONT_BOLD}" font-size="22" font-weight="700" fill="${opts.accent}">${xml(l2)}</text>` : ""}
  <text x="320" y="${l2 ? 524 : 500}" text-anchor="middle" font-family="${FONT_REG}" font-size="16" fill="#5c6b69">${xml(opts.category)} · ${xml(opts.sample)}</text>
  <text x="320" y="560" text-anchor="middle" font-family="${FONT_REG}" font-size="13" fill="#8a9694">Home sample collection</text>
</svg>`;
}

const LAB_ACCENT: Record<string, string> = {
  Blood: "#9B2C2C",
  Kidney: "#2B5F8B",
  Urine: "#B07A2A",
  Thyroid: "#4A3A8B",
  Diabetes: "#2A7A72",
  Heart: "#B04A2A",
  Liver: "#4F7A2E",
  Vitamin: "#8B6A2A",
  Fever: "#8B3A5A",
  Infection: "#3A5A7A",
  Stool: "#6A4814",
};

async function uniqueSeedImages() {
  const rows = await prisma.product.findMany({
    where: { OR: [{ sku: null }, { image: { startsWith: "/uploads/catalog/" } }] },
    include: { brand: { select: { name: true } }, category: { select: { slug: true } } },
  });
  let n = 0;
  for (const p of rows) {
    const sku = p.sku || `SEED-${p.slug}`.slice(0, 40);
    const kind = p.category.slug === "medical-devices" ? "device" : "other";
    const image =
      p.isMedicine || /tablet|capsule|syrup|paracetamol/i.test(p.name)
        ? await writeMedicinePack({
            sku,
            name: p.name,
            shortDesc: p.shortDesc,
            unit: p.unit,
            maker: p.brand?.name,
            rx: p.requiresRx,
          })
        : await writeDevicePack({
            sku,
            name: p.name,
            kind,
            maker: p.brand?.name || undefined,
          });
    await prisma.product.update({
      where: { id: p.id },
      data: { sku, image, images: [image] },
    });
    n++;
  }
  return n;
}

async function uniqueLabImages() {
  fs.mkdirSync(LABS, { recursive: true });
  const tests = await prisma.labTest.findMany();
  let n = 0;
  for (const t of tests) {
    const accent = LAB_ACCENT[t.category || ""] || "#1F6B5A";
    const svg = labCardSvg({
      name: t.name,
      category: t.category || "Lab",
      sample: t.sampleType || "Sample",
      accent,
    });
    const dest = path.join(LABS, `${t.slug}.jpg`);
    await raster(svg, dest);
    const image = `/uploads/lab/${t.slug}.jpg`;
    await prisma.labTest.update({ where: { id: t.id }, data: { image } });
    n++;
  }
  const packs = await prisma.labPackage.findMany();
  for (const p of packs) {
    const svg = labCardSvg({
      name: p.name,
      category: "Package",
      sample: "Multiple tests",
      accent: "#1F6B5A",
    });
    const dest = path.join(LABS, `${p.slug}.jpg`);
    await raster(svg, dest);
    await prisma.labPackage.update({
      where: { id: p.id },
      data: { image: `/uploads/lab/${p.slug}.jpg` },
    });
    n++;
  }
  return n;
}

async function localizeDoctors() {
  fs.mkdirSync(DOCS, { recursive: true });
  const doctors = await prisma.doctor.findMany({
    select: { id: true, slug: true, image: true },
  });
  let n = 0;
  for (const d of doctors) {
    if (d.image.startsWith("/uploads/")) continue;
    if (!d.image.startsWith("http")) continue;
    const local = await saveRemoteImage({
      url: d.image,
      folder: "doctors",
      filename: d.slug,
    });
    if (!local) continue;
    await prisma.doctor.update({ where: { id: d.id }, data: { image: local } });
    n++;
  }
  return n;
}

async function deactivateForeignOpenFacts() {
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [{ sku: { startsWith: "OBF-" } }, { sku: { startsWith: "OFF-" } }],
    },
    select: { id: true, name: true },
  });
  const bad = rows.filter((r) => !isShopperEnglish(r.name)).map((r) => r.id);
  if (!bad.length) return { scanned: rows.length, deactivated: 0 };
  const chunk = 200;
  let deactivated = 0;
  for (let i = 0; i < bad.length; i += chunk) {
    const ids = bad.slice(i, i + chunk);
    const res = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { isActive: false, isFeatured: false, isFlashSale: false },
    });
    deactivated += res.count;
  }
  return { scanned: rows.length, deactivated };
}

async function ensureCategory(slug: string, name: string, sortOrder: number) {
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return existing.id;
  const created = await prisma.category.create({
    data: { name, slug, isActive: true, sortOrder },
  });
  return created.id;
}

async function ensureBrand(name: string, slug: string) {
  const existing = await prisma.brand.findUnique({ where: { slug } });
  if (existing) return existing.id;
  const created = await prisma.brand.create({ data: { name, slug } });
  return created.id;
}

type GapSku = {
  sku: string;
  name: string;
  slug: string;
  cat: string;
  kind: string;
  price: number;
  compare: number;
  unit: string;
  shortDesc: string;
  description: string;
  section?: string;
};

const GAP_SKUS: GapSku[] = [
  {
    sku: "LABKIT-HOME-01",
    name: "Home Blood Sample Collection Visit",
    slug: "home-blood-sample-collection",
    cat: "home-lab",
    kind: "kit",
    price: 150,
    compare: 250,
    unit: "1 visit",
    shortDesc: "Phlebotomist at your door",
    description:
      "A trained collector visits your home, draws the blood sample, and sends it to the partner lab. Book a test on Ahona and add this visit if you want home collection. Fasting rules still apply for the tests you chose.",
  },
  {
    sku: "LABKIT-URINE-01",
    name: "Sterile Urine Collection Container",
    slug: "sterile-urine-collection-container",
    cat: "home-lab",
    kind: "kit",
    price: 40,
    compare: 60,
    unit: "1 pc",
    shortDesc: "Leak-proof sample cup",
    description:
      "Single-use sterile container for urine R/E or culture. Collect a mid-stream sample and close the lid firmly. Do not wash and reuse.",
  },
  {
    sku: "LABKIT-GLU-01",
    name: "Fasting Glucose Home Collection",
    slug: "fasting-glucose-home-collection",
    cat: "home-lab",
    kind: "glucometer",
    price: 350,
    compare: 450,
    unit: "1 visit",
    shortDesc: "FBS sample at home",
    description:
      "Home collection for fasting blood sugar. Stay fasting 8–10 hours (water is allowed) unless your doctor said otherwise. The collector will confirm the last meal time.",
  },
  {
    sku: "LABKIT-PANEL-01",
    name: "Basic Health Check Sample Visit",
    slug: "basic-health-check-sample-visit",
    cat: "home-lab",
    kind: "kit",
    price: 200,
    compare: 300,
    unit: "1 visit",
    shortDesc: "CBC + sugar + creatinine pickup",
    description:
      "Home sample visit intended for a basic panel (CBC, fasting sugar, creatinine). Pair with the matching lab tests in the Lab Test section. Report times follow each test.",
  },
  {
    sku: "HOM-ARN-30",
    name: "Arnica Montana 30C Pellets",
    slug: "arnica-montana-30c",
    cat: "homeopathy",
    kind: "other",
    price: 180,
    compare: 220,
    unit: "20 g",
    shortDesc: "Homeopathic pellets",
    description:
      "Arnica Montana 30C homeopathic pellets. Homeopathy is complementary — it does not replace emergency care or prescribed allopathic treatment. Follow the insert and your practitioner.",
  },
  {
    sku: "HOM-NUX-30",
    name: "Nux Vomica 30C Pellets",
    slug: "nux-vomica-30c",
    cat: "homeopathy",
    kind: "other",
    price: 180,
    compare: 220,
    unit: "20 g",
    shortDesc: "Homeopathic pellets",
    description:
      "Nux Vomica 30C homeopathic pellets. Use only as directed on the pack. Not a substitute for medical care if symptoms are severe.",
  },
  {
    sku: "HOM-CAL-CR",
    name: "Calendula Homeopathic Cream 25g",
    slug: "calendula-homeopathic-cream",
    cat: "homeopathy",
    kind: "bag",
    price: 160,
    compare: 210,
    unit: "25 g",
    shortDesc: "Topical calendula cream",
    description:
      "Calendula homeopathic cream for minor skin comfort. Do not apply on deep wounds or infected skin. Seek care for spreading redness.",
  },
  {
    sku: "HOM-RHU-30",
    name: "Rhus Toxicodendron 30C Pellets",
    slug: "rhus-tox-30c",
    cat: "homeopathy",
    kind: "other",
    price: 180,
    compare: 220,
    unit: "20 g",
    shortDesc: "Homeopathic pellets",
    description:
      "Rhus Toxicodendron 30C pellets. Complementary homeopathic product. Discuss persistent joint pain with a physician.",
  },
  {
    sku: "HOM-ACO-30",
    name: "Aconitum Napellus 30C Pellets",
    slug: "aconitum-napellus-30c",
    cat: "homeopathy",
    kind: "other",
    price: 180,
    compare: 220,
    unit: "20 g",
    shortDesc: "Homeopathic pellets",
    description:
      "Aconitum Napellus 30C pellets. Complementary use only. High fever or breathing trouble needs urgent medical care.",
  },
  {
    sku: "HOM-BEL-30",
    name: "Belladonna 30C Pellets",
    slug: "belladonna-30c",
    cat: "homeopathy",
    kind: "other",
    price: 180,
    compare: 220,
    unit: "20 g",
    shortDesc: "Homeopathic pellets",
    description:
      "Belladonna 30C homeopathic pellets. Keep away from children. Complementary product — not for self-treating serious illness.",
  },
  {
    sku: "VET-WORM-01",
    name: "Pet Deworming Tablets (Dogs)",
    slug: "pet-deworming-tablets-dogs",
    cat: "veterinary",
    kind: "kit",
    price: 220,
    compare: 280,
    unit: "4 tabs",
    shortDesc: "Broad-spectrum dewormer",
    description:
      "Broad-spectrum deworming tablets for dogs. Dose by body weight as the insert states. Not for human use. Ask a veterinarian for puppies, pregnancy, or mixed parasite risk.",
  },
  {
    sku: "VET-FLEA-01",
    name: "Tick and Flea Spray 200ml",
    slug: "tick-flea-spray-200",
    cat: "veterinary",
    kind: "bag",
    price: 340,
    compare: 420,
    unit: "200 ml",
    shortDesc: "Coat spray for dogs",
    description:
      "Tick and flea spray for dogs. Spray against the coat, avoid eyes and mouth, and keep the pet from licking until dry. Follow the species and age limits on the label.",
  },
  {
    sku: "VET-CAL-01",
    name: "Pet Calcium Syrup 200ml",
    slug: "pet-calcium-syrup-200",
    cat: "veterinary",
    kind: "other",
    price: 260,
    compare: 320,
    unit: "200 ml",
    shortDesc: "Calcium + vitamin D3",
    description:
      "Calcium syrup with vitamin D3 for dogs and cats as a supplement. Not a treatment for fractures. Dose by weight; shake well.",
  },
  {
    sku: "VET-CAT-01",
    name: "Cat Urinary Care Paste 50g",
    slug: "cat-urinary-care-paste",
    cat: "veterinary",
    kind: "bag",
    price: 390,
    compare: 480,
    unit: "50 g",
    shortDesc: "Urinary tract support paste",
    description:
      "Nutritional paste to support urinary tract comfort in cats. A blocked cat is an emergency — go to a vet immediately if your cat strains and cannot urinate.",
  },
  {
    sku: "VET-JOINT-01",
    name: "Dog Joint Care Chews 60pcs",
    slug: "dog-joint-care-chews",
    cat: "veterinary",
    kind: "kit",
    price: 890,
    compare: 1100,
    unit: "60 pcs",
    shortDesc: "Glucosamine chews",
    description:
      "Joint-care chews with glucosamine for adult dogs. Complementary nutrition, not a cure for arthritis. Keep out of reach of children.",
  },
  {
    sku: "FEM-PAD-R",
    name: "Cotton Sanitary Pads Regular (20 pcs)",
    slug: "cotton-sanitary-pads-regular-20",
    cat: "feminine-care",
    kind: "kit",
    price: 160,
    compare: 210,
    unit: "20 pcs",
    shortDesc: "Wings · regular flow",
    description:
      "Pack of 20 regular-flow sanitary pads with wings. Change every 4–6 hours. Dispose of in a bin — do not flush.",
  },
  {
    sku: "FEM-PAD-N",
    name: "Overnight Sanitary Pads XL (8 pcs)",
    slug: "overnight-sanitary-pads-xl-8",
    cat: "feminine-care",
    kind: "kit",
    price: 140,
    compare: 180,
    unit: "8 pcs",
    shortDesc: "Extra-long overnight",
    description:
      "Extra-long overnight sanitary pads, pack of 8. For heavier night flow. Single use.",
  },
  {
    sku: "FEM-LINER",
    name: "Panty Liners Fresh (30 pcs)",
    slug: "panty-liners-fresh-30",
    cat: "feminine-care",
    kind: "kit",
    price: 120,
    compare: 160,
    unit: "30 pcs",
    shortDesc: "Daily liners",
    description:
      "Pack of 30 panty liners for light days. Change frequently. Not a substitute for pads on heavy-flow days.",
  },
  {
    sku: "FEM-WASH",
    name: "Intimate Hygiene Wash 200ml",
    slug: "intimate-hygiene-wash-200",
    cat: "feminine-care",
    kind: "bag",
    price: 280,
    compare: 350,
    unit: "200 ml",
    shortDesc: "pH-balanced wash",
    description:
      "pH-balanced intimate wash for external use only. Do not use inside the vagina. Stop if irritation occurs.",
  },
];

async function fillGapSkus() {
  const catIds = new Map<string, string>();
  catIds.set("home-lab", await ensureCategory("home-lab", "Home Lab", 3));
  catIds.set("homeopathy", await ensureCategory("homeopathy", "Homeopathy", 16));
  catIds.set("veterinary", await ensureCategory("veterinary", "Veterinary", 17));
  catIds.set("feminine-care", await ensureCategory("feminine-care", "Feminine Care", 15));
  const brandId = await ensureBrand("Ahona Care", "ahona-care");
  let created = 0;
  let updated = 0;
  for (const g of GAP_SKUS) {
    const image = await writeDevicePack({
      sku: g.sku,
      name: g.name,
      kind: g.kind,
      maker: "Ahona Care",
    });
    const existing = await prisma.product.findUnique({ where: { sku: g.sku } });
    const data = {
      name: g.name,
      slug: g.slug,
      sku: g.sku,
      description: g.description,
      shortDesc: g.shortDesc,
      image,
      images: [image],
      price: g.price,
      comparePrice: g.compare,
      stock: 80,
      unit: g.unit,
      rating: 4.6,
      isMedicine: false,
      requiresRx: false,
      tags: [g.cat, "otc"],
      section: g.section || g.cat,
      categoryId: catIds.get(g.cat)!,
      brandId,
      expressDelivery: true,
      isActive: true,
    };
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      const slugTaken = await prisma.product.findUnique({ where: { slug: g.slug } });
      await prisma.product.create({
        data: { ...data, slug: slugTaken ? `${g.slug}-${g.sku.toLowerCase()}` : g.slug },
      });
      created++;
    }
  }
  return { created, updated };
}

async function promoteHomepage() {
  await prisma.product.updateMany({
    where: { isFeatured: true },
    data: { isFeatured: false },
  });
  await prisma.product.updateMany({
    where: { isFlashSale: true },
    data: { isFlashSale: false },
  });

  const beauty = await prisma.product.findMany({
    where: {
      sku: { startsWith: "OBF-" },
      isActive: true,
      image: { startsWith: "/uploads/beauty/" },
    },
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    take: 40,
    select: { id: true, name: true },
  });
  const food = await prisma.product.findMany({
    where: {
      sku: { startsWith: "OFF-" },
      isActive: true,
      image: { startsWith: "/uploads/food/" },
    },
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    take: 24,
    select: { id: true, name: true },
  });
  const devices = await prisma.product.findMany({
    where: { sku: { startsWith: "DEV-" }, isActive: true },
    take: 8,
    select: { id: true },
  });
  const meds = await prisma.product.findMany({
    where: {
      isMedicine: true,
      isActive: true,
      sku: { startsWith: "BD-" },
      image: { startsWith: "/uploads/packs/" },
      OR: [
        { name: { startsWith: "Napa" } },
        { name: { startsWith: "Seclo" } },
        { name: { startsWith: "Ace " } },
        { name: { startsWith: "Monas" } },
        { name: { startsWith: "Fexo" } },
        { name: { startsWith: "Sergel" } },
        { name: { startsWith: "Pantonix" } },
        { name: { startsWith: "Alatrol" } },
        { name: { startsWith: "Calbo" } },
        { name: { startsWith: "Orsaline" } },
        { name: { startsWith: "Entacyd" } },
        { name: { startsWith: "Thyrox" } },
        { name: { startsWith: "Rosuva" } },
        { name: { startsWith: "Bislol" } },
        { name: { startsWith: "Atova" } },
        { name: { startsWith: "Adovas" } },
      ],
    },
    take: 12,
    select: { id: true },
  });
  const himalaya = await prisma.product.findMany({
    where: {
      isActive: true,
      image: { startsWith: "/uploads/" },
      NOT: { image: { startsWith: "/uploads/catalog/" } },
      brand: { slug: { contains: "himalaya" } },
    },
    take: 16,
    select: { id: true },
  });
  const englishBeauty = beauty.filter((p) => isShopperEnglish(p.name));
  const englishFood = food.filter((p) => isShopperEnglish(p.name));

  const featuredIds = [
    ...englishBeauty.slice(0, 8).map((p) => p.id),
    ...englishFood.slice(0, 4).map((p) => p.id),
    ...devices.slice(0, 4).map((p) => p.id),
    ...meds.slice(0, 6).map((p) => p.id),
  ];
  const flashIds = [
    ...englishBeauty.slice(8, 16).map((p) => p.id),
    ...englishFood.slice(4, 10).map((p) => p.id),
  ];

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
      where: { section: "himalaya", sku: { startsWith: "SEED-" } },
      data: { section: "himalaya-seed" },
    });
    await prisma.product.updateMany({
      where: { id: { in: himalaya.map((p) => p.id) } },
      data: { section: "himalaya" },
    });
  }

  return {
    featured: featuredIds.length,
    flash: flashIds.length,
    himalaya: himalaya.length,
  };
}

async function main() {
  fs.mkdirSync(PACKS, { recursive: true });
  console.log("Seed unique images…");
  const seed = await uniqueSeedImages();
  console.log("Lab unique images…");
  const lab = await uniqueLabImages();
  console.log("Localize doctors…");
  const doctors = await localizeDoctors();
  console.log("Deactivate foreign Open Facts names…");
  const foreign = await deactivateForeignOpenFacts();
  console.log("Fill empty categories…");
  const gaps = await fillGapSkus();
  console.log("Promote homepage…");
  const home = await promoteHomepage();
  console.log(JSON.stringify({ seed, lab, doctors, foreign, gaps, home }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
