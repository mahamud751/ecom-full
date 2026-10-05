import type { MetadataRoute } from "next";
import { apiServer } from "@/lib/api-client";
import { siteConfig } from "@/lib/seo";
import { productSitemapCount } from "@/lib/sitemap";

/**
 * Product URLs, split into /products/sitemap/[id].xml files of 45k each
 * (search engines cap one sitemap at 50k URLs). robots.txt lists every part;
 * /sitemap.xml keeps the non-product pages.
 */
export const dynamic = "force-dynamic";

export async function generateSitemaps() {
  const count = await productSitemapCount();
  return Array.from({ length: count }, (_, id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id) || 0;
  const now = new Date();
  try {
    const { products } = await apiServer<{
      products: { slug: string; updatedAt: string }[];
    }>(`/sitemap/products?page=${id + 1}`);
    return products.map((p) => ({
      url: `${siteConfig.url}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.75,
    }));
  } catch {
    return [];
  }
}
