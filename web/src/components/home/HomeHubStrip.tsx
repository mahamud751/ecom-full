"use client";

import Link from "next/link";
import { FlaskConical, Stethoscope, ChevronRight, Siren } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function HomeHubStrip() {
  const { t } = useI18n();

  return (
    <section className="container-main py-3 md:py-5">
      {/* Mobile emergency CTA */}
      <Link
        href="/doctors"
        className="mb-3 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 p-3.5 text-white shadow-lg shadow-red-500/20 sm:hidden"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
          <Siren className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-white/80">
            24/7
          </span>
          <span className="block text-sm font-bold leading-tight">
            Emergency doctor — instant
          </span>
        </span>
        <ChevronRight className="h-5 w-5 opacity-80" />
      </Link>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Link
          href="/doctors"
          className="group flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white p-3.5 shadow-sm transition active:scale-[0.99] sm:gap-4 sm:p-5 sm:hover:shadow-lg"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--forest-deep)] text-[var(--gold)] sm:h-14 sm:w-14">
            <Stethoscope className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-[15px] font-semibold text-[var(--ink)] sm:text-lg">
              {t("home.doctorCardTitle")}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--ink-muted)] sm:text-sm">
              {t("home.doctorCardDesc")}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-[var(--forest)] opacity-50" />
        </Link>
        <Link
          href="/lab-test"
          className="group flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white p-3.5 shadow-sm transition active:scale-[0.99] sm:gap-4 sm:p-5 sm:hover:shadow-lg"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--forest)] text-white sm:h-14 sm:w-14">
            <FlaskConical className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-[15px] font-semibold text-[var(--ink)] sm:text-lg">
              {t("home.labCardTitle")}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--ink-muted)] sm:text-sm">
              {t("home.labCardDesc")}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-[var(--forest)] opacity-50" />
        </Link>
      </div>
    </section>
  );
}

export function HomeLabBanner() {
  const { t } = useI18n();

  return (
    <section className="container-main py-4 md:py-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0e7673] to-[#0a4f4d] p-5 text-white shadow-lg sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-8 md:rounded-3xl md:px-10">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-[1] max-w-lg">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold)] sm:text-xs">
            {t("home.labBannerTag")}
          </p>
          <h2 className="mt-1 font-serif text-lg font-semibold sm:text-xl md:text-2xl">
            {t("home.labBannerTitle")}
          </h2>
          <p className="mt-1 text-xs text-white/75 sm:text-sm">
            {t("home.labBannerDesc")}
          </p>
        </div>
        <Link
          href="/lab-test"
          className="relative z-[1] mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0e7673] shadow-md active:scale-95 sm:mt-0 sm:shrink-0"
        >
          {t("home.labBannerCta")}
        </Link>
      </div>
    </section>
  );
}
