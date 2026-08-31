"use client";

import Link from "next/link";
import { CatalogImage } from "@/components/product/CatalogImage";
import { useI18n } from "@/lib/i18n";

export type CategoryData = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  color: string | null;
};

export function CategoryGrid({ categories }: { categories: CategoryData[] }) {
  const { t, cat } = useI18n();

  return (
    <section className="home-section">
      <div className="container-main mb-3 flex items-end justify-between">
        <h2 className="section-title">
          {t("home.allYouNeed")}
        </h2>
        <Link
          href="/store"
          className="text-xs font-bold text-[var(--forest)] sm:text-sm"
        >
          {t("common.seeAll")}
        </Link>
      </div>

      {/* Mobile: horizontal snap scroll · Desktop: dense grid */}
      <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 pb-1 snap-x snap-mandatory sm:hidden">
        {categories.map((c) => {
          const name = cat(c.slug, c.name);
          return (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group flex w-[72px] shrink-0 snap-start flex-col items-center"
            >
              <div
                className="relative h-[68px] w-[68px] overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 transition active:scale-95"
                style={{ backgroundColor: c.color || "#F5FDFC" }}
              >
                {c.image && (
                  <CatalogImage
                    src={c.image}
                    alt={name}
                    fill
                    quality={85}
                    className="object-cover transition duration-200 group-active:scale-105"
                    sizes="72px"
                  />
                )}
              </div>
              <span className="mt-1.5 line-clamp-2 w-full text-center text-[11px] font-semibold leading-tight text-[var(--ink)]">
                {name}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="container-main hidden grid-cols-4 gap-3 sm:grid md:grid-cols-6 md:gap-4">
        {categories.map((c) => {
          const name = cat(c.slug, c.name);
          return (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="cat-tile group flex w-full flex-col"
            >
              <div
                className="relative aspect-square w-full overflow-hidden rounded-2xl p-3 shadow-sm ring-1 ring-black/5"
                style={{ backgroundColor: c.color || "#F5FDFC" }}
              >
                {c.image && (
                  <CatalogImage
                    src={c.image}
                    alt={name}
                    fill
                    quality={90}
                    className="object-cover transition duration-200 group-hover:scale-105"
                    sizes="(min-width: 1280px) 160px, 140px"
                  />
                )}
              </div>
              <span className="cat-name mt-2 line-clamp-2 text-center text-sm font-medium text-gray-800">
                {name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
