"use client";

import {
  ShieldCheck,
  Truck,
  BadgePercent,
  RotateCcw,
  BadgeCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

const items: {
  icon: typeof BadgeCheck;
  titleKey: MessageKey;
  descKey: MessageKey;
}[] = [
  {
    icon: BadgeCheck,
    titleKey: "trust.dgda",
    descKey: "trust.dgdaDesc",
  },
  {
    icon: Truck,
    titleKey: "trust.express",
    descKey: "trust.expressDesc",
  },
  {
    icon: BadgePercent,
    titleKey: "trust.deals",
    descKey: "trust.dealsDesc",
  },
  {
    icon: RotateCcw,
    titleKey: "trust.returns",
    descKey: "trust.returnsDesc",
  },
  {
    icon: ShieldCheck,
    titleKey: "trust.cod",
    descKey: "trust.codDesc",
  },
];

export function TrustBar({ embedded = false }: { embedded?: boolean }) {
  const { t } = useI18n();

  return (
    <div
      className={
        embedded
          ? "border-t border-[var(--line)] bg-[var(--ivory)]/90"
          : "border-y border-[var(--line)] bg-white"
      }
    >
      <div className={embedded ? "px-3 sm:px-5" : "container-main"}>
        <div className="flex items-stretch justify-between gap-1 overflow-x-auto py-2 no-scrollbar sm:py-2.5">
          {items.map((item, i) => (
            <div
              key={item.titleKey}
              className="flex min-w-[140px] flex-1 items-center gap-2 px-1 py-0.5 sm:min-w-0"
            >
              {i > 0 && (
                <span className="mr-1 hidden h-7 w-px bg-[var(--line)] xl:block" />
              )}
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[var(--forest)] ring-1 ring-[var(--line)] sm:h-8 sm:w-8">
                <item.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[11px] font-bold text-[var(--ink)] sm:text-xs">
                  {t(item.titleKey)}
                </span>
                <span className="block truncate text-[10px] text-[var(--ink-muted)] sm:text-[11px]">
                  {t(item.descKey)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
