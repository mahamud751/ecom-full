import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";
import { productSitemapCount } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const productParts = await productSitemapCount();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/doctor-portal",
          "/order-success",
          "/checkout",
        ],
      },
    ],
    sitemap: [
      `${siteConfig.url}/sitemap.xml`,
      ...Array.from(
        { length: productParts },
        (_, id) => `${siteConfig.url}/products/sitemap/${id}.xml`,
      ),
    ],
    host: siteConfig.url,
  };
}
