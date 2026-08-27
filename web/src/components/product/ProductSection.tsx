"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "./ProductCard";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

type Props = {
  /** Prefer message key for EN/BN */
  titleKey?: MessageKey;
  /** Fallback raw title (brand campaign names) */
  title?: string;
  subtitle?: string;
  seeAllHref?: string;
  products: ProductCardData[];
};

export function ProductSection({
  titleKey,
  title,
  seeAllHref = "/products",
  products,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  if (!products.length) return null;

  const heading = titleKey ? t(titleKey) : title || "";

  function scroll(dir: "left" | "right") {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -420 : 420, behavior: "smooth" });
  }

  return (
    <section className="home-section container-main">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="section-title">{heading}</h2>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--ink-muted)] hover:border-brand hover:text-brand"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--ink-muted)] hover:border-brand hover:text-brand"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Link href={seeAllHref} className="see-all-link capitalize">
            {t("common.seeAll")}
          </Link>
        </div>
      </div>

      <div ref={trackRef} className="product-track no-scrollbar">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
