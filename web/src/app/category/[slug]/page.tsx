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

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

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

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  let data: CategoryPayload;
  try {
    data = await apiServer<CategoryPayload>(
      `/categories/${encodeURIComponent(slug)}`,
    );
  } catch (e) {
    if (e instanceof ApiClientError && e.status === 404) notFound();
    throw e;
  }

  const { category, products } = data;

  return (
    <div className="pb-12">
      <CategoryPageHeader
        slug={category.slug}
        name={category.name}
        color={category.color}
        image={category.image}
        productCount={products.length}
      />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {products.length === 0 ? (
          <CategoryEmpty />
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} variant="grid" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
