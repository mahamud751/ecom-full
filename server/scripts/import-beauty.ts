/**
 * Import beauty / personal-care SKUs from Open Beauty Facts (ODbL).
 * Real pack photos. Not scraped from Shajgoj or Daraz.
 *
 * From server/: npx tsx scripts/import-beauty.ts
 */
import { PrismaClient } from "@prisma/client";
import { BOT_UA, saveRemoteImage } from "./catalog-media";

const prisma = new PrismaClient();
const BASE = "https://world.openbeautyfacts.org/api/v2/search";

const BRANDS = [
  "himalaya",
  "nivea",
  "dove",
  "vaseline",
  "garnier",
  "loreal",
  "neutrogena",
  "cetaphil",
  "simple",
  "the-ordinary",
  "mamaearth",
  "lakme",
  "maybelline",
  "tresemme",
  "cerave",
  "bioderma",
  "cosrx",
  "innisfree",
  "ponds",
  "aveeno",
  "eucerin",
  "la-roche-posay",
  "pantene",
  "sunsilk",
  "colgate",
  "sensodyne",
  "dettol",
  "lux",
  "palmolive",
  "olay",
  "nyx",
  "revlon",
  "clinique",
  "the-body-shop",
  "head-shoulders",
  "johnson",
  "oriflame",
  "vatika",
  "dabur",
  "listerine",
  "always",
  "whisper",
  "stayfree",
  "kotex",
  "carefree",
  "sofy",
  "pampers",
  "huggies",
  "durex",
  "closeup",
  "pepsodent",
  "oral-b",
  "lifebuoy",
  "savlon",
  "himalaya-herbals",
];

const CATEGORIES = [
  "en:feminine-hygiene",
  "en:baby-cosmetics",
  "en:toothpastes",
];

type ObfProduct = {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  image_front_url?: string;
  image_url?: string;
  quantity?: string;
  categories_tags?: string[];
  ingredients_text?: string;
};

function looksEnglish(s: string): boolean {
  if (!s) return false;
  const letters = (s.match(/[A-Za-z]/g) || []).length;
  const compact = s.replace(/\s+/g, "");
  return letters >= 10 && compact.length > 0 && letters / compact.length >= 0.72;
}

function slugify(text: string, max = 70): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}

function mapCategory(tags: string[], name: string): string {
  const t = `${tags.join(" ")} ${name}`.toLowerCase();
  if (/(condom|lubricant|intimate|durex)/.test(t)) return "sexual-wellness";
  if (/(sanitary|tampon|panty-liner|menstrual|feminine|pad)/.test(t))
    return "feminine-care";
  if (/(baby|infant|nappy|diaper|mom)/.test(t)) return "baby-mom";
  if (/(shampoo|conditioner|hair-oil|hair)/.test(t)) return "haircare";
  if (/(lipstick|mascara|makeup|foundation|eyeliner|kajal|concealer|nail)/.test(t))
    return "beauty";
  if (/(perfume|fragrance|eau-de)/.test(t)) return "beauty";
  if (/(toothpaste|mouthwash|dental|listerine|sensodyne|colgate|oral-b|closeup)/.test(t))
    return "healthcare";
  if (/(soap|hand-wash|shower-gel|dettol|lux|palmolive|homecare|lifebuoy|savlon)/.test(t))
    return "homecare";
  if (/(supplement|vitamin)/.test(t)) return "supplement";
  if (/(sunscreen|serum|cream|cleanser|toner|moisturizer|lotion|face)/.test(t))
    return "skincare";
  return "skincare";
}

function guessPrice(name: string, tags: string[], code: string): { price: number; compare: number } {
  const t = `${name} ${tags.join(" ")}`.toLowerCase();
  let mrp = 480;
  if (/(serum)/.test(t)) mrp = 980;
  else if (/(sunscreen|spf)/.test(t)) mrp = 720;
  else if (/(lipstick|mascara|foundation)/.test(t)) mrp = 650;
  else if (/(shampoo|conditioner)/.test(t)) mrp = 420;
  else if (/(baby)/.test(t)) mrp = 360;
  else if (/(toothpaste|soap|wash)/.test(t)) mrp = 220;
  else if (/(perfume|fragrance)/.test(t)) mrp = 1450;
  else if (/(cerave|bioderma|la-roche|eucerin|ordinary)/.test(t)) mrp = 1250;
  const n = Number(code.slice(-4)) || 100;
  mrp = Math.round((mrp * (0.85 + (n % 30) / 100)) / 5) * 5;
  const price = Math.round(mrp * 0.88);
  return { price, compare: mrp };
}

async function fetchPage(params: Record<string, string>): Promise<ObfProduct[]> {
  const u = new URL(BASE);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set("page_size", "40");
  u.searchParams.set(
    "fields",
    "code,product_name,product_name_en,brands,image_front_url,image_url,quantity,categories_tags,ingredients_text",
  );
  const res = await fetch(u, { headers: { "User-Agent": BOT_UA } });
  if (!res.ok) return [];
  const data = (await res.json()) as { products?: ObfProduct[] };
  return data.products || [];
}

async function ensureCategory(slug: string, name: string, cache: Map<string, string>) {
  const hit = cache.get(slug);
  if (hit) return hit;
  let row = await prisma.category.findUnique({ where: { slug } });
  if (!row) {
    row = await prisma.category.create({
      data: { name, slug, isActive: true, sortOrder: 20 },
    });
  }
  cache.set(slug, row.id);
  return row.id;
}

async function main() {
  const catCache = new Map<string, string>();
  await ensureCategory("skincare", "Skincare", catCache);
  await ensureCategory("haircare", "Haircare", catCache);
  await ensureCategory("beauty", "Beauty", catCache);
  await ensureCategory("baby-mom", "Baby & Mom Care", catCache);
  await ensureCategory("healthcare", "Healthcare", catCache);
  await ensureCategory("homecare", "Homecare", catCache);
  await ensureCategory("supplement", "Supplement", catCache);
  await ensureCategory("feminine-care", "Feminine Care", catCache);
  await ensureCategory("sexual-wellness", "Sexual Wellness", catCache);

  const brandIdByName = new Map<string, string>();
  for (const b of await prisma.brand.findMany({ select: { id: true, name: true, slug: true } })) {
    brandIdByName.set(b.name.toLowerCase(), b.id);
    brandIdByName.set(b.slug, b.id);
  }

  const existingSku = new Set(
    (await prisma.product.findMany({ where: { sku: { startsWith: "OBF-" } }, select: { sku: true } }))
      .map((p) => p.sku)
      .filter(Boolean) as string[],
  );
  const existingSlug = new Set(
    (await prisma.product.findMany({ select: { slug: true } })).map((p) => p.slug),
  );

  let imported = 0;
  let skipped = 0;

  const jobs: { key: string; params: Record<string, string> }[] = [
    ...BRANDS.map((brand) => ({ key: brand, params: { brands_tags: brand } })),
    ...CATEGORIES.map((cat) => ({ key: cat, params: { categories_tags: cat } })),
  ];

  for (const job of jobs) {
    const seen = new Set<string>();
    for (const page of [1, 2]) {
      let rows: ObfProduct[] = [];
      try {
        rows = await fetchPage({ ...job.params, page: String(page) });
      } catch {
        continue;
      }
      for (const row of rows) {
        const code = (row.code || "").trim();
        const rawEn = (row.product_name_en || "").trim();
        const raw = (row.product_name || "").trim();
        const name = looksEnglish(rawEn) ? rawEn : looksEnglish(raw) ? raw : "";
        const remote = row.image_front_url || row.image_url || "";
        if (
          !code ||
          name.length < 14 ||
          !name.includes(" ") ||
          !remote.startsWith("http")
        ) {
          skipped++;
          continue;
        }
        const sku = `OBF-${code}`;
        if (existingSku.has(sku) || seen.has(code)) {
          skipped++;
          continue;
        }
        seen.add(code);
        let slug = slugify(`${name}-${code.slice(-6)}`) || `obf-${code}`;
        if (existingSlug.has(slug)) slug = `obf-${code}`.slice(0, 80);
        existingSlug.add(slug);
        existingSku.add(sku);

        const tags = row.categories_tags || [];
        const catSlug = mapCategory(tags, name);
        const categoryId = await ensureCategory(
          catSlug,
          catSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          catCache,
        );
        const brandName = (row.brands || job.key).split(",")[0].trim() || job.key;
        let brandId = brandIdByName.get(brandName.toLowerCase());
        if (!brandId) {
          const bslug = slugify(brandName) || `brand-${code.slice(-4)}`;
          const created = await prisma.brand.upsert({
            where: { slug: bslug },
            update: {},
            create: { name: brandName, slug: bslug },
          });
          brandId = created.id;
          brandIdByName.set(brandName.toLowerCase(), brandId);
          brandIdByName.set(bslug, brandId);
        }

        const { price, compare } = guessPrice(name, tags, code);
        const qty = (row.quantity || "").trim();
        const fullName = qty && !name.toLowerCase().includes(qty.toLowerCase())
          ? `${name} ${qty}`
          : name;
        const ingredients = (row.ingredients_text || "").slice(0, 1200);
        const local = await saveRemoteImage({
          url: remote,
          folder: "beauty",
          filename: sku,
        });
        const image = local || remote;

        await prisma.product.create({
          data: {
            name: fullName.slice(0, 180),
            slug,
            sku,
            description: [
              fullName,
              brandName ? `Brand: ${brandName}` : "",
              qty ? `Size: ${qty}` : "",
              ingredients ? `\nIngredients\n${ingredients}` : "",
              "\nProduct data adapted from Open Beauty Facts contributors (ODbL).",
            ]
              .filter(Boolean)
              .join("\n")
              .slice(0, 5000),
            shortDesc: [brandName, qty].filter(Boolean).join(" · ").slice(0, 160),
            image,
            images: [image],
            price,
            comparePrice: compare,
            stock: 25 + (Number(code.slice(-2)) % 80),
            unit: qty || "pcs",
            rating: 4.3 + ((Number(code.slice(-1)) % 6) / 10),
            reviewCount: Number(code.slice(-2)) % 70,
            isFeatured: imported < 12,
            isMedicine: false,
            requiresRx: false,
            tags: Array.from(
              new Set(
                [brandName.toLowerCase(), catSlug, ...tags.slice(0, 4).map((x) => x.replace(/^en:/, ""))]
                  .map((x) => x.slice(0, 40))
                  .filter((x) => x.length > 1),
              ),
            ).slice(0, 10),
            section: "open-beauty",
            categoryId,
            brandId,
            expressDelivery: true,
            isActive: true,
          },
        });
        imported++;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    if (imported && imported % 50 === 0) console.log(`Imported ${imported} beauty SKUs…`);
  }

  const [beauty, skin, hair] = await Promise.all([
    prisma.product.count({ where: { category: { slug: "beauty" } } }),
    prisma.product.count({ where: { category: { slug: "skincare" } } }),
    prisma.product.count({ where: { category: { slug: "haircare" } } }),
  ]);
  console.log(`Done. imported=${imported} skipped=${skipped} beauty=${beauty} skincare=${skin} haircare=${hair}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
