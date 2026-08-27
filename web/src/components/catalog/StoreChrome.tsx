"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

type Cat = { id: string; name: string; slug: string };
type Brand = { id: string; name: string; slug: string };

type Params = {
  flash?: string;
  sort?: string;
  category?: string;
  brand?: string;
  min?: string;
  max?: string;
};

type Props = {
  total: number;
  heroImage: string;
  params: Params;
  categories: Cat[];
  brands: Brand[];
  activeFilters: boolean;
  children: React.ReactNode;
};

const PRICE_KEYS: {
  labelKey: MessageKey;
  min: string;
  max: string;
}[] = [
  { labelKey: "store.under200", min: "0", max: "200" },
  { labelKey: "store.range200", min: "200", max: "500" },
  { labelKey: "store.range500", min: "500", max: "1000" },
  { labelKey: "store.range1000", min: "1000", max: "" },
];

function buildHref(
  params: Params,
  overrides: Record<string, string | undefined>
) {
  const q = new URLSearchParams();
  const merged: Record<string, string | undefined> = {
    flash: params.flash,
    sort: params.sort,
    category: params.category,
    brand: params.brand,
    min: params.min,
    max: params.max,
    page: undefined,
    ...overrides,
  };
  Object.entries(merged).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, v);
  });
  const s = q.toString();
  return s ? `/store?${s}` : "/store";
}

export function StoreChrome({
  total,
  heroImage,
  params,
  categories,
  brands,
  activeFilters,
  children,
}: Props) {
  const { t, cat } = useI18n();
  const href = (o: Record<string, string | undefined>) => buildHref(params, o);

  const sortOpts: { value: string; labelKey: MessageKey }[] = [
    { value: "", labelKey: "store.popular" },
    { value: "newest", labelKey: "store.newest" },
    { value: "price-asc", labelKey: "store.priceAsc" },
    { value: "price-desc", labelKey: "store.priceDesc" },
    { value: "rating", labelKey: "store.topRated" },
  ];

  return (
    <div className="pb-20 lg:pb-16">
      <div className="container-main pt-4 md:pt-5">
        <div className="hub-hero relative min-h-[160px] overflow-hidden rounded-2xl md:min-h-[200px]">
          <Image
            src={heroImage}
            alt={t("store.tag")}
            fill
            priority
            quality={90}
            className="object-cover"
            sizes="1400px"
          />
          <div className="relative z-10 flex min-h-[160px] flex-col justify-end p-5 text-white md:min-h-[200px] md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold)]">
              {t("store.tag")}
            </p>
            <h1 className="font-serif mt-1 text-2xl font-semibold md:text-3xl">
              {t("store.title")}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              {total} {t("store.itemsMeta")}
            </p>
          </div>
        </div>
      </div>

      <div className="container-main py-5 md:py-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
            <Link href="/" className="hover:text-[var(--forest)]">
              {t("nav.all")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-[var(--ink)]">
              {t("nav.store")}
            </span>
            {params.category && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-[var(--ink)]">
                  {cat(params.category, params.category.replace(/-/g, " "))}
                </span>
              </>
            )}
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden items-center gap-1 text-xs text-[var(--ink-muted)] sm:flex">
              <SlidersHorizontal className="h-3.5 w-3.5" /> {t("store.sort")}
            </span>
            {sortOpts.map((opt) => (
              <Link
                key={opt.value || "pop"}
                href={href({ sort: opt.value || undefined, page: "1" })}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  (params.sort || "") === opt.value
                    ? "bg-[var(--forest-deep)] text-white"
                    : "border border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--forest)]"
                }`}
              >
                {t(opt.labelKey)}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
          <aside className="w-full shrink-0 lg:w-[240px]">
            <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm lg:sticky lg:top-[160px]">
              <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
                <h2 className="text-sm font-bold text-[var(--ink)]">
                  {t("store.filters")}
                </h2>
                {activeFilters && (
                  <Link
                    href="/store"
                    className="text-xs font-semibold text-[var(--forest)] hover:underline"
                  >
                    {t("store.clearAll")}
                  </Link>
                )}
              </div>

              <div className="max-h-[70vh] space-y-5 overflow-y-auto p-4">
                <div>
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--gold-deep)]">
                    {t("store.deals")}
                  </h3>
                  <Link
                    href={href({
                      flash: params.flash === "1" ? undefined : "1",
                      page: "1",
                    })}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium ${
                      params.flash === "1"
                        ? "bg-[var(--gold-soft)] text-[var(--gold-deep)]"
                        : "hover:bg-[var(--ivory)]"
                    }`}
                  >
                    ⚡ {t("nav.flashSale")}
                    <span className="text-[10px] opacity-70">Hot</span>
                  </Link>
                </div>

                <div>
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--gold-deep)]">
                    {t("store.category")}
                  </h3>
                  <ul className="space-y-0.5">
                    <li>
                      <Link
                        href={href({ category: undefined, page: "1" })}
                        className={`block rounded-lg px-3 py-1.5 text-sm ${
                          !params.category
                            ? "bg-[var(--forest-deep)] font-semibold text-white"
                            : "hover:bg-[var(--ivory)]"
                        }`}
                      >
                        {t("store.allCategories")}
                      </Link>
                    </li>
                    {categories.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={href({ category: c.slug, page: "1" })}
                          className={`block rounded-lg px-3 py-1.5 text-sm ${
                            params.category === c.slug
                              ? "bg-[var(--brand-soft)] font-semibold text-[var(--forest)]"
                              : "text-[var(--ink)] hover:bg-[var(--ivory)]"
                          }`}
                        >
                          {cat(c.slug, c.name)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--gold-deep)]">
                    {t("store.brand")}
                  </h3>
                  <ul className="space-y-0.5">
                    <li>
                      <Link
                        href={href({ brand: undefined, page: "1" })}
                        className={`block rounded-lg px-3 py-1.5 text-sm ${
                          !params.brand
                            ? "bg-[var(--forest-deep)] font-semibold text-white"
                            : "hover:bg-[var(--ivory)]"
                        }`}
                      >
                        {t("store.allBrands")}
                      </Link>
                    </li>
                    {brands.map((b) => (
                      <li key={b.id}>
                        <Link
                          href={href({ brand: b.slug, page: "1" })}
                          className={`block rounded-lg px-3 py-1.5 text-sm ${
                            params.brand === b.slug
                              ? "bg-[var(--brand-soft)] font-semibold text-[var(--forest)]"
                              : "text-[var(--ink)] hover:bg-[var(--ivory)]"
                          }`}
                        >
                          {b.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--gold-deep)]">
                    {t("store.price")}
                  </h3>
                  <ul className="space-y-0.5">
                    {PRICE_KEYS.map((r) => {
                      const active =
                        params.min === r.min &&
                        (params.max || "") === (r.max || "");
                      return (
                        <li key={r.labelKey}>
                          <Link
                            href={href({
                              min: r.min,
                              max: r.max || undefined,
                              page: "1",
                            })}
                            className={`block rounded-lg px-3 py-1.5 text-sm ${
                              active
                                ? "bg-[var(--brand-soft)] font-semibold text-[var(--forest)]"
                                : "hover:bg-[var(--ivory)]"
                            }`}
                          >
                            {t(r.labelKey)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
