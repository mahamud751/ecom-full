"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, AdminCard, Badge } from "@/components/admin/ui";
import { adminFetch } from "@/lib/api-client";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from "lucide-react";

type Item = {
  label: string;
  done: boolean;
  critical?: boolean;
  href?: string;
  note?: string;
};

type LaunchCounts = {
  products: number;
  activeProducts: number;
  doctors: number;
  labTests: number;
  admins: number;
  pendingReviews: number;
  pendingOrders: number;
  vendors: number;
  riders: number;
  coupons: number;
  openTickets: number;
  refunds: number;
  settlements: number;
  hasAgora: boolean;
  hasDb: boolean;
};

export default function LaunchChecklistPage() {
  const [counts, setCounts] = useState<LaunchCounts | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch("/admin/launch");
        if (res.ok) setCounts(await res.json());
      } catch {
        /* ignore */
      }
    })();
  }, []);

  if (!counts) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--forest)]" />
      </div>
    );
  }

  const {
    products,
    activeProducts,
    doctors,
    labTests,
    admins,
    pendingReviews,
    pendingOrders,
    vendors,
    riders,
    coupons,
    openTickets,
    refunds,
    settlements,
    hasAgora,
    hasDb,
  } = counts;
  const hasGa = Boolean(process.env.NEXT_PUBLIC_GA_ID);
  const hasSentry = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

  const built: Item[] = [
    {
      label: "Store catalog (products live with stock)",
      done: activeProducts >= 5,
      note: `${activeProducts} in-stock products`,
      href: "/admin/products",
    },
    {
      label: "Admin login (bcrypt) & control center",
      done: admins >= 1,
      href: "/admin",
      note: "admin@ahona.store / admin123",
    },
    {
      label: "Orders pipeline + invoice PDF",
      done: true,
      href: "/admin/orders",
      note: `${pendingOrders} open · track-order downloads PDF`,
    },
    {
      label: "Coupons (checkout + admin)",
      done: coupons >= 1,
      href: "/admin/coupons",
      note: `${coupons} active · try CHOLBE10`,
    },
    {
      label: "Rx upload at checkout",
      done: true,
      href: "/checkout",
      note: "Required for requiresRx products",
    },
    {
      label: "Support tickets",
      done: true,
      href: "/admin/support",
      note: `${openTickets} open`,
    },
    {
      label: "Refund requests",
      done: true,
      href: "/admin/refunds",
      note: `${refunds} total requests`,
    },
    {
      label: "Doctor settlements / payouts",
      done: true,
      href: "/admin/settlements",
      note: `${settlements} settlement rows`,
    },
    {
      label: "BN/EN language toggle",
      done: true,
      note: "Header language switch",
    },
    {
      label: "PWA (manifest + service worker)",
      done: true,
      note: "/manifest.webmanifest · /sw.js",
    },
    {
      label: "Analytics + Sentry hooks",
      done: true,
      note:
        hasGa || hasSentry
          ? `GA:${hasGa ? "on" : "off"} · Sentry:${hasSentry ? "on" : "off"}`
          : "Set NEXT_PUBLIC_GA_ID / META_PIXEL / SENTRY_DSN",
    },
    {
      label: "Pharmacy compliance page",
      done: true,
      href: "/compliance",
    },
    {
      label: "Wishlist + product notify alerts",
      done: true,
      href: "/admin/notifies",
    },
    {
      label: "Reviews with admin approve",
      done: true,
      href: "/admin/reviews",
      note: `${pendingReviews} pending approval`,
    },
    {
      label: "Doctor consult + Agora A/V",
      done: doctors >= 1 && hasAgora,
      critical: true,
      href: "/admin/doctors",
      note: hasAgora
        ? `${doctors} doctors · Agora configured`
        : "Set AGORA_APP_ID + CERTIFICATE in .env",
    },
    {
      label: "Lab tests & packages",
      done: labTests >= 1,
      href: "/admin/lab",
    },
    {
      label: "Riders / last-mile ops",
      done: riders >= 1,
      href: "/admin/riders",
    },
    {
      label: "Vendors B2B",
      done: vendors >= 0,
      href: "/admin/vendors",
      note: `${vendors} active vendors`,
    },
    {
      label: "Image upload (admin)",
      done: true,
      href: "/admin/products",
    },
    {
      label: "Smart search (text / voice / image)",
      done: true,
      href: "/search",
    },
    {
      label: "Legal pages (Privacy / Terms / Refund)",
      done: true,
      href: "/privacy",
    },
    {
      label: "Contact / support page",
      done: true,
      href: "/contact",
    },
  ];

  const beforeLaunch: Item[] = [
    {
      label: "Production DATABASE_URL (managed Postgres)",
      done: hasDb,
      critical: true,
      note: "Use Neon / Supabase / RDS — not only localhost",
    },
    {
      label: "Real payment gateway (bKash / SSLCOMMERZ / Stripe)",
      done: false,
      critical: true,
      note: "Currently COD + demo payment only",
    },
    {
      label: "SMS / WhatsApp / Email for OTP & order alerts",
      done: false,
      critical: true,
      note: "Notify system stores alerts; wire Twilio / bulkSMS",
    },
    {
      label: "HTTPS domain + deploy (Vercel / VPS)",
      done: false,
      critical: true,
    },
    {
      label: "2FA for admin accounts",
      done: false,
      critical: true,
      note: "bcrypt passwords shipped; add TOTP for production",
    },
    {
      label: "Upload official drug license numbers",
      done: false,
      critical: true,
      note: "Compliance page exists — fill real license IDs",
    },
    {
      label: "Google Analytics / Meta Pixel IDs in env",
      done: hasGa,
      note: "NEXT_PUBLIC_GA_ID · NEXT_PUBLIC_META_PIXEL_ID",
    },
    {
      label: "Sentry DSN in env",
      done: hasSentry,
      note: "NEXT_PUBLIC_SENTRY_DSN",
    },
    {
      label: "Backup schedule for database",
      done: false,
      critical: true,
    },
    {
      label: "Load test checkout + Agora on mobile networks",
      done: false,
    },
    {
      label: "Customer auth (login / OTP) optional but recommended",
      done: false,
    },
  ];

  const builtDone = built.filter((b) => b.done).length;
  const launchCritical = beforeLaunch.filter((b) => b.critical);
  const launchCriticalDone = launchCritical.filter((b) => b.done).length;

  return (
    <div>
      <PageHeader
        title="Launch checklist"
        subtitle="What Ahona already ships vs what you need for public go-live"
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <AdminCard>
          <p className="text-xs font-semibold uppercase text-[var(--ink-muted)]">
            Product features ready
          </p>
          <p className="mt-1 text-2xl font-bold">
            {builtDone}/{built.length}
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase text-[var(--ink-muted)]">
            Critical launch items
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {launchCriticalDone}/{launchCritical.length}
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase text-[var(--ink-muted)]">
            Catalog snapshot
          </p>
          <p className="mt-1 text-sm font-semibold">
            {products} products · {doctors} doctors · {labTests} lab tests
          </p>
        </AdminCard>
      </div>

      <AdminCard className="mb-4 border-amber-200 bg-amber-50/50">
        <div className="flex gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-bold text-amber-900">Before public launch</p>
            <p className="mt-1 text-amber-900/80">
              The app is feature-rich for a demo / soft launch. For real money
              and patients: production DB, real payments, SMS, secure admin
              auth, HTTPS, and pharmacy compliance are required.
            </p>
          </div>
        </div>
      </AdminCard>

      <h2 className="mb-3 text-lg font-bold">Already built in Ahona</h2>
      <div className="mb-8 space-y-2">
        {built.map((item) => (
          <Row key={item.label} item={item} />
        ))}
      </div>

      <h2 className="mb-3 text-lg font-bold">Still needed for full launch</h2>
      <div className="space-y-2">
        {beforeLaunch.map((item) => (
          <Row key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}

function Row({ item }: { item: Item }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3">
      {item.done ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      ) : (
        <Circle className="mt-0.5 h-5 w-5 shrink-0 text-gray-300" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{item.label}</p>
          {item.critical && !item.done && <Badge tone="red">Critical</Badge>}
          {item.done && <Badge tone="green">Done</Badge>}
        </div>
        {item.note && (
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{item.note}</p>
        )}
      </div>
      {item.href && (
        <Link
          href={item.href}
          className="inline-flex items-center gap-0.5 text-xs font-bold text-[var(--forest)]"
        >
          Open <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
