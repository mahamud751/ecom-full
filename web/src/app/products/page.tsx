import { apiServer } from "@/lib/api-client";
import {
  ProductCard,
  type ProductCardData,
} from "@/components/product/ProductCard";
import Link from "next/link";
import { CatalogPager } from "@/components/catalog/Pager";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    section?: string;
    flash?: string;
    sort?: string;
    page?: string;
  }>;
};

export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  if (params.flash) return { title: "Flash Sale" };
  if (params.section) return { title: "Deals" };
  return { title: "All Products" };
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;

  const q = new URLSearchParams();
  if (params.section) q.set("section", params.section);
  if (params.flash) q.set("flash", params.flash);
  if (params.sort) q.set("sort", params.sort);
  if (params.page) q.set("page", params.page);
  q.set("perPage", "20");

  const data = await apiServer<{
    products: ProductCardData[];
    total: number;
    page: number;
    totalPages: number;
    categories: { id: string; name: string; slug: string }[];
  }>(`/products?${q.toString()}`);

  const { products, total, totalPages, categories } = data;
  const page = data.page;
  const title = params.flash
    ? "Flash Sale"
    : params.section
      ? "Special Deals"
      : "All Products";

  const sortOptions = [
    { value: "", label: "Popular" },
    { value: "newest", label: "Newest" },
    { value: "price-asc", label: "Price ↑" },
    { value: "price-desc", label: "Price ↓" },
    { value: "rating", label: "Top Rated" },
  ];

  function buildHref(overrides: Record<string, string | undefined>) {
    const q = new URLSearchParams();
    const merged = {
      section: params.section,
      flash: params.flash,
      sort: params.sort,
      page: undefined as string | undefined,
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    const s = q.toString();
    return s ? `/products?${s}` : "/products";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <nav className="mb-2 text-sm text-muted">
          <Link href="/" className="hover:text-brand">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{title}</span>
        </nav>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-muted">{total} products found</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((opt) => (
              <Link
                key={opt.value || "default"}
                href={buildHref({ sort: opt.value || undefined, page: "1" })}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  (params.sort || "") === opt.value
                    ? "bg-brand text-white"
                    : "bg-white text-foreground border border-border hover:border-brand"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-56">
          <div className="sticky top-36 rounded-2xl border border-border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
              Categories
            </h2>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/products"
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    !params.section && !params.flash
                      ? "bg-brand-light text-brand-deeper"
                      : "hover:bg-brand-soft"
                  }`}
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/products?flash=1"
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    params.flash
                      ? "bg-accent-soft text-accent"
                      : "hover:bg-brand-soft"
                  }`}
                >
                  ⚡ Flash Sale
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/category/${c.slug}`}
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-brand-soft"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {products.length === 0 ? (
            <div className="rounded-2xl border border-border bg-white py-20 text-center">
              <p className="text-lg font-semibold">No products found</p>
              <Link
                href="/products"
                className="mt-4 inline-block text-brand hover:underline"
              >
                Browse all products
              </Link>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} variant="grid" />
              ))}
            </div>
          )}

          <CatalogPager
            page={page}
            totalPages={totalPages}
            hrefFor={(p) => buildHref({ page: String(p) })}
          />
        </div>
      </div>
    </div>
  );
}
