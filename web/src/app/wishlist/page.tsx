"use client";

import { apiFetch } from "@/lib/api-client";
import Link from "next/link";
import { CatalogImage } from "@/components/product/CatalogImage";
import { useCallback, useEffect, useState } from "react";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Bell,
  Share2,
  RefreshCw,
  PackageX,
} from "lucide-react";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useCartStore } from "@/lib/cart-store";
import { useNotifyStore } from "@/lib/notify-store";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotifyButton } from "@/components/product/NotifyButton";
import { toast } from "@/components/ui/Toast";
import { formatPrice, cn } from "@/lib/utils";

type LiveProduct = {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  isActive: boolean;
  brand: string | null;
  inStock: boolean;
};

export default function WishlistPage() {
  const { items, remove, clear } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const notifies = useNotifyStore((s) => s.items);
  const [mounted, setMounted] = useState(false);
  const [live, setLive] = useState<Record<string, LiveProduct>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => setMounted(true), []);

  const refresh = useCallback(async () => {
    if (!items.length) {
      setLive({});
      return;
    }
    setRefreshing(true);
    try {
      const res = await apiFetch("/wishlist/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: items.map((i) => i.id) }),
      });
      const data = await res.json();
      const map: Record<string, LiveProduct> = {};
      for (const p of data.products || []) map[p.id] = p;
      setLive(map);
    } catch {
      /* offline fallback to cached wishlist prices */
    } finally {
      setRefreshing(false);
    }
  }, [items]);

  useEffect(() => {
    if (mounted) void refresh();
  }, [mounted, refresh]);

  function addAllToCart() {
    let n = 0;
    for (const item of items) {
      const p = live[item.id];
      if (p && !p.inStock) continue;
      addItem({
        id: item.id,
        name: item.name,
        slug: item.slug,
        image: item.image,
        price: p?.price ?? item.price,
        comparePrice: p?.comparePrice ?? item.comparePrice,
      });
      n++;
    }
    toast(
      n ? `Added ${n} item${n > 1 ? "s" : ""} to cart` : "No in-stock items",
      n ? "cart" : "info"
    );
  }

  async function shareWishlist() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/wishlist`
        : "/wishlist";
    const text = `My Ahona wishlist (${items.length} items):\n${items
      .slice(0, 5)
      .map((i) => `• ${i.name}`)
      .join("\n")}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Ahona Wishlist", text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast("Wishlist copied to clipboard", "success");
      }
    } catch {
      /* user cancelled */
    }
  }

  if (!mounted) {
    return (
      <div className="container-main py-16 text-center text-[var(--ink-muted)]">
        Loading wishlist…
      </div>
    );
  }

  const readyNotifies = notifies.filter((n) => n.status === "READY");
  const activeNotifies = notifies.filter((n) => n.status === "ACTIVE");

  return (
    <div className="container-main pb-20 pt-6 lg:pb-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
            Wishlist
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {items.length} saved · live stock & price · notify alerts
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-2 text-xs font-bold"
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
                />
                Refresh
              </button>
              <button
                type="button"
                onClick={shareWishlist}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-2 text-xs font-bold"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              <button
                type="button"
                onClick={addAllToCart}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--forest)] px-3 py-2 text-xs font-bold text-white"
              >
                <ShoppingCart className="h-3.5 w-3.5" /> Add all to cart
              </button>
              <button
                type="button"
                onClick={() => {
                  clear();
                  toast("Wishlist cleared", "info");
                }}
                className="text-xs font-semibold text-[var(--ink-muted)] hover:text-red-500"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      </div>

      {/* Active product alerts */}
      {(activeNotifies.length > 0 || readyNotifies.length > 0) && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <Bell className="h-4 w-4" /> Product alerts
            </h2>
            <Link
              href="/notifications"
              className="text-xs font-semibold text-[var(--forest)]"
            >
              Manage all →
            </Link>
          </div>
          {readyNotifies.length > 0 && (
            <p className="mb-2 text-xs font-semibold text-emerald-700">
              {readyNotifies.length} alert(s) ready — product available or price
              dropped
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {activeNotifies.slice(0, 6).map((n) => (
              <span
                key={n.id}
                className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold ring-1 ring-amber-200"
              >
                {n.type === "STOCK" ? "Stock" : "Price"} · {n.productName.slice(0, 28)}
                {n.productName.length > 28 ? "…" : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it. Set notify alerts for out-of-stock items."
          actionHref="/store"
          actionLabel="Browse store"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const p = live[item.id];
            const price = p?.price ?? item.price;
            const compare = p?.comparePrice ?? item.comparePrice;
            const inStock = p ? p.inStock : true;
            const priceDrop =
              p && item.price > 0 && p.price < item.price
                ? item.price - p.price
                : 0;

            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-white p-3 shadow-sm sm:flex-row"
              >
                <Link
                  href={`/products/${item.slug}`}
                  className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-[var(--ivory)] sm:mx-0 sm:h-24 sm:w-24"
                >
                  <CatalogImage
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-1"
                    sizes="112px"
                  />
                  {!inStock && (
                    <span className="absolute inset-x-0 bottom-0 bg-red-600/90 py-0.5 text-center text-[9px] font-bold text-white">
                      Out of stock
                    </span>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  {(item.brand || p?.brand) && (
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                      {p?.brand || item.brand}
                    </p>
                  )}
                  <Link
                    href={`/products/${item.slug}`}
                    className="line-clamp-2 text-sm font-bold hover:text-[var(--forest)]"
                  >
                    {p?.name || item.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[var(--ink)]">
                      {formatPrice(price)}
                    </span>
                    {compare && compare > price && (
                      <span className="text-xs text-[var(--ink-muted)] line-through">
                        {formatPrice(compare)}
                      </span>
                    )}
                    {priceDrop > 0 && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        ↓ ৳{priceDrop} drop
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">
                    {p
                      ? inStock
                        ? `In stock (${p.stock})`
                        : "Out of stock"
                      : "Tap refresh for live stock"}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {inStock ? (
                      <button
                        type="button"
                        onClick={() => {
                          addItem({
                            id: item.id,
                            name: p?.name || item.name,
                            slug: item.slug,
                            image: item.image,
                            price,
                            comparePrice: compare,
                          });
                          toast("Added to cart", "cart");
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-[var(--forest-deep)] py-2 text-xs font-bold text-white min-w-[100px]"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" /> Add
                      </button>
                    ) : (
                      <NotifyButton
                        productId={item.id}
                        productName={item.name}
                        productSlug={item.slug}
                        productImage={item.image}
                        price={price}
                        stock={0}
                        mode="STOCK"
                        compact
                        className="flex-1"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        remove(item.id);
                        toast("Removed from wishlist", "wishlist");
                      }}
                      className="rounded-full border border-[var(--line)] p-2 text-[var(--ink-muted)] hover:border-red-200 hover:text-red-500"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-dashed border-[var(--line)] bg-white p-5 text-center">
        <PackageX className="mx-auto mb-2 h-8 w-8 text-[var(--ink-muted)]" />
        <p className="text-sm font-semibold">Out of stock items?</p>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          Use <strong>Notify when available</strong> on the product or wishlist
          card. Manage alerts on{" "}
          <Link href="/notifications" className="font-bold text-[var(--forest)]">
            My alerts
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
