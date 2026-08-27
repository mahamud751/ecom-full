/**
 * Image → catalog query helpers (no external vision API).
 * Uses filename tokens, optional user hint, and strict brand/category matches.
 */

const NOISE = new Set([
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
  "gif",
  "heic",
  "search",
  "download",
  "temp",
  "tmp",
  "blank",
  "untitled",
  "fullsize",
  "resized",
  "compressed",
  "copy",
]);

export function tokensFromText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[_\-.+]+/g, " ")
    .replace(/[^a-z0-9\s&']/gi, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !NOISE.has(t) && !/^\d+$/.test(t));
}

export function buildImageSearchQuery(opts: {
  filename: string;
  hint?: string;
  brands: string[];
  categories: string[];
  productHints: { name: string; tags: string[] }[];
}): { query: string; matched: string[]; weak: boolean } {
  const fileTokens = tokensFromText(opts.filename);
  const hintTokens = tokensFromText(opts.hint || "");
  const blob = `${opts.filename} ${opts.hint || ""}`.toLowerCase();

  const matched = new Set<string>([...fileTokens, ...hintTokens]);

  // Strict brand match (full name or significant token ≥4 chars)
  for (const brand of opts.brands) {
    const b = brand.toLowerCase().trim();
    if (b.length < 3) continue;
    if (blob.includes(b)) {
      matched.add(brand);
      continue;
    }
    const parts = b.split(/\s+/).filter((p) => p.length >= 4);
    if (parts.some((p) => blob.includes(p))) matched.add(brand);
  }

  // Strict category match
  for (const cat of opts.categories) {
    const c = cat.toLowerCase().trim();
    if (c.length < 4) continue;
    if (blob.includes(c)) {
      matched.add(cat);
      continue;
    }
    // e.g. "skincare" in filename
    const parts = c.split(/[\s&/]+/).filter((p) => p.length >= 5);
    if (parts.some((p) => blob.includes(p))) matched.add(cat);
  }

  // Product name tokens only if word appears in filename/hint (min 4 chars)
  for (const p of opts.productHints) {
    const words = p.name
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !NOISE.has(w));
    const hit = words.filter((w) => blob.includes(w));
    if (hit.length >= 1) {
      hit.slice(0, 2).forEach((w) => matched.add(w));
      (p.tags || []).slice(0, 1).forEach((t) => {
        if (t.length >= 3) matched.add(t);
      });
    }
  }

  // Synonym expand for common visual product types
  const expand: Record<string, string[]> = {
    serum: ["serum", "skincare", "face"],
    cream: ["cream", "skincare"],
    shampoo: ["shampoo", "haircare", "hair"],
    vitamin: ["vitamin", "supplement"],
    medicine: ["medicine", "tablet"],
    tablet: ["medicine", "tablet"],
    capsule: ["medicine", "capsule"],
    soap: ["soap", "body"],
    oil: ["oil", "hair", "herbal"],
    baby: ["baby", "mom"],
    facewash: ["facewash", "cleanser", "skincare"],
    cleanser: ["cleanser", "skincare"],
    sunscreen: ["sunscreen", "skincare"],
    lotion: ["lotion", "skincare"],
    powder: ["powder", "body"],
    gel: ["gel", "skincare"],
    mask: ["mask", "skincare", "face"],
    tonic: ["tonic", "skincare"],
    toner: ["toner", "skincare"],
    spray: ["spray", "medicine"],
    drop: ["drop", "medicine", "eye"],
    syrup: ["syrup", "medicine"],
    inhaler: ["inhaler", "medicine"],
    bp: ["bp", "pressure", "cardiac"],
    pain: ["pain", "relief", "analgesic"],
    skin: ["skin", "skincare", "dermatologist"],
    hair: ["hair", "haircare", "shampoo"],
    face: ["face", "skincare", "serum"],
    beauty: ["beauty", "skincare", "cosmetic"],
  };
  for (const t of [...matched]) {
    const key = t.toLowerCase();
    if (expand[key]) expand[key].forEach((x) => matched.add(x));
  }

  const query = Array.from(matched).join(" ").trim();
  const weak = query.length < 3;

  return {
    query: weak ? "" : query,
    matched: Array.from(matched),
    weak,
  };
}

/** Human label from matched catalog products (not a generic fallback query). */
export function labelsFromProductNames(names: string[]): string[] {
  const noise = new Set([
    ...NOISE,
    "buy",
    "get",
    "free",
    "ml",
    "pcs",
    "with",
    "plus",
    "the",
    "and",
    "for",
  ]);
  const counts = new Map<string, number>();
  for (const name of names) {
    for (const w of name.toLowerCase().split(/[^a-z0-9']+/)) {
      if (w.length < 4 || noise.has(w) || /^\d+$/.test(w)) continue;
      counts.set(w, (counts.get(w) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, 8);
}

export const FALLBACK_BY_HUB: Record<string, string> = {
  all: "skincare serum beauty medicine vitamin cream shampoo lotion tablet",
  store: "skincare serum beauty medicine vitamin cream shampoo lotion tablet",
  lab: "cbc blood test thyroid sugar diabetes lipid",
  doctor:
    "general physician dermatologist pediatrician gynecologist cardiologist",
};

/** Client-safe category shortcuts for image search UX */
export const IMAGE_CATEGORY_HINTS = [
  { id: "medicine", label: "Medicine / tablets", q: "medicine tablet capsule" },
  {
    id: "skincare",
    label: "Skincare / beauty",
    q: "skincare serum cream beauty",
  },
  { id: "hair", label: "Haircare", q: "hair shampoo oil" },
  { id: "device", label: "Device / kit", q: "device medical healthcare" },
  { id: "lab", label: "Lab / blood test", q: "cbc blood lab test" },
  {
    id: "doctor",
    label: "Doctor consult",
    q: "general physician dermatologist",
  },
  { id: "baby", label: "Baby & mom", q: "baby pediatrician" },
  { id: "vitamin", label: "Vitamins", q: "vitamin supplement" },
] as const;
