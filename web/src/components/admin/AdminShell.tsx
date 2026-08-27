"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Warehouse,
  ShoppingCart,
  FlaskConical,
  Store,
  Bike,
  Stethoscope,
  Wallet,
  Bell,
  MessageSquare,
  Rocket,
  Tag,
  Headphones,
  RotateCcw,
  Banknote,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { setAccessToken } from "@/lib/api-client";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/earnings", label: "Earnings", icon: Wallet },
  { href: "/admin/settlements", label: "Doctor payouts", icon: Banknote },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/catalog", label: "Brands & Categories", icon: Tags },
  { href: "/admin/stock", label: "Stock", icon: Warehouse },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/notifies", label: "Product alerts", icon: Bell },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/refunds", label: "Refunds", icon: RotateCcw },
  { href: "/admin/support", label: "Support", icon: Headphones },
  { href: "/admin/lab", label: "Lab Tests", icon: FlaskConical },
  { href: "/admin/vendors", label: "Vendors B2B", icon: Store },
  { href: "/admin/riders", label: "Riders / Ops", icon: Bike },
  { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/admin/launch", label: "Launch checklist", icon: Rocket },
];

export function AdminShell({
  children,
  admin,
}: {
  children: React.ReactNode;
  admin: { name: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth-proxy", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "admin", action: "logout" }),
    });
    setAccessToken("admin", null);
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-[#f0f2f1] text-[var(--ink)]">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-[var(--forest-deep)] text-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
          <BrandLogo
            variant="compact"
            showWordmark={false}
            href="/admin"
            className="ring-white/20"
          />
          <div>
            <p className="font-serif text-sm font-semibold tracking-wide">
              Ahona Admin
            </p>
            <p className="text-[10px] text-white/50">Ops · Commerce · Lab</p>
          </div>
          <button
            type="button"
            className="ml-auto rounded p-1 lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-0.5 p-3">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-[var(--gold)]/20 text-[var(--gold)]"
                    : "text-white/75 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-3">
          <p className="truncate text-xs font-semibold">{admin.name}</p>
          <p className="truncate text-[10px] text-white/50">{admin.email}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--gold)]">
            {admin.role}
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/10 py-2 text-xs font-bold hover:bg-white/15"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--line)] bg-white/90 px-4 backdrop-blur">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-semibold">Control Center</p>
          </div>
          <Link
            href="/"
            target="_blank"
            className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--forest)]"
          >
            View store →
          </Link>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
