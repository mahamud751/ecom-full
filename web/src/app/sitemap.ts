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
    // Product URLs live in the split /products/sitemap/[id].xml files.
    const { categories, doctors, labTests, labPackages } = await apiServer<{
      categories: { slug: string; updatedAt: string }[];
      doctors: { slug: string; updatedAt: string }[];
      labTests?: { slug: string; updatedAt: string }[];
      labPackages?: { slug: string; updatedAt: string }[];
    }>("/sitemap?products=0");

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const doctorRoutes: MetadataRoute.Sitemap = doctors.map((d) => ({
      url: `${base}/doctors/${d.slug}`,
      lastModified: d.updatedAt ? new Date(d.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const labRoutes: MetadataRoute.Sitemap = [
      ...(labTests || []).map((t) => ({
        url: `${base}/lab-test/${t.slug}`,
        lastModified: t.updatedAt ? new Date(t.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...(labPackages || []).map((p) => ({
        url: `${base}/lab-test/package/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];

    return [
      ...staticRoutes,
      ...categoryRoutes,
      ...doctorRoutes,
      ...labRoutes,
    ];
  } catch {
    return staticRoutes;
  }
}
