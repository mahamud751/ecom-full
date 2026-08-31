/**
 * Import ~21k Bangladesh medicines into the catalog.
 *
 * Source (CC0 public domain):
 *   Hugging Face / Kaggle — Assorted Medicine Dataset of Bangladesh
 *   data/medicines/medicine.csv + generic.csv
 *
 * Does not scrape competitor shops (Arogga, Lazz, MedEasy, Doctime).
 *
 * Usage (from server/):
 *   npx tsx scripts/import-medicines.ts
 *   npx tsx scripts/import-medicines.ts --limit 500   # smoke test
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DATA = path.join(process.cwd(), "data", "medicines");

const IMG = {
  tablet:
    "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=1200&h=1200&q=95",
  capsule:
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&h=1200&q=95",
  syrup:
    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1200&h=1200&q=95",
  cream:
    "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1200&h=1200&q=95",
  injection:
    "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=1200&h=1200&q=95",
  drop: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&h=1200&q=95",
  inhaler:
    "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&h=1200&q=95",
  herbal:
    "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=1200&h=1200&q=95",
  device:
    "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=1200&h=1200&q=95",
};

const OTC_GENERIC = [
  "paracetamol",
  "oral rehydration salt",
  "oral rehydration salts",
  "cetirizine hydrochloride",
  "cetirizine",
  "loratadine",
  "fexofenadine hydrochloride",
  "chlorpheniramine maleate",
  "ascorbic acid",
  "vitamin c",
  "calcium carbonate",
  "calcium + vitamin d3",
  "folic acid",
  "zinc sulfate",
  "zinc",
  "aluminium hydroxide",
  "magnesium hydroxide",
  "antacid",
  "simethicone",
  "activated charcoal",
  "glycerin",
  "povidone iodine",
  "ors",
];

const FEATURED_BRANDS = new Set([
  "napa",
  "napa extend",
  "seclo",
  "ace",
  "ecosprin",
  "pantonix",
  "monas",
  "alatrol",
  "fexo",
  "orsaline",
  "sergel",
  "maxpro",
  "entacyd plus",
  "entacyd",
  "calbo-d",
  "calbo d",
  "thyrox",
  "rosuva",
  "bislol",
  "atova",
  "bizoran",
  "adovas",
  "omidon",
  "napa syrup",
]);

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      if (row.some((x) => x.length)) rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cols) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => {
      o[h] = cols[i] ?? "";
    });
    return o;
  });
}

function stripHtml(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function slugify(text: string, max = 70): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}

function parseMrp(
  pkg: string,
  packSize: string,
  form: string,
): { mrp: number; pack: string } {
  const text = `${pkg} ${packSize}`;
  const prices = [...text.matchAll(/([^:৳]{0,40}):\s*৳\s*([\d,]+(?:\.\d+)?)/g)]
    .map((m) => ({
      label: m[1].replace(/^[,\s(]+/, "").trim(),
      price: Number(m[2].replace(/,/g, "")),
    }))
    .filter((p) => p.price > 0);

  const unit = prices.find((p) => /unit price/i.test(p.label));
  const smallPack = prices.find((p) => {
    const n = p.label.match(/(\d+)\s*['’]?s/i);
    return n && Number(n[1]) >= 4 && Number(n[1]) <= 30;
  });
  const container = prices.find(
    (p) =>
      /bottle|tube|drop|vial|ampoule|sachet|bag|pot|can/i.test(p.label) &&
      !/unit price/i.test(p.label),
  );
  const oralSolid = /\b(tablet|capsule|suppository)\b/i.test(form);

  if (smallPack) return { mrp: smallPack.price, pack: smallPack.label.slice(0, 40) };
  if (oralSolid && unit) {
    const qty = unit.price < 20 ? 10 : 1;
    return {
      mrp: round2(unit.price * qty),
      pack: qty === 10 ? "10's strip" : "1 tablet",
    };
  }
  if (container) return { mrp: container.price, pack: container.label.slice(0, 40) };
  if (prices[0]) {
    return { mrp: prices[0].price, pack: (prices[0].label || "pcs").slice(0, 40) };
  }
  return { mrp: 0, pack: "pcs" };
}

function formImage(form: string, type: string): string {
  if (type.toLowerCase() === "herbal") return IMG.herbal;
  const f = form.toLowerCase();
  if (f.includes("cream") || f.includes("ointment") || f.includes("gel") || f.includes("lotion"))
    return IMG.cream;
  if (f.includes("syrup") || f.includes("suspension") || f.includes("solution") || f.includes("drop"))
    return f.includes("ophthalmic") || f.includes("eye") || f.includes("ear") || f.includes("nasal")
      ? IMG.drop
      : IMG.syrup;
  if (f.includes("inject") || f.includes("infusion") || f.includes("vial")) return IMG.injection;
  if (f.includes("inhal") || f.includes("nebul")) return IMG.inhaler;
  if (f.includes("capsule")) return IMG.capsule;
  if (f.includes("device") || f.includes("kit")) return IMG.device;
  return IMG.tablet;
}

function categorySlug(type: string, form: string): string {
  if (type.toLowerCase() === "herbal") return "herbal";
  const f = form.toLowerCase();
  if (f.includes("shampoo")) return "haircare";
  const topical =
    /\b(cream|ointment|gel|lotion)\b/.test(f) &&
    !/(ophthalmic|eye|ear|nasal|vaginal|rectal|oral)/.test(f);
  if (topical) return "dermatological";
  return "medicine";
}

function isOtcGeneric(name: string): boolean {
  const g = name.toLowerCase().replace(/\s+/g, " ").trim();
  return OTC_GENERIC.some((o) => g === o || g.startsWith(`${o} `) || g.startsWith(`${o}(`));
}

function requiresRx(type: string, generic: string): boolean {
  if (type.toLowerCase() === "herbal") return false;
  const g = generic.toLowerCase().replace(/\s+/g, " ").trim();
  if (!g) return true;
  if (isOtcGeneric(g)) return false;
  if (g.includes("+") || g.includes(" and ")) {
    const parts = g.split(/\s*\+\s*|\s+and\s+/).map((p) => p.trim()).filter(Boolean);
    return parts.some((p) => !isOtcGeneric(p));
  }
  return true;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

type GenericInfo = {
  indication: string;
  dosage: string;
  sideEffects: string;
  drugClass: string;
  pharmacology: string;
  contraindications: string;
};

function buildDescription(opts: {
  name: string;
  generic: string;
  strength: string;
  form: string;
  manufacturer: string;
  pack: string;
  mrp: number;
  type: string;
  info?: GenericInfo;
}): string {
  const lines = [
    `${opts.name} is a ${opts.type} ${opts.form.toLowerCase()} from ${opts.manufacturer}.`,
    "",
    `Generic: ${opts.generic}`,
    `Strength: ${opts.strength || "—"}`,
    `Dosage form: ${opts.form}`,
    `Pack: ${opts.pack}`,
    `MRP: ৳${opts.mrp.toFixed(2)}`,
  ];
  if (opts.info?.drugClass) lines.push(`Therapeutic class: ${opts.info.drugClass}`);
  if (opts.info?.indication) {
    lines.push("", "Indication", opts.info.indication.slice(0, 1200));
  }
  if (opts.info?.dosage) {
    lines.push("", "Dosage & administration", opts.info.dosage.slice(0, 1200));
  }
  if (opts.info?.pharmacology) {
    lines.push("", "Pharmacology", opts.info.pharmacology.slice(0, 800));
  }
  if (opts.info?.contraindications) {
    lines.push("", "Contraindications", opts.info.contraindications.slice(0, 600));
  }
  if (opts.info?.sideEffects) {
    lines.push("", "Side effects", opts.info.sideEffects.slice(0, 800));
  }
  lines.push(
    "",
    "Always follow your doctor's advice. Prescription medicines are dispensed after pharmacist review.",
  );
  return lines.join("\n").slice(0, 8000);
}

async function ensureCategory(
  slug: string,
  name: string,
  cache: Map<string, string>,
): Promise<string> {
  const hit = cache.get(slug);
  if (hit) return hit;
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    cache.set(slug, existing.id);
    return existing.id;
  }
  const created = await prisma.category.create({
    data: { name, slug, isActive: true, sortOrder: 50 },
  });
  cache.set(slug, created.id);
  return created.id;
}

const HF =
  "https://huggingface.co/datasets/ArnobBot/Medicine-Dataset-of-Bangladesh/resolve/main";

async function ensureCsv(file: string): Promise<string> {
  const dest = path.join(DATA, file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return dest;
  fs.mkdirSync(DATA, { recursive: true });
  const url = `${HF}/${file}`;
  console.log(`Downloading ${file}…`);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Failed to download ${file}: ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit"));
  const limit = limitArg
    ? Number(limitArg.includes("=") ? limitArg.split("=")[1] : process.argv[process.argv.indexOf("--limit") + 1])
    : Infinity;

  const medPath = await ensureCsv("medicine.csv");
  const genPath = await ensureCsv("generic.csv");

  console.log("Reading CSVs…");
  const medicineRows = rowsToObjects(parseCsv(fs.readFileSync(medPath, "utf8")));
  const genericRows = fs.existsSync(genPath)
    ? rowsToObjects(parseCsv(fs.readFileSync(genPath, "utf8")))
    : [];

  const generics = new Map<string, GenericInfo>();
  for (const g of genericRows) {
    const name = (g["generic name"] || "").trim();
    if (!name) continue;
    generics.set(name.toLowerCase(), {
      indication: stripHtml(g["indication description"] || g.indication || ""),
      dosage: stripHtml(g["dosage description"] || ""),
      sideEffects: stripHtml(g["side effects description"] || ""),
      drugClass: stripHtml(g["drug class"] || ""),
      pharmacology: stripHtml(g["pharmacology description"] || ""),
      contraindications: stripHtml(g["contraindications description"] || ""),
    });
  }

  const catCache = new Map<string, string>();
  await ensureCategory("medicine", "Medicine", catCache);
  await ensureCategory("herbal", "Herbal", catCache);
  await ensureCategory("dermatological", "Dermatological", catCache);
  await ensureCategory("haircare", "Haircare", catCache);

  const manufacturerNames = new Set<string>();
  for (const row of medicineRows) {
    const n = (row.manufacturer || "").trim();
    if (n) manufacturerNames.add(n);
  }

  const brandIdBySlug = new Map<string, string>();
  const existingBrands = await prisma.brand.findMany({ select: { id: true, slug: true } });
  for (const b of existingBrands) brandIdBySlug.set(b.slug, b.id);

  const newBrands: { name: string; slug: string }[] = [];
  const usedBrandSlugs = new Set(brandIdBySlug.keys());
  for (const name of manufacturerNames) {
    let slug = slugify(name) || `brand-${newBrands.length}`;
    if (usedBrandSlugs.has(slug)) {
      if (brandIdBySlug.has(slug)) continue;
      let n = 2;
      while (usedBrandSlugs.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }
    usedBrandSlugs.add(slug);
    newBrands.push({ name, slug });
  }

  if (newBrands.length) {
    await prisma.brand.createMany({ data: newBrands, skipDuplicates: true });
    const fresh = await prisma.brand.findMany({ select: { id: true, slug: true, name: true } });
    brandIdBySlug.clear();
    for (const b of fresh) brandIdBySlug.set(b.slug, b.id);
  }

  const brandIdByName = new Map<string, string>();
  const allBrands = await prisma.brand.findMany({ select: { id: true, name: true, slug: true } });
  for (const b of allBrands) {
    brandIdByName.set(b.name.toLowerCase(), b.id);
    brandIdBySlug.set(b.slug, b.id);
  }

  const existingSkus = new Set(
    (
      await prisma.product.findMany({
        where: { sku: { not: null } },
        select: { sku: true },
      })
    )
      .map((p) => p.sku)
      .filter((s): s is string => Boolean(s)),
  );
  const existingSlugs = new Set(
    (await prisma.product.findMany({ select: { slug: true } })).map((p) => p.slug),
  );

  type Row = {
    name: string;
    slug: string;
    description: string;
    shortDesc: string;
    image: string;
    images: string[];
    price: number;
    comparePrice: number;
    stock: number;
    sku: string;
    unit: string;
    rating: number;
    reviewCount: number;
    isFeatured: boolean;
    isMedicine: boolean;
    requiresRx: boolean;
    tags: string[];
    section: string;
    categoryId: string;
    brandId: string | null;
  };

  const batch: Row[] = [];
  let skipped = 0;
  let prepared = 0;

  for (const row of medicineRows) {
    if (prepared >= limit) break;
    const brandName = (row["brand name"] || "").trim();
    const id = (row["brand id"] || "").trim();
    if (!brandName || !id) {
      skipped++;
      continue;
    }
    const sku = `BD-${id}`;
    if (existingSkus.has(sku)) {
      skipped++;
      continue;
    }
    const form = (row["dosage form"] || "Tablet").trim();
    const generic = (row.generic || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const strength = (row.strength || "").trim();
    const manufacturer = (row.manufacturer || "").trim();
    const type = (row.type || "allopathic").trim();
    const { mrp, pack } = parseMrp(
      row["package container"] || "",
      row["Package Size"] || "",
      form,
    );
    if (!(mrp > 0)) {
      skipped++;
      continue;
    }

    const name = [brandName, strength, form].filter(Boolean).join(" ");
    let slug = slugify(row.slug || `${brandName}-${form}-${strength}`) || `med-${id}`;
    if (existingSlugs.has(slug)) slug = `${slug}-${id}`.slice(0, 80);
    if (existingSlugs.has(slug)) {
      skipped++;
      continue;
    }
    existingSlugs.add(slug);
    existingSkus.add(sku);

    const selling = round2(mrp >= 2 ? mrp * 0.9 : mrp);
    const info = generic ? generics.get(generic.toLowerCase()) : undefined;
    const cat = await ensureCategory(
      categorySlug(type, form),
      categorySlug(type, form) === "medicine" ? "Medicine" : categorySlug(type, form),
      catCache,
    );
    const brandSlug = manufacturer ? slugify(manufacturer) : "";
    const brandId =
      (manufacturer && brandIdByName.get(manufacturer.toLowerCase())) ||
      (brandSlug ? brandIdBySlug.get(brandSlug) : null) ||
      null;

    const nid = Number(id) || prepared;
    const tags = Array.from(
      new Set(
        [
          brandName.toLowerCase(),
          generic.toLowerCase(),
          form.toLowerCase(),
          type.toLowerCase(),
          ...(info?.drugClass ? [info.drugClass.toLowerCase()] : []),
          "medicine",
        ]
          .map((t) => t.slice(0, 48))
          .filter((t) => t.length >= 2),
      ),
    ).slice(0, 12);

    batch.push({
      name: name.slice(0, 180),
      slug,
      description: buildDescription({
        name,
        generic: generic || "—",
        strength,
        form,
        manufacturer: manufacturer || "—",
        pack,
        mrp,
        type,
        info,
      }),
      shortDesc: [generic, strength, form, manufacturer].filter(Boolean).join(" · ").slice(0, 180),
      image: `/uploads/packs/${sku}.svg`,
      images: [`/uploads/packs/${sku}.svg`],
      price: selling,
      comparePrice: round2(mrp),
      stock: 40 + (nid % 160),
      sku,
      unit: pack.slice(0, 40),
      rating: round2(4.3 + (nid % 6) / 10),
      reviewCount: nid % 90,
      isFeatured: FEATURED_BRANDS.has(brandName.toLowerCase()),
      isMedicine: true,
      requiresRx: requiresRx(type, generic),
      tags,
      section: "medicine-catalog",
      categoryId: cat,
      brandId,
    });
    prepared++;

    if (batch.length >= 400) {
      await prisma.product.createMany({ data: batch, skipDuplicates: true });
      console.log(`Inserted ${prepared} medicines…`);
      batch.length = 0;
    }
  }

  if (batch.length) {
    await prisma.product.createMany({ data: batch, skipDuplicates: true });
  }

  const [products, medicines] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isMedicine: true } }),
  ]);
  console.log(
    `Done. prepared=${prepared} skipped=${skipped} totalProducts=${products} medicines=${medicines} manufacturers=${manufacturerNames.size} generics=${generics.size}`,
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
