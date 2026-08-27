"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ArrowRight, House, Pill, Microscope, Video } from "lucide-react";
import { hubTabs, getActiveTabId, type HubTab } from "@/lib/nav-data";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

const hubLabelKey: Record<HubTab["id"], MessageKey> = {
  all: "nav.all",
  store: "nav.store",
  lab: "nav.lab",
  doctor: "nav.doctor",
};

const tabIcons = {
  all: House,
  store: Pill,
  lab: Microscope,
  doctor: Video,
};

export function MainTabs() {
  const pathname = usePathname();
  const { t, phrase, cat } = useI18n();
  const activeId = getActiveTabId(pathname);

  function itemLabel(name: string, href: string) {
    // Prefer category map when link is /category/slug
    const m = href.match(/^\/category\/([^/?#]+)/);
    if (m) return cat(m[1], name);
    return phrase(name);
  }
  const [openId, setOpenId] = useState<HubTab["id"] | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  function open(id: HubTab["id"]) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenId(id);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId(null), 140);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  useEffect(() => {
    setOpenId(null);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openTab = hubTabs.find((t) => t.id === openId) ?? null;

  return (
    <div className="relative z-40 hidden lg:block" ref={barRef}>
      {/* Premium tab rail */}
      <div className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="container-main flex items-stretch">
          {hubTabs.map((tab) => {
            const Icon = tabIcons[tab.id];
            const isActive = activeId === tab.id;
            const isOpen = openId === tab.id;

            return (
              <div
                key={tab.id}
                className="relative"
                onMouseEnter={() => open(tab.id)}
                onMouseLeave={scheduleClose}
              >
                <Link
                  href={tab.href}
                  className={cn(
                    "group relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold tracking-tight transition-colors",
                    isActive || isOpen
                      ? "text-[var(--ink)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  )}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] transition-colors",
                      isActive || isOpen
                        ? "text-[var(--gold)]"
                        : "text-[var(--ink-muted)] group-hover:text-[var(--gold)]"
                    )}
                    strokeWidth={1.75}
                  />
                  {t(hubLabelKey[tab.id])}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                  {/* Active / hover underline */}
                  <span
                    className={cn(
                      "absolute inset-x-3 bottom-0 h-[2.5px] rounded-full bg-[var(--gold)] transition-opacity",
                      isActive || isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                    )}
                  />
                </Link>
              </div>
            );
          })}

          <div className="ml-auto flex items-center py-1.5 pl-4 text-xs text-[var(--ink-muted)]">
            <span className="rounded-full bg-[var(--gold-soft)] px-3 py-1 font-semibold text-[var(--ink)]">
              {t("nav.express")}
            </span>
          </div>
        </div>
      </div>

      {/* Mega panel */}
      {openTab && (
        <div
          className="animate-fade-in absolute inset-x-0 top-full border-b border-[var(--line)] bg-white shadow-[0_24px_60px_-20px_rgba(15,40,38,0.25)]"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="container-main grid gap-0 py-7 lg:grid-cols-[1fr_280px]">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:pr-8">
              {openTab.columns.map((col) => (
                <div key={col.title}>
                  <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--gold-deep)]">
                    {phrase(col.title)}
                  </h3>
                  <ul className="space-y-0.5">
                    {col.items.map((item) => (
                      <li key={item.name + item.href}>
                        <Link
                          href={item.href}
                          className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[var(--ivory)]"
                          onClick={() => setOpenId(null)}
                        >
                          {item.image && (
                            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--ivory)] ring-1 ring-[var(--line)]">
                              <Image
                                src={item.image}
                                alt=""
                                fill
                                className="object-cover transition duration-300 group-hover:scale-110"
                                sizes="40px"
                              />
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--forest)]">
                                {itemLabel(item.name, item.href)}
                              </span>
                              {item.badge && (
                                <span className="rounded-md bg-[var(--gold-soft)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--gold-deep)]">
                                  {phrase(item.badge)}
                                </span>
                              )}
                            </span>
                            {item.desc && (
                              <span className="block text-xs text-[var(--ink-muted)]">
                                {phrase(item.desc)}
                              </span>
                            )}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--ink-muted)] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {openTab.featured && (
              <Link
                href={openTab.featured.href}
                onClick={() => setOpenId(null)}
                className="group relative mt-4 overflow-hidden rounded-2xl lg:mt-0"
              >
                <div className="relative min-h-[220px] w-full lg:h-full">
                  <Image
                    src={openTab.featured.image}
                    alt={phrase(openTab.featured.title)}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="280px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-deep)]/95 via-[var(--forest)]/50 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
                      {phrase(openTab.tagline)}
                    </p>
                    <h4 className="mt-1 text-lg font-bold leading-snug">
                      {phrase(openTab.featured.title)}
                    </h4>
                    <p className="mt-1 text-xs text-white/80">
                      {phrase(openTab.featured.desc)}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-[var(--forest-deep)]">
                      {phrase(openTab.featured.cta)}
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Dim backdrop when mega open */}
      {openTab && (
        <div
          className="fixed inset-0 top-[var(--header-h,140px)] z-[-1] bg-black/20 backdrop-blur-[1px]"
          onMouseEnter={scheduleClose}
          aria-hidden
        />
      )}
    </div>
  );
}
