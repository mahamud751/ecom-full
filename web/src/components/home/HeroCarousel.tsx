"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { TrustBar } from "@/components/layout/TrustBar";

export type BannerData = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
};

function ctaFor(link: string | null): {
  href: string;
  key: MessageKey;
  secondary?: { href: string; key: MessageKey };
} {
  const href = link || "/store";
  if (href.startsWith("/doctors")) {
    return { href, key: "home.ctaDoctor" };
  }
  if (href.startsWith("/lab-test")) {
    return { href, key: "home.ctaLab" };
  }
  if (href.includes("/category/beauty") || href.includes("/category/skincare")) {
    return {
      href,
      key: "home.ctaBeauty",
      secondary: { href: "/store?flash=1", key: "home.flashDeals" },
    };
  }
  if (href.includes("/category/medicine")) {
    return {
      href,
      key: "home.ctaMedicine",
      secondary: { href: "/store?flash=1", key: "home.flashDeals" },
    };
  }
  if (href.includes("flash")) {
    return { href, key: "home.shopNow" };
  }
  return {
    href,
    key: "home.shopNow",
    secondary: { href: "/store?flash=1", key: "home.flashDeals" },
  };
}

export function HeroCarousel({ banners }: { banners: BannerData[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % banners.length),
      5600
    );
    return () => clearInterval(id);
  }, [banners.length, paused]);

  if (!banners.length) return null;

  function prev(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setIndex((i) => (i - 1 + banners.length) % banners.length);
  }
  function next(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setIndex((i) => (i + 1) % banners.length);
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    const startX = touchStartX.current;
    const endX = e.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (startX == null || endX == null) return;
    const deltaX = endX - startX;
    if (Math.abs(deltaX) < 40) return;
    if (deltaX < 0) next();
    else prev();
  }

  return (
    <section className="container-main pt-3 md:pt-4">
      <div className="overflow-hidden bg-white shadow-[0_20px_50px_-28px_rgba(12,42,40,0.38)] ring-1 ring-black/5 sm:rounded-[1.75rem]">
        <div
          className="group relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative aspect-[16/9] min-h-[200px] w-full sm:aspect-[21/8] sm:min-h-[240px] md:min-h-[268px] lg:min-h-[300px] xl:min-h-[328px]">
            {banners.map((banner, i) => {
              const active = i === index;
              const cta = ctaFor(banner.link);
              return (
                <div
                  key={banner.id}
                  className={cn(
                    "absolute inset-0 transition-all duration-700 ease-out",
                    active
                      ? "z-10 scale-100 opacity-100"
                      : "pointer-events-none z-0 scale-[1.02] opacity-0"
                  )}
                  aria-hidden={!active}
                >
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    priority={i === 0}
                    quality={92}
                    className="object-cover object-center"
                    sizes="100vw"
                  />

                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--forest-deep)]/35 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-deep)]/82 via-[var(--forest-deep)]/25 to-transparent sm:hidden" />

                  <div className="absolute inset-0 z-10 flex flex-col justify-end px-4 pb-8 pt-4 sm:justify-center sm:px-8 sm:pb-0 md:px-10 lg:px-12">
                    <div className="max-w-md sm:max-w-sm md:max-w-md">
                      <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--gold)] backdrop-blur-sm sm:mb-3 sm:text-[10px]">
                        <Sparkles className="h-3 w-3" />
                        {t("home.premium")}
                      </span>

                      <h2 className="font-serif text-[1.4rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-[1.85rem] md:text-[2.15rem] lg:text-[2.45rem]">
                        {banner.title}
                      </h2>

                      {banner.subtitle && (
                        <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-white/82 sm:mt-2 sm:text-[13px] md:text-sm">
                          {banner.subtitle}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-2.5">
                        <Link
                          href={cta.href}
                          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--gold)] px-4 text-[12px] font-bold text-[var(--forest-deep)] shadow-lg shadow-black/15 transition hover:bg-[#d4b03a] active:scale-[0.98] sm:h-11 sm:px-5 sm:text-[13px]"
                        >
                          {t(cta.key)}
                          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Link>
                        {cta.secondary && (
                          <Link
                            href={cta.secondary.href}
                            className="inline-flex h-10 items-center rounded-full border border-white/25 bg-white/8 px-4 text-[12px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/16 active:scale-[0.98] sm:h-11 sm:px-5 sm:text-[13px]"
                          >
                            {t(cta.secondary.key)}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={prev}
            className="absolute left-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/90 text-[var(--forest-deep)] shadow-lg backdrop-blur md:flex md:opacity-0 md:transition md:group-hover:opacity-100"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/90 text-[var(--forest-deep)] shadow-lg backdrop-blur md:flex md:opacity-0 md:transition md:group-hover:opacity-100"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 sm:bottom-5 sm:left-8 md:left-10 lg:left-12">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index
                    ? "w-6 bg-[var(--gold)] sm:w-7"
                    : "w-1.5 bg-white/45 hover:bg-white/70"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <TrustBar embedded />
      </div>
    </section>
  );
}
