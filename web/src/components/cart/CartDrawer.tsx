"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    subtotal,
  } = useCartStore();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const total = subtotal();
  const delivery = total >= 999 ? 0 : 60;
  const grand = total + delivery;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 animate-fade-in bg-black/45 backdrop-blur-sm"
        onClick={closeCart}
      />
      <aside className="animate-slide-in absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-brand-soft px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-bold">{t("cart.title")}</h2>
            <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full p-2 hover:bg-white"
            aria-label={t("cart.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-light">
              <ShoppingBag className="h-10 w-10 text-brand" />
            </div>
            <p className="text-lg font-semibold">{t("cart.empty")}</p>
            <p className="text-sm text-muted">{t("cart.emptyHint")}</p>
            <button
              type="button"
              onClick={closeCart}
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {t("cart.continue")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-2xl border border-border bg-brand-soft/40 p-3"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="line-clamp-2 text-sm font-semibold hover:text-brand"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 font-bold text-brand-deeper">
                      {formatPrice(item.price)}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-border bg-white">
                        <button
                          type="button"
                          className="p-1.5 hover:text-brand"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-7 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="p-1.5 hover:text-brand"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-discount"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border bg-white px-5 py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
              <div className="mb-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted">
                  <span>{t("cart.subtotal")}</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>{t("cart.delivery")}</span>
                  <span className={delivery === 0 ? "font-semibold text-brand" : ""}>
                    {delivery === 0 ? t("cart.free") : formatPrice(delivery)}
                  </span>
                </div>
                {total < 999 && (
                  <p className="text-xs text-accent">{t("cart.freeOver")}</p>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>{t("cart.total")}</span>
                  <span className="text-brand-deeper">{formatPrice(grand)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="flex-1 rounded-full border-2 border-brand py-3 text-center text-sm font-semibold text-brand transition hover:bg-brand-light"
                >
                  {t("header.cart")}
                </Link>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex-1 rounded-full bg-brand py-3 text-center text-sm font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
                >
                  {t("cart.checkout")}
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
