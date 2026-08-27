"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import Image from "next/image";
import Link from "next/link";
import { Bell, Trash2, ShoppingCart } from "lucide-react";
import { useNotifyStore } from "@/lib/notify-store";
import { useCartStore } from "@/lib/cart-store";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";
import { formatPrice, cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { items, remove, clear } = useNotifyStore();
  const addItem = useCartStore((s) => s.addItem);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="container-main py-16 text-center text-[var(--ink-muted)]">
        Loading alerts…
      </div>
    );
  }

  const active = items.filter((i) => i.status !== "CANCELLED");

  return (
    <div className="container-main pb-20 pt-6 lg:pb-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
            Product alerts
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Back-in-stock & price-drop notifications
          </p>
        </div>
        {active.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clear();
              toast("All alerts cleared", "info");
            }}
            className="text-xs font-semibold text-[var(--ink-muted)] hover:text-red-500"
          >
            Clear all
          </button>
        )}
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No product alerts"
          description="When a product is out of stock, tap Notify when available. Or set a price-drop alert on any product page."
          actionHref="/store"
          actionLabel="Browse store"
        />
      ) : (
        <div className="space-y-3">
          {active.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center",
                n.status === "READY"
                  ? "border-emerald-300 bg-emerald-50/40"
                  : "border-[var(--line)]"
              )}
            >
              <Link
                href={`/products/${n.productSlug}`}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--ivory)]"
              >
                <Image
                  src={n.productImage}
                  alt=""
                  fill
                  className="object-contain p-1"
                  sizes="64px"
                  unoptimized={n.productImage.startsWith("/uploads/")}
                />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      n.type === "STOCK"
                        ? "bg-sky-100 text-sky-800"
                        : "bg-amber-100 text-amber-800"
                    )}
                  >
                    {n.type === "STOCK" ? "Back in stock" : "Price drop"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      n.status === "READY"
                        ? "bg-emerald-100 text-emerald-800"
                        : n.status === "ACTIVE"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-gray-50 text-gray-500"
                    )}
                  >
                    {n.status}
                  </span>
                </div>
                <Link
                  href={`/products/${n.productSlug}`}
                  className="mt-1 block font-bold hover:text-[var(--forest)]"
                >
                  {n.productName}
                </Link>
                <p className="text-xs text-[var(--ink-muted)]">
                  Contact: {n.contact}
                  {n.type === "PRICE" && n.targetPrice
                    ? ` · target ≤ ${formatPrice(n.targetPrice)}`
                    : ""}
                  {n.priceWhenSet
                    ? ` · was ${formatPrice(n.priceWhenSet)}`
                    : ""}
                </p>
              </div>
              <div className="flex gap-2">
                {n.status === "READY" && (
                  <button
                    type="button"
                    onClick={() => {
                      addItem({
                        id: n.productId,
                        name: n.productName,
                        slug: n.productSlug,
                        image: n.productImage,
                        price: n.priceWhenSet || 0,
                      });
                      toast("Added to cart", "cart");
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--forest)] px-3 py-2 text-xs font-bold text-white"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Buy
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await apiFetch(`/notify?id=${n.id}`, { method: "DELETE" });
                    } catch {
                      /* local only */
                    }
                    remove(n.id);
                    toast("Alert removed", "info");
                  }}
                  className="rounded-full border border-[var(--line)] p-2 text-[var(--ink-muted)] hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
