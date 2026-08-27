import type { MetadataRoute } from "next";
import { apiServer } from "@/lib/api-client";
import { siteConfig } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/store",
    "/products",
    "/doctors",
    "/lab-test",
    "/search",
    "/contact",
    "/privacy",
    "/terms",
    "/refund",
    "/compliance",
    "/track-order",
    "/wishlist",
    "/cart",
  ].map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority:
      path === "" ? 1 : path === "/store" || path === "/products" ? 0.9 : 0.7,
  }));

  try {
    const { categories, products, doctors } = await apiServer<{
      categories: { slug: string; updatedAt: string }[];
      products: { slug: string; updatedAt: string }[];
      doctors: { slug: string; updatedAt: string }[];
    }>("/sitemap");

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.75,
    }));

    const doctorRoutes: MetadataRoute.Sitemap = doctors.map((d) => ({
      url: `${base}/doctors/${d.slug}`,
      lastModified: d.updatedAt ? new Date(d.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [
      ...staticRoutes,
      ...categoryRoutes,
      ...productRoutes,
      ...doctorRoutes,
    ];
  } catch {
    return staticRoutes;
  }
}
