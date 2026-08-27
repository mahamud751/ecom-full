"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Mail, MapPin, Share2, Camera, Play } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function Footer() {
  const pathname = usePathname();
  const { t } = useI18n();
  if (pathname.startsWith("/admin")) return null;

  const columns: { titleKey: MessageKey; links: { href: string; labelKey: MessageKey }[] }[] =
    [
      {
        titleKey: "footer.col.store",
        links: [
          { href: "/store", labelKey: "footer.allProducts" },
          { href: "/category/medicine", labelKey: "footer.medicine" },
          { href: "/category/beauty", labelKey: "footer.beauty" },
          { href: "/category/skincare", labelKey: "footer.skincare" },
          { href: "/category/supplement", labelKey: "footer.supplements" },
          { href: "/store?flash=1", labelKey: "footer.flashSale" },
        ],
      },
      {
        titleKey: "footer.col.services",
        links: [
          { href: "/doctors", labelKey: "footer.doctorConsult" },
          { href: "/lab-test", labelKey: "footer.labPackages" },
          { href: "/store", labelKey: "footer.onlineStore" },
          { href: "/wishlist", labelKey: "footer.wishlist" },
          { href: "/track-order", labelKey: "footer.trackOrder" },
          { href: "/checkout", labelKey: "footer.checkout" },
        ],
      },
      {
        titleKey: "footer.col.cholbe",
        links: [
          { href: "/", labelKey: "footer.home" },
          { href: "/search", labelKey: "footer.searchHubs" },
          { href: "/contact", labelKey: "footer.contact" },
          { href: "/compliance", labelKey: "footer.compliance" },
          { href: "/privacy", labelKey: "footer.privacy" },
          { href: "/terms", labelKey: "footer.terms" },
          { href: "/refund", labelKey: "footer.refundPolicy" },
          { href: "/refund-request", labelKey: "footer.requestRefund" },
        ],
      },
    ];

  return (
    <footer className="mt-auto bg-[var(--forest-deep)] text-white">
      <div className="border-b border-white/10 bg-[var(--forest)]">
        <div className="container-main flex flex-col items-start justify-between gap-4 py-8 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-serif text-xl font-semibold">
              {t("footer.needHelp")}
            </h3>
            <p className="mt-1 text-sm text-white/70">{t("footer.needHelpDesc")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="tel:+8809610016778"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-2.5 text-sm font-bold text-[var(--forest-deep)]"
            >
              <Phone className="h-4 w-4" />
              {t("footer.call")}
            </a>
            <a
              href="https://wa.me/8801810117100"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold"
            >
              {t("footer.whatsapp")}
            </a>
          </div>
        </div>
      </div>

      <div className="container-main grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <BrandLogo variant="footer" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
            {t("footer.about")}
          </p>
          <div className="mt-5 space-y-2 text-sm text-white/60">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[var(--gold)]" /> 16778
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[var(--gold)]" /> support@ahona.store
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--gold)]" />{" "}
              {t("header.country")}
            </p>
          </div>
          <div className="mt-5 flex gap-2">
            {[Share2, Camera, Play].map((Icon, i) => (
              <span
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-[var(--gold)] hover:text-[var(--forest-deep)]"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.titleKey}>
            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--gold)]">
              {t(col.titleKey)}
            </h4>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href + link.labelKey}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/55 transition hover:text-white"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-main flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/35 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Ahona. {t("footer.rights")}
          </p>
          <p>{t("footer.secureLine")}</p>
        </div>
      </div>
    </footer>
  );
}
