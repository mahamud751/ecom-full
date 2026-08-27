import { apiServer } from "@/lib/api-client";

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

/**
 * Smart search — delegates to the NestJS backend (GET /search).
 */
export async function smartSearch(
  query: string,
  opts?: {
    hub?: "all" | "store" | "lab" | "doctor";
    limit?: number;
    fallbackPopular?: boolean;
  },
): Promise<{ hits: SearchHit[]; suggestions: string[]; query: string }> {
  const q = query.trim();
  if (!q) return { hits: [], suggestions: [], query: q };

  const params = new URLSearchParams({
    q,
    hub: opts?.hub || "all",
    limit: String(opts?.limit ?? 40),
  });
  if (opts?.fallbackPopular === false) params.set("fallback", "0");

  return apiServer<{
    hits: SearchHit[];
    suggestions: string[];
    query: string;
  }>(`/search?${params.toString()}`);
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
