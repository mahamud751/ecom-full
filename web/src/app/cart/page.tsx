"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCartStore();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted">
        {t("cart.loading")}
      </div>
    );
  }

  const total = subtotal();
  const delivery = total >= 999 ? 0 : total > 0 ? 60 : 0;
  const grand = total + delivery;
  const count = items.reduce((s, i) => s + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-brand-light">
          <ShoppingBag className="h-12 w-12 text-brand" />
        </div>
        <h1 className="text-2xl font-bold">{t("cart.empty")}</h1>
        <p className="mt-2 text-muted">{t("cart.emptyDiscover")}</p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-8 py-3 font-bold text-white shadow-lg shadow-brand/30 hover:bg-brand-dark"
        >
          {t("cart.startShopping")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">
        {t("cart.pageTitle")}{" "}
        <span className="text-lg font-normal text-muted">
          ({count} {t("cart.items")})
        </span>
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm"
            >
              <Link
                href={`/products/${item.slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-soft"
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-contain p-1"
                  sizes="96px"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <Link
                    href={`/products/${item.slug}`}
                    className="line-clamp-2 font-semibold hover:text-brand"
                  >
                    {item.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-discount"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 font-bold text-brand-deeper">
                  {formatPrice(item.price)}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      type="button"
                      className="p-2 hover:text-brand"
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="p-2 hover:text-brand"
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-border bg-white p-6 shadow-sm lg:sticky lg:top-36">
          <h2 className="mb-4 text-lg font-bold">{t("cart.orderSummary")}</h2>
          <div className="space-y-2 text-sm">
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
            <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
              <span>{t("cart.total")}</span>
              <span className="text-brand-deeper">{formatPrice(grand)}</span>
            </div>
          </div>
          <Link
            href="/checkout"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
          >
            {t("cart.proceed")} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/products"
            className="mt-3 block text-center text-sm font-medium text-brand hover:underline"
          >
            {t("cart.continue")}
          </Link>
        </div>
      </div>
    </div>
  );
}
