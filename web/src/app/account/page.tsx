"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import Link from "next/link";
import {
  Package,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { formatPrice } from "@/lib/utils";

type OrderRow = {
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  itemCount: number;
};

export default function AccountDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/auth/orders", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setOrders(data.orders || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  const spent = orders.reduce((s, o) => s + o.total, 0);
  const recent = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">
            Orders
          </p>
          <p className="mt-1 font-serif text-3xl font-semibold text-[var(--forest-deep)]">
            {loading ? "—" : orders.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">
            Total spent
          </p>
          <p className="mt-1 font-serif text-3xl font-semibold text-[var(--forest-deep)]">
            {loading ? "—" : formatPrice(spent)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">
            Member since
          </p>
          <p className="mt-1 font-serif text-xl font-semibold text-[var(--forest-deep)]">
            {new Date(user.createdAt).toLocaleDateString("en-BD", {
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <ShoppingBag className="h-5 w-5 text-[var(--forest)]" />
            Profile snapshot
          </h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2.5 text-[var(--ink)]">
              <Mail className="h-4 w-4 text-[var(--ink-muted)]" />
              {user.email}
            </li>
            <li className="flex items-center gap-2.5 text-[var(--ink)]">
              <Phone className="h-4 w-4 text-[var(--ink-muted)]" />
              {user.phone || "No phone added"}
            </li>
            <li className="flex items-start gap-2.5 text-[var(--ink)]">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-muted)]" />
              <span>
                {user.address
                  ? `${user.address}${user.area ? `, ${user.area}` : ""}${user.city ? `, ${user.city}` : ""}`
                  : "No delivery address saved"}
              </span>
            </li>
            <li className="flex items-center gap-2.5 text-[var(--ink)]">
              <Calendar className="h-4 w-4 text-[var(--ink-muted)]" />
              DOB: {user.dateOfBirth || "Not set"}
              {user.gender ? ` · ${user.gender}` : ""}
            </li>
          </ul>
          <Link
            href="/account/profile"
            className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[var(--forest)] hover:underline"
          >
            Complete profile <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Package className="h-5 w-5 text-[var(--forest)]" />
              Recent orders
            </h2>
            <Link
              href="/account/orders"
              className="text-xs font-bold text-[var(--forest)] hover:underline"
            >
              View all
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-[var(--ink-muted)]">Loading…</p>
          ) : recent.length === 0 ? (
            <div className="rounded-xl bg-[var(--ivory)] px-4 py-8 text-center">
              <p className="text-sm font-semibold">No orders yet</p>
              <Link
                href="/store"
                className="mt-3 inline-block text-sm font-bold text-[var(--forest)]"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {recent.map((o) => (
                <li
                  key={o.orderNumber}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-bold text-[var(--ink)]">
                      {o.orderNumber}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {new Date(o.createdAt).toLocaleDateString()} ·{" "}
                      {o.itemCount} items · {o.status}
                    </p>
                  </div>
                  <p className="font-bold text-[var(--forest-deep)]">
                    {formatPrice(o.total)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
