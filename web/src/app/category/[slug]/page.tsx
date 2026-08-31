import { apiServer, ApiClientError } from "@/lib/api-client";
import { notFound } from "next/navigation";
import {
  ProductCard,
  type ProductCardData,
} from "@/components/product/ProductCard";
import {
  CategoryEmpty,
  CategoryPageHeader,
} from "@/components/catalog/CategoryPageHeader";
import { CatalogPager } from "@/components/catalog/Pager";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
};

type CategoryPayload = {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    color: string | null;
  };
  products: ProductCardData[];
  total: number;
  page: number;
  totalPages: number;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const { category } = await apiServer<CategoryPayload>(
      `/categories/${encodeURIComponent(slug)}`,
    );
    return {
      title: category.name,
      description: category.description || `Shop ${category.name} at Ahona`,
    };
  } catch {
    return { title: "Category" };
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.page) q.set("page", sp.page);
  if (sp.sort) q.set("sort", sp.sort);
  const qs = q.toString();
  let data: CategoryPayload;
  try {
    data = await apiServer<CategoryPayload>(
      `/categories/${encodeURIComponent(slug)}${qs ? `?${qs}` : ""}`,
    );
  } catch (e) {
    if (e instanceof ApiClientError && e.status === 404) notFound();
    throw e;
  }

  const { category, products, total, page, totalPages } = data;

  const hrefFor = (p: number) => {
    const next = new URLSearchParams();
    if (sp.sort) next.set("sort", sp.sort);
    if (p > 1) next.set("page", String(p));
    const s = next.toString();
    return s ? `/category/${category.slug}?${s}` : `/category/${category.slug}`;
  };

  return (
    <div className="pb-12">
      <CategoryPageHeader
        slug={category.slug}
        name={category.name}
        color={category.color}
        image={category.image}
        productCount={total}
      />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {products.length === 0 ? (
          <CategoryEmpty />
        ) : (
          <>
            <div className="product-grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} variant="grid" />
              ))}
            </div>
            <CatalogPager page={page} totalPages={totalPages} hrefFor={hrefFor} />
          </>
        )}
      </div>
    </div>
  );
}
