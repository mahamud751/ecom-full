import { apiServer } from "@/lib/api-client";
import {
  ProductCard,
  type ProductCardData,
} from "@/components/product/ProductCard";
import { premiumImg } from "@/lib/nav-data";
import { StoreChrome } from "@/components/catalog/StoreChrome";
import {
  StoreEmptyState,
  StoreShowing,
} from "@/components/catalog/StoreGridLabels";
import { CatalogPager } from "@/components/catalog/Pager";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    flash?: string;
    sort?: string;
    page?: string;
    category?: string;
    brand?: string;
    min?: string;
    max?: string;
  }>;
};

export const metadata = {
  title: "Store — All Products",
  description:
    "Shop medicines, beauty, skincare, supplements & healthcare products online.",
};

export default async function StorePage({ searchParams }: Props) {
  const params = await searchParams;

  const q = new URLSearchParams();
  (
    [
      ["flash", params.flash],
      ["sort", params.sort],
      ["page", params.page],
      ["category", params.category],
      ["brand", params.brand],
      ["min", params.min],
      ["max", params.max],
    ] as const
  ).forEach(([k, v]) => {
    if (v) q.set(k, v);
  });

  const data = await apiServer<{
    products: ProductCardData[];
    total: number;
    page: number;
    totalPages: number;
    categories: { id: string; name: string; slug: string }[];
    brands: { id: string; name: string; slug: string }[];
  }>(`/products${q.toString() ? `?${q.toString()}` : ""}`);

  const { products, total, totalPages, categories, brands } = data;
  const page = data.page;

  function buildHref(overrides: Record<string, string | undefined>) {
    const q = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      flash: params.flash,
      sort: params.sort,
      category: params.category,
      brand: params.brand,
      min: params.min,
      max: params.max,
      page: undefined,
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== undefined && v !== "") q.set(k, v);
    });
    const s = q.toString();
    return s ? `/store?${s}` : "/store";
  }

  const activeFilters =
    !!params.category ||
    !!params.brand ||
    !!params.flash ||
    !!params.min ||
    !!params.max;

  return (
    <StoreChrome
      total={total}
      heroImage={premiumImg.heroStore}
      params={params}
      categories={categories}
      brands={brands}
      activeFilters={activeFilters}
    >
      <StoreShowing shown={products.length} total={total} />

      {products.length === 0 ? (
        <StoreEmptyState />
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
    </StoreChrome>
  );
}
