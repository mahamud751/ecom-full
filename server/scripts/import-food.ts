/**
 * Import food, nutrition, baby milk, and pet SKUs from Open Food Facts (ODbL).
 * Real pack photos. Not scraped from Daraz or Arogga.
 *
 * From server/: npx tsx scripts/import-food.ts
 */
import { PrismaClient } from "@prisma/client";
import { BOT_UA, saveRemoteImage } from "./catalog-media";

const prisma = new PrismaClient();
const BASE = "https://world.openfoodfacts.org/api/v2/search";

const BRANDS = [
  "nestle",
  "horlicks",
  "bournvita",
  "ensure",
  "pediasure",
  "glucerna",
  "cerelac",
  "lactogen",
  "nido",
  "nan",
  "similac",
  "enfamil",
  "aptamil",
  "quaker",
  "kelloggs",
  "anlene",
  "pran",
  "danish",
  "fresh",
  "maggi",
  "knorr",
  "pedigree",
  "whiskas",
  "purina",
  "royal-canin",
  "me-o",
  "centrum",
  "now-foods",
  "nature-made",
  "ensure-plus",
];

const CATEGORIES = [
  "en:dietary-supplements",
  "en:baby-milks",
  "en:baby-foods",
  "en:breakfast-cereals",
  "en:pet-food",
];

type OffProduct = {
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
  if (/(pet|dog|cat|whiskas|pedigree|purina|royal-canin)/.test(t)) return "pet-care";
  if (/(baby|infant|cerelac|lactogen|similac|enfamil|aptamil|nappy)/.test(t))
    return "baby-mom";
  if (/(supplement|vitamin|protein|omega|centrum|multivitamin)/.test(t))
    return "supplement";
  return "food-nutrition";
}

function guessPrice(name: string, tags: string[], code: string): { price: number; compare: number } {
  const t = `${name} ${tags.join(" ")}`.toLowerCase();
  let mrp = 420;
  if (/(ensure|pediasure|glucerna|similac|enfamil|aptamil)/.test(t)) mrp = 1850;
  else if (/(cerelac|lactogen|nido|nan)/.test(t)) mrp = 980;
  else if (/(supplement|vitamin|protein|centrum)/.test(t)) mrp = 1250;
  else if (/(pet|dog|cat|whiskas|pedigree)/.test(t)) mrp = 650;
  else if (/(horlicks|bournvita|anlene)/.test(t)) mrp = 720;
  else if (/(cereal|oat|quaker|kellogg)/.test(t)) mrp = 480;
  const n = Number(code.slice(-4)) || 100;
  mrp = Math.round((mrp * (0.85 + (n % 30) / 100)) / 5) * 5;
  const price = Math.round(mrp * 0.9);
  return { price, compare: mrp };
}

async function fetchPage(
  params: Record<string, string>,
): Promise<OffProduct[]> {
  const u = new URL(BASE);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set("page_size", "40");
  u.searchParams.set(
    "fields",
    "code,product_name,product_name_en,brands,image_front_url,image_url,quantity,categories_tags,ingredients_text",
  );
  const res = await fetch(u, { headers: { "User-Agent": BOT_UA } });
  if (!res.ok) return [];
  const data = (await res.json()) as { products?: OffProduct[] };
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
  await ensureCategory("food-nutrition", "Food & Nutrition", catCache);
  await ensureCategory("supplement", "Supplement", catCache);
  await ensureCategory("baby-mom", "Baby & Mom Care", catCache);
  await ensureCategory("pet-care", "Pet Care", catCache);

  const brandIdByName = new Map<string, string>();
  for (const b of await prisma.brand.findMany({ select: { id: true, name: true, slug: true } })) {
    brandIdByName.set(b.name.toLowerCase(), b.id);
    brandIdByName.set(b.slug, b.id);
  }

  const existingSku = new Set(
    (
      await prisma.product.findMany({
        where: { sku: { startsWith: "OFF-" } },
        select: { sku: true },
      })
    )
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
      let rows: OffProduct[] = [];
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
        if (!code || name.length < 12 || !name.includes(" ") || !remote.startsWith("http")) {
          skipped++;
          continue;
        }
        const sku = `OFF-${code}`;
        if (existingSku.has(sku) || seen.has(code)) {
          skipped++;
          continue;
        }
        seen.add(code);
        let slug = slugify(`${name}-${code.slice(-6)}`) || `off-${code}`;
        if (existingSlug.has(slug)) slug = `off-${code}`.slice(0, 80);
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
        const fullName =
          qty && !name.toLowerCase().includes(qty.toLowerCase()) ? `${name} ${qty}` : name;
        const ingredients = (row.ingredients_text || "").slice(0, 1200);
        const local = await saveRemoteImage({
          url: remote,
          folder: "food",
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
              "\nProduct data adapted from Open Food Facts contributors (ODbL).",
            ]
              .filter(Boolean)
              .join("\n")
              .slice(0, 5000),
            shortDesc: [brandName, qty].filter(Boolean).join(" · ").slice(0, 160),
            image,
            images: [image],
            price,
            comparePrice: compare,
            stock: 20 + (Number(code.slice(-2)) % 70),
            unit: qty || "pcs",
            rating: 4.2 + ((Number(code.slice(-1)) % 7) / 10),
            reviewCount: Number(code.slice(-2)) % 60,
            isFeatured: imported < 8,
            isMedicine: false,
            requiresRx: false,
            tags: Array.from(
              new Set(
                [brandName.toLowerCase(), catSlug, ...tags.slice(0, 4).map((x) => x.replace(/^en:/, ""))]
                  .map((x) => x.slice(0, 40))
                  .filter((x) => x.length > 1),
              ),
            ).slice(0, 10),
            section: "open-food",
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
    if (imported && imported % 40 === 0) console.log(`Imported ${imported} food SKUs…`);
  }

  const [food, supp, baby, pet] = await Promise.all([
    prisma.product.count({ where: { category: { slug: "food-nutrition" } } }),
    prisma.product.count({ where: { category: { slug: "supplement" } } }),
    prisma.product.count({ where: { category: { slug: "baby-mom" } } }),
    prisma.product.count({ where: { category: { slug: "pet-care" } } }),
  ]);
  console.log(
    `Done. imported=${imported} skipped=${skipped} food=${food} supplement=${supp} baby=${baby} pet=${pet}`,
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
