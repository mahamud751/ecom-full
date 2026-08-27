"use client";

import Link from "next/link";
import {
  MessageCircle,
  FileUp,
  Percent,
  FlaskConical,
  Stethoscope,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

type ServiceDef = {
  titleKey: MessageKey | "raw";
  titleRaw?: string;
  line1Key?: MessageKey;
  line1Raw?: string;
  line2Key?: MessageKey;
  line2Raw?: string;
  ctaKey: MessageKey;
  href: string;
  icon: typeof MessageCircle;
  iconBg: string;
  external?: boolean;
};

const services: ServiceDef[] = [
  {
    titleKey: "raw",
    titleRaw: "Order",
    line1Key: "home.orderVia",
    line2Raw: "01810117100",
    ctaKey: "home.callNow",
    href: "https://wa.me/8801810117100",
    icon: MessageCircle,
    iconBg: "#5CD163",
    external: true,
  },
  {
    titleKey: "home.upto",
    line1Raw: "10% OFF",
    line2Key: "home.cashback",
    ctaKey: "home.uploadRx",
    href: "/store",
    icon: FileUp,
    iconBg: "#1f6b64",
  },
  {
    titleKey: "home.upto",
    line1Raw: "60% OFF",
    line2Key: "home.cashback",
    ctaKey: "home.beautyCta",
    href: "/category/beauty",
    icon: Percent,
    iconBg: "#c9a227",
  },
  {
    titleKey: "home.upto",
    line1Raw: "25% OFF",
    line2Key: "home.homeSample",
    ctaKey: "home.labTest",
    href: "/lab-test",
    icon: FlaskConical,
    iconBg: "#FD6A6A",
  },
  {
    titleKey: "nav.doctors",
    line1Key: "home.onlineConsult",
    line2Key: "home.fromFee",
    ctaKey: "home.bookDoctor",
    href: "/doctors",
    icon: Stethoscope,
    iconBg: "#0e7673",
  },
];

export function ServiceCards() {
  const { t } = useI18n();

  return (
    <section className="home-section container-main">
      <div className="mb-3.5">
        <h2 className="section-title">{t("home.especially")}</h2>
      </div>

      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory md:grid md:grid-cols-5 md:gap-3 md:overflow-visible">
        {services.map((s, idx) => {
          const Icon = s.icon;
          const className =
            "service-card group flex w-[136px] shrink-0 snap-start flex-col justify-between p-3 md:w-auto md:min-w-0 md:flex-1";

          const title =
            s.titleKey === "raw" ? s.titleRaw || "" : t(s.titleKey);
          const line1 = s.line1Key ? t(s.line1Key) : s.line1Raw || "";
          const line2 = s.line2Key ? t(s.line2Key) : s.line2Raw || "";
          const cta = t(s.ctaKey);

          const content = (
            <>
              <div
                className="pointer-events-none absolute right-0 top-0 h-full w-[42%] opacity-90"
                style={{
                  background: `linear-gradient(135deg, transparent 40%, ${s.iconBg}22 40%)`,
                }}
              />
              <div
                className="relative z-[1] mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ backgroundColor: s.iconBg }}
              >
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div className="relative z-[1] flex min-h-[86px] flex-col">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-500">
                  {title}
                </p>
                <p className="mt-0.5 text-[13px] font-semibold leading-tight text-gray-900 md:text-sm">
                  {line1}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-500">{line2}</p>
                <span className="mt-auto pt-2 text-[11px] font-semibold text-brand">
                  {cta}
                </span>
              </div>
            </>
          );

          if (s.external) {
            return (
              <a
                key={idx}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className={className}
              >
                {content}
              </a>
            );
          }

          return (
            <Link key={idx} href={s.href} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
