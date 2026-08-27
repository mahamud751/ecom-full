"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Menu,
  X,
  Heart,
  Phone,
  User,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { MainTabs } from "./MainTabs";
import { AdvancedSearchBar } from "@/components/search/AdvancedSearchBar";
import { LanguageToggle, useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  AccountMenu,
  AccountMobileButton,
} from "@/components/auth/AccountMenu";
import { useAuthStore } from "@/lib/auth-store";

export function Header() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { openCart, totalItems } = useCartStore();
  const wishCount = useWishlistStore((s) => s.count);
  const setAuthOpen = useAuthStore((s) => s.setAuthOpen);
  const user = useAuthStore((s) => s.user);
  const count = mounted ? totalItems() : 0;
  const wishes = mounted ? wishCount() : 0;

  useEffect(() => setMounted(true), []);
  useEffect(() => setMobileOpen(false), [pathname]);

  if (pathname.startsWith("/admin")) return null;

  const mobileLinks: { key: MessageKey; href: string; emoji?: string }[] = [
    { key: "nav.store", href: "/store", emoji: "🛒" },
    { key: "nav.labTests", href: "/lab-test", emoji: "🧪" },
    { key: "nav.doctors", href: "/doctors", emoji: "👨‍⚕️" },
    { key: "nav.flashSale", href: "/store?flash=1", emoji: "⚡" },
    { key: "nav.medicine", href: "/category/medicine", emoji: "💊" },
    { key: "nav.beauty", href: "/category/beauty", emoji: "✨" },
    { key: "nav.wishlist", href: "/wishlist", emoji: "❤️" },
    { key: "nav.trackOrder", href: "/track-order", emoji: "📦" },
    { key: "nav.alerts", href: "/notifications", emoji: "🔔" },
  ];

  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="hidden bg-[var(--forest-deep)] text-[11px] text-white/75 sm:block">
        <div className="container-main flex items-center justify-between gap-3 py-1">
          <span className="truncate">{t("top.genuine")}</span>
          <span className="flex shrink-0 items-center gap-3">
            <a href="tel:16778" className="hover:text-white">
              {t("top.hotline")}
            </a>
            <LanguageToggle className="border-white/20 bg-white/10 [&_button]:text-white/80 [&_button[aria-pressed=true]]:bg-[var(--gold)] [&_button[aria-pressed=true]]:text-[var(--forest-deep)]" />
          </span>
        </div>
      </div>

      <div className="border-b border-[var(--line)]/80 bg-white/95 shadow-[0_4px_24px_-12px_rgba(12,42,40,0.12)] backdrop-blur-xl">
        <div className="container-main flex items-center gap-2 py-2 sm:hidden">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--ivory)] text-[var(--ink)] active:scale-95"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={t("header.menu")}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <BrandLogo variant="header" className="min-w-0 flex-1 gap-2" />

          {user ? (
            <Link
              href="/account"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--ivory)] text-[var(--ink)] active:scale-95"
              aria-label={t("header.account")}
            >
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setAuthOpen(true, "login")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--ivory)] text-[var(--ink)] active:scale-95"
              aria-label={t("header.signIn")}
            >
              <User className="h-5 w-5" />
            </button>
          )}

          <button
            type="button"
            onClick={openCart}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--forest-deep)] text-white shadow-md shadow-[var(--forest)]/25 active:scale-95"
            aria-label={t("header.cart")}
          >
            <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[9px] font-bold text-[var(--forest-deep)]">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        </div>

        <div className="container-main pb-2 sm:hidden">
          <AdvancedSearchBar size="header" />
        </div>

        <div className="container-main hidden flex-wrap items-center justify-between gap-3 py-2.5 sm:flex lg:flex-nowrap lg:gap-4">
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              className="rounded-xl p-1.5 text-[var(--ink)] hover:bg-[var(--ivory)] lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={t("header.menu")}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <BrandLogo variant="header" />
          </div>

          <div className="order-3 w-full min-w-0 lg:order-none lg:flex-1">
            <AdvancedSearchBar size="header" />
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <Link
              href="/wishlist"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-[var(--ivory)]"
              title={t("header.wishlist")}
            >
              <Heart className="h-5 w-5 text-[var(--ink)]" strokeWidth={1.5} />
              {wishes > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                  {wishes}
                </span>
              )}
            </Link>
            <AccountMenu />
            <button
              type="button"
              onClick={openCart}
              className="relative ml-1 flex items-center gap-2 rounded-2xl bg-[var(--forest-deep)] px-3.5 py-2 text-white shadow-lg shadow-[var(--forest)]/25 transition hover:bg-[var(--forest)]"
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
              <span className="hidden text-sm font-semibold md:inline">
                {t("header.cart")}
              </span>
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[10px] font-bold text-[var(--forest-deep)]">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <MainTabs />

      {mobileOpen && (
        <div className="animate-fade-in max-h-[75vh] overflow-y-auto border-b border-[var(--line)] bg-white shadow-2xl lg:hidden">
          <div className="container-main space-y-4 py-4">
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--forest-deep)] to-[var(--forest)] p-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--gold)]">
                Ahona
              </p>
              <p className="mt-1 font-serif text-lg font-semibold">
                {user ? `Hi, ${user.name.split(" ")[0]}` : t("header.signIn")}
              </p>
              <p className="mt-0.5 text-xs text-white/65">
                {user ? user.email : t("top.genuine")}
              </p>
              <div className="mt-3">
                <AccountMobileButton />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--ivory)] px-3.5 py-2.5">
              <span className="text-sm font-semibold text-[var(--ink)]">
                {t("header.language")}
              </span>
              <LanguageToggle />
            </div>

            <nav className="grid grid-cols-2 gap-2.5">
              {mobileLinks.map((item) => (
                <Link
                  key={item.href + item.key}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--ivory)]/80 px-3.5 py-3.5 text-sm font-semibold text-[var(--ink)] shadow-sm transition active:scale-[0.98]"
                >
                  <span className="text-base">{item.emoji}</span>
                  {t(item.key)}
                </Link>
              ))}
            </nav>

            <a
              href="tel:16778"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--gold)] py-3.5 text-sm font-bold text-[var(--forest-deep)]"
            >
              <Phone className="h-4 w-4" />
              {t("top.hotline")}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
