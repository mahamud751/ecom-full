"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Pill,
  Microscope,
  Video,
  ShoppingCart,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

const tabs: {
  href: string;
  labelKey: MessageKey;
  icon: typeof House;
  match: (p: string) => boolean;
}[] = [
  { href: "/", labelKey: "nav.home", icon: House, match: (p) => p === "/" },
  {
    href: "/store",
    labelKey: "nav.store",
    icon: Pill,
    match: (p) =>
      p.startsWith("/store") ||
      p.startsWith("/products") ||
      p.startsWith("/category") ||
      p.startsWith("/search"),
  },
  {
    href: "/lab-test",
    labelKey: "nav.lab",
    icon: Microscope,
    match: (p) => p.startsWith("/lab-test"),
  },
  {
    href: "/doctors",
    labelKey: "nav.doctor",
    icon: Video,
    match: (p) =>
      p.startsWith("/doctors") ||
      p.startsWith("/consultations") ||
      p.startsWith("/my-consultations") ||
      p.startsWith("/prescriptions") ||
      p.startsWith("/doctor-portal"),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { openCart, totalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? totalItems() : 0;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/order-success") ||
    pathname.startsWith("/consultations/")
  ) {
    return null;
  }

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 px-3 pb-2 lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-between rounded-[1.35rem] border border-[var(--line)]/80 bg-white/95 px-1.5 py-1.5 shadow-[0_-8px_40px_rgba(12,42,40,0.12)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[10px] font-semibold transition active:scale-95",
                active
                  ? "bg-[var(--gold-soft)] text-[var(--forest-deep)]"
                  : "text-[var(--ink-muted)]"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
              <span className="leading-none">{t(tab.labelKey)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={openCart}
          className="relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[10px] font-semibold text-[var(--ink-muted)] active:scale-95"
        >
          <span className="relative">
            <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gold)] px-0.5 text-[9px] font-bold text-[var(--forest-deep)]">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </span>
          <span className="leading-none">{t("header.cart")}</span>
        </button>
      </div>
    </nav>
  );
}
