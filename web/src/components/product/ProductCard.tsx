"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Check, Plus, Rocket, Bell } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { WishlistButton } from "@/components/product/WishlistButton";
import { NotifyButton } from "@/components/product/NotifyButton";
import { discountPercent, cn, isLocalMedia } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n";
import { analytics } from "@/lib/analytics";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  comparePrice?: number | null;
  rating?: number;
  reviewCount?: number;
  expressDelivery?: boolean;
  unit?: string | null;
  brand?: { name: string } | null;
  stock?: number;
};

type Props = {
  product: ProductCardData;
  /** carousel = fixed width row; grid = fluid store grid */
  variant?: "carousel" | "grid";
};

export function ProductCard({ product, variant = "carousel" }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const { t } = useI18n();
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const off = discountPercent(product.price, product.comparePrice);
  const stock = product.stock ?? 0;
  // Treat missing stock as 0 only if explicitly 0; if undefined from old data, assume available unless stock === 0
  const outOfStock = typeof product.stock === "number" && product.stock <= 0;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) {
      setRequestOpen(true);
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      price: product.price,
      comparePrice: product.comparePrice,
      unit: product.unit,
    });
    setAdded(true);
    toast(t("cart.added"), "cart");
    analytics.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
    setTimeout(() => setAdded(false), 900);
  }

  const src = imgError ? "" : product.image;

  return (
    <div
      className={cn(
        "relative group opacity-100",
        variant === "carousel" ? "product-card-wrap" : "w-full min-w-0"
      )}
    >
      <div
        className={cn(
          "product-card h-full",
          outOfStock && "ring-1 ring-red-100"
        )}
      >
        <Link href={`/products/${product.slug}`} className="block">
          <div className="product-img-box relative">
            {off > 0 && !outOfStock && (
              <span className="badge-off">
                {off}%
                <br />
                {t("product.off")}
              </span>
            )}
            {outOfStock && (
              <span className="absolute left-2 top-2 z-10 rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                {t("product.outOfStock")}
              </span>
            )}
            <WishlistButton
              item={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                image: product.image,
                price: product.price,
                comparePrice: product.comparePrice,
                brand: product.brand?.name,
              }}
              size="sm"
              className="absolute right-2 top-2 z-10"
            />
            {src ? (
              <Image
                src={src}
                alt={product.name}
                width={480}
                height={480}
                quality={90}
                unoptimized={isLocalMedia(src)}
                onError={() => setImgError(true)}
                className={cn(
                  "h-full w-full object-contain p-3 transition-transform duration-300 ease-out group-hover:scale-105",
                  outOfStock && "opacity-50 grayscale"
                )}
                sizes={
                  variant === "grid"
                    ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    : "(max-width: 768px) 50vw, 220px"
                }
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--ivory)] text-xs font-semibold text-[var(--ink-muted)]">
                No photo
              </div>
            )}
            {outOfStock && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-red-600/90 to-transparent px-2 pb-2 pt-8 text-center">
                <span className="text-[10px] font-bold text-white">
                  Stock 0 · Request alert
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2">
          <div className="mb-1 flex h-4 items-center gap-1 text-[10px] font-bold uppercase tracking-wide">
            {outOfStock ? (
              <span className="text-red-600">Unavailable</span>
            ) : product.expressDelivery !== false ? (
              <span className="flex items-center gap-1 text-[var(--forest)]">
                <Rocket className="h-3 w-3" />
                12-24 HOURS
              </span>
            ) : null}
          </div>

          <p className="mb-0.5 h-4 truncate text-[10px] font-medium uppercase tracking-wide text-[var(--ink-muted)]">
            {product.brand?.name || "\u00a0"}
          </p>

          <Link href={`/products/${product.slug}`}>
            <h3 className="mb-1.5 line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-snug text-[var(--ink)] hover:text-[var(--forest)]">
              {product.name}
            </h3>
          </Link>

          <div className="mb-2 flex h-4 items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < Math.round(product.rating ?? 4.5)
                    ? "fill-[var(--gold)] text-[var(--gold)]"
                    : "fill-gray-200 text-gray-200"
                )}
              />
            ))}
            <span className="ml-1 text-[11px] text-[var(--ink-muted)]">
              ({product.reviewCount ?? 0})
            </span>
          </div>

          <div className="mt-auto flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="h-4 text-[11px] font-medium text-[var(--ink-muted)] line-through">
                {product.comparePrice && product.comparePrice > product.price
                  ? `৳${
                      product.comparePrice % 1 === 0
                        ? product.comparePrice
                        : product.comparePrice.toFixed(2)
                    }`
                  : "\u00a0"}
              </p>
              <p className="text-sm font-bold leading-tight text-[var(--ink)]">
                ৳
                {product.price % 1 === 0
                  ? product.price
                  : product.price.toFixed(2)}
              </p>
            </div>

            {outOfStock ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRequestOpen(true);
                }}
                className="btn-add is-request"
              >
                <Bell className="h-3.5 w-3.5" />
                Request
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className={cn("btn-add", added && "is-added")}
              >
                {added ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> OK
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" /> ADD
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden NotifyButton — opens when Request clicked */}
      {outOfStock && requestOpen && (
        <CardStockRequest
          product={product}
          stock={stock}
          onClose={() => setRequestOpen(false)}
        />
      )}
    </div>
  );
}

/** Opens notify form for card-level request */
function CardStockRequest({
  product,
  stock,
  onClose,
}: {
  product: ProductCardData;
  stock: number;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-[var(--ivory)]">
            <Image
              src={product.image}
              alt=""
              fill
              className="object-contain p-1"
              sizes="56px"
              unoptimized={isLocalMedia(product.image)}
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-red-600">
              Stock: 0 · Out of stock
            </p>
            <p className="line-clamp-2 text-sm font-bold">{product.name}</p>
          </div>
        </div>
        <p className="mb-3 text-xs text-[var(--ink-muted)]">
          Request a back-in-stock alert. We&apos;ll notify you when this product
          is available again.
        </p>
        <NotifyButton
          productId={product.id}
          productName={product.name}
          productSlug={product.slug}
          productImage={product.image}
          price={product.price}
          stock={stock}
          mode="STOCK"
          className="w-full"
          autoOpen
          onDone={onClose}
        />
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full py-2 text-xs font-semibold text-[var(--ink-muted)]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
