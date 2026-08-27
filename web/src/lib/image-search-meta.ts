import { SERVER_API_BASE } from "@/lib/api-client";

export type ImageSearchMeta = {
  imageUrl: string;
  productIds: string[];
  scores: Record<string, number>;
  query: string;
  labels: string[];
  weak: boolean;
  matchType: "visual" | "text" | "mixed";
  tip: string;
};

/**
 * The NestJS backend writes a `.json` sibling next to every uploaded
 * search image and serves it statically — fetch it from the API origin.
 */
export async function readImageSearchMeta(
  imageUrl: string,
): Promise<ImageSearchMeta | null> {
  try {
    const origin = SERVER_API_BASE.replace(/\/api\/?$/, "");
    const rel = imageUrl.replace(/^\//, "").replace(/\.[a-z0-9]+$/i, ".json");
    const res = await fetch(`${origin}/${rel}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as ImageSearchMeta;
    if (!Array.isArray(data.productIds)) return null;
    return data;
  } catch {
    return null;
  }
}
