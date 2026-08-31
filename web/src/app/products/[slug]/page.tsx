import { apiServer, ApiClientError } from "@/lib/api-client";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Rocket,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { discountPercent, formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { ProductSection } from "@/components/product/ProductSection";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductReviews } from "@/components/product/ProductReviews";
import type { ProductCardData } from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

type ProductDetail = {
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
    images: string[];
    price: number;
    comparePrice: number | null;
    rating: number;
    reviewCount: number;
    expressDelivery: boolean;
    stock: number;
    unit: string | null;
    sku: string | null;
    shortDesc: string | null;
    description: string;
    brand: { name: string } | null;
    category: { slug: string; name: string };
  };
  related: ProductCardData[];
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const { product } = await apiServer<ProductDetail>(
      `/products/${encodeURIComponent(slug)}`,
    );
    return {
      title: product.name,
      description: product.shortDesc || product.description.slice(0, 160),
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  let product: ProductDetail["product"];
  let related: ProductDetail["related"];
  try {
    const data = await apiServer<ProductDetail>(
      `/products/${encodeURIComponent(slug)}`,
    );
    product = data.product;
    related = data.related;
  } catch (e) {
    if (e instanceof ApiClientError && e.status === 404) notFound();
    throw e;
  }

  const off = discountPercent(product.price, product.comparePrice);
  const gallery =
    product.images?.length > 0
      ? product.images
      : [product.image].filter(Boolean);

  return (
    <div className="pb-12">
      <div className="container-main py-6">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-1.5 overflow-x-auto rounded-full border border-[var(--line)] bg-white/70 px-2 py-1.5 text-xs shadow-sm no-scrollbar sm:gap-2 sm:px-3 sm:text-sm"
        >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-medium text-[var(--forest)] transition hover:bg-[var(--forest)]/10 sm:px-3"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]"
              aria-hidden="true"
            />
            All
          </Link>
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 text-[var(--ink-muted)]"
            aria-hidden="true"
          />
          <Link
            href="/store"
            className="shrink-0 rounded-full px-2.5 py-1 font-medium text-[var(--forest)] transition hover:bg-[var(--forest)]/10 sm:px-3"
          >
            Store
          </Link>
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 text-[var(--ink-muted)]"
            aria-hidden="true"
          />
          <Link
            href={`/category/${product.category.slug}`}
            className="shrink-0 rounded-full bg-[var(--forest)] px-3 py-1 font-semibold text-white shadow-sm transition hover:bg-[var(--forest-deep)] sm:px-3.5"
          >
            {product.category.name}
          </Link>
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 text-[var(--ink-muted)]"
            aria-hidden="true"
          />
          <span
            aria-current="page"
            className="truncate text-[11px] font-medium text-[var(--ink-muted)] sm:text-xs"
          >
            {product.name}
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <ProductGallery
            name={product.name}
            images={gallery}
            discount={off || undefined}
          />

          {/* Info */}
          <div>
            {product.brand && (
              <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-brand">
                {product.brand.name}
              </p>
            )}
            <h1 className="text-2xl font-bold leading-snug sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(product.rating)
                        ? "fill-gold text-gold"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
                <span className="ml-1 text-sm font-medium">
                  {product.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-muted">
                ({product.reviewCount} reviews)
              </span>
              {product.expressDelivery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand">
                  <Rocket className="h-3 w-3" /> 12–24 Hours
                </span>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-brand-soft/50 p-5">
              <div className="flex flex-wrap items-end gap-3">
                <span className="text-3xl font-black text-brand-deeper">
                  {formatPrice(product.price)}
                </span>
                {product.comparePrice &&
                  product.comparePrice > product.price && (
                    <>
                      <span className="text-lg text-muted line-through">
                        {formatPrice(product.comparePrice)}
                      </span>
                      <span className="rounded-lg bg-discount/10 px-2 py-0.5 text-sm font-bold text-discount">
                        Save {formatPrice(product.comparePrice - product.price)}
                      </span>
                    </>
                  )}
              </div>
              <p className="mt-2 text-sm text-muted">
                Inclusive of all taxes ·{" "}
                {product.stock > 0 ? (
                  <span className="font-semibold text-brand">
                    In stock ({product.stock})
                  </span>
                ) : (
                  <span className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold uppercase text-white">
                    Out of stock · Stock 0
                  </span>
                )}
              </p>
            </div>

            {product.shortDesc && (
              <p className="mt-4 text-muted">{product.shortDesc}</p>
            )}

            <div className="mt-6">
              <AddToCartButton
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  image: product.image,
                  price: product.price,
                  comparePrice: product.comparePrice,
                  unit: product.unit,
                  brand: product.brand?.name,
                  stock: product.stock,
                }}
              />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: "Express Delivery" },
                { icon: ShieldCheck, label: "100% Genuine" },
                { icon: RotateCcw, label: "Easy Returns" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center rounded-xl border border-border bg-white p-3 text-center"
                >
                  <item.icon className="mb-1 h-5 w-5 text-brand" />
                  <span className="text-[11px] font-medium leading-tight">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-10 rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-4 text-xl font-bold">Product Details</h2>
          <p className="whitespace-pre-wrap leading-relaxed text-muted">
            {product.description}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-brand-soft px-4 py-3 text-sm">
              <span className="text-muted">Category: </span>
              <Link
                href={`/category/${product.category.slug}`}
                className="font-semibold text-brand hover:underline"
              >
                {product.category.name}
              </Link>
            </div>
            {product.brand && (
              <div className="rounded-xl bg-brand-soft px-4 py-3 text-sm">
                <span className="text-muted">Brand: </span>
                <span className="font-semibold">{product.brand.name}</span>
              </div>
            )}
            {product.sku && (
              <div className="rounded-xl bg-brand-soft px-4 py-3 text-sm">
                <span className="text-muted">SKU: </span>
                <span className="font-semibold">{product.sku}</span>
              </div>
            )}
            <div className="rounded-xl bg-brand-soft px-4 py-3 text-sm">
              <span className="text-muted">Unit: </span>
              <span className="font-semibold">{product.unit || "pcs"}</span>
            </div>
          </div>
        </div>

        <ProductReviews
          productId={product.id}
          productName={product.name}
          initialRating={product.rating}
          initialCount={product.reviewCount}
        />
      </div>

      <ProductSection
        title="Related Products"
        products={related}
        seeAllHref={`/category/${product.category.slug}`}
      />
    </div>
  );
}
