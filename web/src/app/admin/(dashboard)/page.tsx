"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PageHeader, StatCard, AdminCard, Badge } from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";

type Dash = {
  stats: {
    products: number;
    lowStock: number;
    orders: number;
    pendingOrders: number;
    revenue: number;
    doctors: number;
    activeConsults: number;
    labTests: number;
    activeLabBookings: number;
    vendors: number;
    riders: number;
    onlineRiders: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
  recentConsults: {
    id: string;
    consultNumber: string;
    patientName: string;
    status: string;
    doctor: { name: string; specialty: string };
  }[];
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch("/admin/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }
  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--forest)]" />
      </div>
    );
  }

  const s = data.stats;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Live snapshot of store, lab, doctors & operations"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatPrice(s.revenue)}
          hint={`${s.orders} total orders`}
          accent="bg-[var(--gold)]"
        />
        <StatCard
          label="Pending orders"
          value={s.pendingOrders}
          hint="Need packing / dispatch"
        />
        <StatCard
          label="Products"
          value={s.products}
          hint={`${s.lowStock} low stock`}
        />
        <StatCard
          label="Active consults"
          value={s.activeConsults}
          hint={`${s.doctors} doctors`}
        />
        <StatCard
          label="Lab bookings"
          value={s.activeLabBookings}
          hint={`${s.labTests} active tests`}
        />
        <StatCard label="Vendors" value={s.vendors} hint="Active B2B partners" />
        <StatCard
          label="Riders online"
          value={s.onlineRiders}
          hint={`${s.riders} total fleet`}
        />
        <StatCard
          label="Ops health"
          value={s.lowStock === 0 ? "OK" : "Alert"}
          hint={s.lowStock ? "Restock needed" : "Inventory healthy"}
          accent={s.lowStock ? "bg-red-500" : "bg-emerald-500"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[var(--forest)]"
            >
              Manage →
            </Link>
          </div>
          <div className="space-y-2">
            {data.recentOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-lg bg-[var(--ivory)] px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-mono text-xs text-[var(--ink-muted)]">
                    {o.orderNumber}
                  </p>
                  <p className="font-semibold">{o.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPrice(o.total)}</p>
                  <Badge
                    tone={
                      o.status === "DELIVERED"
                        ? "green"
                        : o.status === "CANCELLED"
                          ? "red"
                          : "amber"
                    }
                  >
                    {o.status}
                  </Badge>
                </div>
              </div>
            ))}
            {data.recentOrders.length === 0 && (
              <p className="text-sm text-[var(--ink-muted)]">No orders yet</p>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Consultations</h2>
            <Link
              href="/admin/doctors"
              className="text-xs font-semibold text-[var(--forest)]"
            >
              Doctors →
            </Link>
          </div>
          <div className="space-y-2">
            {data.recentConsults.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg bg-[var(--ivory)] px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-semibold">{c.patientName}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {c.doctor.name} · {c.doctor.specialty}
                  </p>
                </div>
                <Badge tone="blue">{c.status}</Badge>
              </div>
            ))}
            {data.recentConsults.length === 0 && (
              <p className="text-sm text-[var(--ink-muted)]">No consults yet</p>
            )}
          </div>
        </AdminCard>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { href: "/admin/earnings", label: "Earnings center" },
          { href: "/admin/products", label: "Add product" },
          { href: "/admin/orders", label: "Dispatch orders" },
          { href: "/admin/doctors", label: "Manage doctors" },
          { href: "/admin/riders", label: "Riders & ops" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-center text-sm font-bold text-[var(--forest)] shadow-sm hover:border-[var(--forest)]"
          >
            {a.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}
