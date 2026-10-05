import { apiServer } from "@/lib/api-client";

/** How many /products/sitemap/[id].xml files exist (45k product URLs each). */
export async function productSitemapCount(): Promise<number> {
  try {
    const { productPages } = await apiServer<{ productPages: number }>(
      "/sitemap?products=0",
    );
    return Math.max(1, productPages || 0);
  } catch {
    return 1;
  }
}
