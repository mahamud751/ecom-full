import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type SearchHitType = "product" | "doctor" | "lab_test" | "lab_package";

export type SearchHit = {
  type: SearchHitType;
  id: string;
  slug?: string;
  title: string;
  subtitle: string;
  image: string | null;
  price?: number;
  href: string;
  score: number;
  badges?: string[];
};

function tokens(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s+-]/gu, " ")
    .split(/[\s,+/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function scoreText(haystack: string, toks: string[]): number {
  const h = haystack.toLowerCase();
  let score = 0;
  for (const t of toks) {
    if (h === t) score += 12;
    else if (h.startsWith(t)) score += 8;
    else if (h.includes(t)) score += 5;
    // soft fuzzy: token is prefix of a word
    else if (h.split(/\s+/).some((w) => w.startsWith(t))) score += 3;
  }
  return score;
}

/** Expand query with synonym-style healthcare terms for better matching */
export function expandQuery(q: string): string[] {
  const base = tokens(q);
  const map: Record<string, string[]> = {
    skin: ["dermatologist", "skincare", "serum", "acne", "cream", "lotion"],
    face: ["skincare", "serum", "facewash", "cleanser", "dermatologist"],
    hair: ["haircare", "shampoo", "oil", "hair"],
    heart: ["cardiologist", "cardiac", "bp", "pressure", "lipid"],
    chest: ["cardiologist", "cardiac"],
    child: ["pediatrician", "baby", "kids", "child"],
    baby: ["pediatrician", "baby", "mom"],
    sugar: ["diabetologist", "diabetes", "hba1c", "glucose"],
    diabetes: ["diabetologist", "hba1c", "glucose", "sugar"],
    thyroid: ["tsh", "thyroid"],
    fever: ["general physician", "cbc", "paracetamol"],
    cold: ["general physician", "cough"],
    cough: ["general physician", "ent"],
    bone: ["orthopedic", "joint", "pain"],
    joint: ["orthopedic"],
    mind: ["psychiatrist", "anxiety", "sleep"],
    anxiety: ["psychiatrist"],
    woman: ["gynecologist", "gynae", "feminine"],
    pregnancy: ["gynecologist"],
    ear: ["ent", "nose", "throat"],
    nose: ["ent"],
    blood: ["cbc", "lab", "hemoglobin"],
    vitamin: ["supplement", "vitamins"],
    medicine: ["medicine", "tablet", "capsule"],
    cream: ["skincare", "beauty", "lotion"],
    serum: ["skincare", "beauty"],
  };
  const extra: string[] = [];
  for (const t of base) {
    if (map[t]) extra.push(...map[t]);
  }
  return Array.from(new Set([...base, ...extra]));
}

@Injectable()
export class SmartSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async smartSearch(
    query: string,
    opts?: {
      hub?: "all" | "store" | "lab" | "doctor";
      limit?: number;
      fallbackPopular?: boolean;
    },
  ): Promise<{ hits: SearchHit[]; suggestions: string[]; query: string }> {
    const q = query.trim();
    const hub = opts?.hub || "all";
    const limit = opts?.limit ?? 40;
    if (!q) {
      return {
        hits: [],
        suggestions: await this.popularSuggestions(),
        query: q,
      };
    }

    const toks = expandQuery(q);
    const primary = tokens(q);
    // Use expanded tokens for DB query if primary is too short (e.g. single char)
    const searchTokens = primary.length > 0 ? primary : toks;
    const hits: SearchHit[] = [];

    if (hub === "all" || hub === "store") {
      const products = searchTokens.length
        ? await this.prisma.product.findMany({
            where: {
              isActive: true,
              OR: [
                ...searchTokens.flatMap((t) => [
                  { name: { contains: t, mode: "insensitive" as const } },
                  {
                    description: { contains: t, mode: "insensitive" as const },
                  },
                  { shortDesc: { contains: t, mode: "insensitive" as const } },
                  { tags: { has: t } },
                  {
                    brand: {
                      name: { contains: t, mode: "insensitive" as const },
                    },
                  },
                  {
                    category: {
                      name: { contains: t, mode: "insensitive" as const },
                    },
                  },
                ]),
              ],
            },
            include: { brand: true, category: true },
            take: 60,
          })
        : [];

      for (const p of products) {
        const bag = [
          p.name,
          p.description,
          p.shortDesc || "",
          p.brand?.name || "",
          p.category?.name || "",
          ...(p.tags || []),
          p.isMedicine ? "medicine tablet capsule" : "",
        ].join(" ");
        let score = scoreText(bag, toks);
        if (primary.some((t) => p.name.toLowerCase().includes(t))) score += 10;
        if (p.isFeatured) score += 2;
        if (p.image) score += 1;
        if (score > 0) {
          hits.push({
            type: "product",
            id: p.id,
            slug: p.slug,
            title: p.name,
            subtitle: [p.brand?.name, p.category?.name]
              .filter(Boolean)
              .join(" · "),
            image: p.image,
            price: p.price,
            href: `/products/${p.slug}`,
            score,
            badges: [
              ...(p.isMedicine ? ["Medicine"] : []),
              ...(p.isFlashSale ? ["Sale"] : []),
            ],
          });
        }
      }
    }

    if (hub === "all" || hub === "doctor") {
      const doctors = primary.length
        ? await this.prisma.doctor.findMany({
            where: {
              isActive: true,
              OR: primary.flatMap((t) => [
                { name: { contains: t, mode: "insensitive" as const } },
                { specialty: { contains: t, mode: "insensitive" as const } },
                { hospital: { contains: t, mode: "insensitive" as const } },
                { bio: { contains: t, mode: "insensitive" as const } },
              ]),
            },
            take: 30,
          })
        : [];

      for (const d of doctors) {
        const bag = [
          d.name,
          d.specialty,
          d.hospital || "",
          d.bio || "",
          d.languages,
        ].join(" ");
        let score = scoreText(bag, toks) + 4;
        if (primary.some((t) => d.specialty.toLowerCase().includes(t)))
          score += 12;
        if (d.isOnline) score += 2;
        if (score > 0) {
          hits.push({
            type: "doctor",
            id: d.id,
            slug: d.slug,
            title: d.name,
            subtitle: `${d.specialty}${d.hospital ? ` · ${d.hospital}` : ""}`,
            image: d.image,
            price: d.fee,
            href: `/doctors/${d.slug}`,
            score,
            badges: d.isOnline ? ["Online"] : ["Schedule"],
          });
        }
      }
    }

    if (hub === "all" || hub === "lab") {
      const [tests, packages] = await Promise.all([
        primary.length
          ? this.prisma.labTest.findMany({
              where: {
                isActive: true,
                OR: primary.flatMap((t) => [
                  { name: { contains: t, mode: "insensitive" as const } },
                  {
                    description: { contains: t, mode: "insensitive" as const },
                  },
                  { category: { contains: t, mode: "insensitive" as const } },
                ]),
              },
              take: 30,
            })
          : Promise.resolve([]),
        primary.length
          ? this.prisma.labPackage.findMany({
              where: {
                isActive: true,
                OR: primary.flatMap((t) => [
                  { name: { contains: t, mode: "insensitive" as const } },
                  {
                    description: { contains: t, mode: "insensitive" as const },
                  },
                ]),
              },
              take: 20,
            })
          : Promise.resolve([]),
      ]);

      for (const t of tests) {
        const bag = [
          t.name,
          t.description || "",
          t.category || "",
          "lab test",
        ].join(" ");
        const score = scoreText(bag, toks) + 3;
        if (score > 0) {
          hits.push({
            type: "lab_test",
            id: t.id,
            slug: t.slug,
            title: t.name,
            subtitle: `${t.category || "Lab test"} · report ${t.reportHours}h`,
            image: t.image,
            price: t.price,
            href: `/lab-test/${t.slug}`,
            score,
            badges: ["Test"],
          });
        }
      }
      for (const p of packages) {
        const bag = [p.name, p.description || "", "lab package checkup"].join(
          " ",
        );
        const score = scoreText(bag, toks) + 3;
        if (score > 0) {
          hits.push({
            type: "lab_package",
            id: p.id,
            slug: p.slug,
            title: p.name,
            subtitle: `Package · report ${p.reportHours}h`,
            image: p.image,
            price: p.price,
            href: `/lab-test/package/${p.slug}`,
            score,
            badges: ["Package"],
          });
        }
      }
    }

    // Fallback: if no product hits were found, show featured products
    // Image search must pass fallbackPopular: false so it never dumps the same 12.
    const productHits = hits.filter((h) => h.type === "product");
    if (
      opts?.fallbackPopular !== false &&
      productHits.length === 0 &&
      (hub === "all" || hub === "store")
    ) {
      const featured = await this.prisma.product.findMany({
        where: { isActive: true },
        include: { brand: true, category: true },
        orderBy: [{ isFeatured: "desc" }, { reviewCount: "desc" }],
        take: 12,
      });
      for (const p of featured) {
        hits.push({
          type: "product",
          id: p.id,
          slug: p.slug,
          title: p.name,
          subtitle: [p.brand?.name, p.category?.name]
            .filter(Boolean)
            .join(" · "),
          image: p.image,
          price: p.price,
          href: `/products/${p.slug}`,
          score: 0,
          badges: [
            ...(p.isMedicine ? ["Medicine"] : []),
            ...(p.isFlashSale ? ["Sale"] : []),
            "Popular",
          ],
        });
      }
    }

    hits.sort((a, b) => b.score - a.score);
    const top = hits.slice(0, limit);

    const suggestions = Array.from(
      new Set([
        ...top.slice(0, 6).map((h) => h.title.split(/[—-]/)[0].trim()),
        ...toks.filter((t) => t.length > 3).slice(0, 4),
      ]),
    ).slice(0, 10);

    return { hits: top, suggestions, query: q };
  }

  private async popularSuggestions(): Promise<string[]> {
    const [products, doctors, tests] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        take: 4,
        select: { name: true },
      }),
      this.prisma.doctor.findMany({
        where: { isActive: true },
        take: 3,
        select: { specialty: true },
      }),
      this.prisma.labTest.findMany({
        where: { isActive: true },
        take: 3,
        orderBy: { bookedCount: "desc" },
        select: { name: true },
      }),
    ]);
    return Array.from(
      new Set([
        ...products.map((p) => p.name.split(" ")[0]),
        ...doctors.map((d) => d.specialty),
        ...tests.map((t) => t.name.split("—")[0].trim()),
        "serum",
        "cbc",
        "dermatologist",
      ]),
    ).slice(0, 12);
  }
}

/** Build keywords from an image filename + optional OCR/hint text for catalog match */
export function keywordsFromImageMeta(meta: {
  filename?: string;
  hint?: string;
}): string {
  const fromName = (meta.filename || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\d{6,}/g, " ");
  const parts = tokens(`${fromName} ${meta.hint || ""}`);
  // Drop generic noise
  const noise = new Set([
    "img",
    "image",
    "photo",
    "pic",
    "dsc",
    "screenshot",
    "upload",
    "file",
    "jpeg",
    "jpg",
    "png",
    "webp",
  ]);
  return parts.filter((p) => !noise.has(p)).join(" ");
}
