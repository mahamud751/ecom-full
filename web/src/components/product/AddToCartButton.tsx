"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Check, PackageX } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { toast } from "@/components/ui/Toast";
import { NotifyButton } from "@/components/product/NotifyButton";
import { WishlistButton } from "@/components/product/WishlistButton";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { analytics } from "@/lib/analytics";

type ProductInput = {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  comparePrice?: number | null;
  unit?: string | null;
  brand?: string | null;
  stock?: number;
};

export function AddToCartButton({ product }: { product: ProductInput }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { t } = useI18n();
  const stock = product.stock ?? 0;
  const inStock = stock > 0;

  function handleAdd() {
    if (!inStock) return;
    addItem(product, qty);
    setAdded(true);
    toast(t("cart.added"), "cart");
    analytics.addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
    });
    setTimeout(() => setAdded(false), 1500);
  }

  if (!inStock) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <PackageX className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-bold text-red-800">
                {t("product.outOfStock")}
              </p>
              <p className="mt-0.5 text-sm text-red-700/90">
                Current stock: <strong>0</strong>. You can request a restock
                alert — we&apos;ll notify you by phone/email when available.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="mb-3 text-sm font-bold text-amber-900">
            Request this product
          </p>
          <NotifyButton
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            productImage={product.image}
            price={product.price}
            stock={0}
            mode="STOCK"
            autoOpen
            hideTrigger
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <WishlistButton
            item={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              image: product.image,
              price: product.price,
              comparePrice: product.comparePrice,
              brand: product.brand,
            }}
            size="md"
            className="!h-11 !w-11 shrink-0"
          />
          <span className="text-xs text-[var(--ink-muted)]">
            Save to wishlist while you wait
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center rounded-full border-2 border-border bg-white">
          <button
            type="button"
            className="p-3 hover:text-brand"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-10 text-center text-lg font-bold">{qty}</span>
          <button
            type="button"
            className="p-3 hover:text-brand"
            onClick={() => setQty((q) => Math.min(stock, q + 1))}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold uppercase tracking-wide shadow-lg transition sm:flex-none sm:px-10",
            added
              ? "bg-brand-deeper text-white"
              : "bg-brand text-white shadow-brand/30 hover:bg-brand-dark hover:scale-[1.02]"
          )}
        >
          {added ? (
            <>
              <Check className="h-5 w-5" /> {t("cart.added")}
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" /> {t("product.addToCart")}
            </>
          )}
        </button>
        <WishlistButton
          item={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            image: product.image,
            price: product.price,
            comparePrice: product.comparePrice,
            brand: product.brand,
          }}
          size="md"
          className="!h-12 !w-12 shrink-0"
        />
      </div>
      <p className="text-xs text-[var(--ink-muted)]">
        In stock: <strong className="text-[var(--forest)]">{stock}</strong>
      </p>
      <NotifyButton
        productId={product.id}
        productName={product.name}
        productSlug={product.slug}
        productImage={product.image}
        price={product.price}
        stock={stock}
        mode="PRICE"
        compact
        className="w-full sm:w-auto"
      />
    </div>
  );
}
