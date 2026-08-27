"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import Link from "next/link";
import {
  PageHeader,
  AdminCard,
  StatCard,
  Badge,
} from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Earnings = {
  summary: {
    totalGross: number;
    platformEarnings: number;
    ecomRevenue: number;
    doctorGross: number;
    doctorPlatform: number;
    doctorPayout: number;
    labRevenue: number;
    deliveryFeesCollected: number;
    riderPayoutTotal: number;
    deliveryMargin: number;
  };
  ecom: {
    orderCount: number;
    revenue: number;
    paidCount: number;
    paidRevenue: number;
    deliveredCount: number;
    deliveredRevenue: number;
    byStatus: { status: string; count: number; total: number }[];
  };
  doctors: {
    completedConsults: number;
    activeConsults: number;
    allConsults: number;
    gross: number;
    platform: number;
    doctorPayout: number;
    leaders: {
      id: string;
      name: string;
      specialty: string;
      consults: number;
      gross: number;
      platform: number;
      doctorShare: number;
    }[];
  };
  lab: {
    bookingCount: number;
    revenue: number;
    reportReadyCount: number;
    reportReadyRevenue: number;
  };
  riders: {
    deliveryCount: number;
    deliveryFeesCollected: number;
    riderPayoutTotal: number;
    platformMargin: number;
    leaders: {
      id: string;
      name: string;
      phone: string;
      zone: string | null;
      deliveries: number;
      deliveryFees: number;
      riderEarned: number;
      platformKept: number;
    }[];
  };
};

export default function AdminEarningsPage() {
  const [data, setData] = useState<Earnings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch("/admin/earnings")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--forest)]" />
      </div>
    );
  }

  const s = data.summary;

  return (
    <div>
      <PageHeader
        title="Earnings center"
        subtitle="Ecommerce · Doctor consults · Lab · Delivery — full P&L snapshot"
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Platform earnings"
          value={formatPrice(s.platformEarnings)}
          hint="Ecom + doc cut + lab + delivery margin"
          accent="bg-[var(--gold)]"
        />
        <StatCard
          label="Gross volume"
          value={formatPrice(s.totalGross)}
          hint="All channels combined"
        />
        <StatCard
          label="Doctor payouts due"
          value={formatPrice(s.doctorPayout)}
          hint={`From ${data.doctors.completedConsults} consults`}
        />
        <StatCard
          label="Rider payouts due"
          value={formatPrice(s.riderPayoutTotal)}
          hint={`${data.riders.deliveryCount} deliveries`}
        />
      </div>

      {/* Channel breakdown */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminCard>
          <p className="text-xs font-semibold uppercase text-[var(--ink-muted)]">
            Ecommerce
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--forest)]">
            {formatPrice(s.ecomRevenue)}
          </p>
          <p className="text-xs text-[var(--ink-muted)]">
            {data.ecom.orderCount} orders · {data.ecom.paidCount} paid
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase text-[var(--ink-muted)]">
            Doctor (platform cut)
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--forest)]">
            {formatPrice(s.doctorPlatform)}
          </p>
          <p className="text-xs text-[var(--ink-muted)]">
            Gross {formatPrice(s.doctorGross)} · payout{" "}
            {formatPrice(s.doctorPayout)}
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase text-[var(--ink-muted)]">
            Lab
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--forest)]">
            {formatPrice(s.labRevenue)}
          </p>
          <p className="text-xs text-[var(--ink-muted)]">
            {data.lab.bookingCount} bookings
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase text-[var(--ink-muted)]">
            Delivery margin
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--forest)]">
            {formatPrice(s.deliveryMargin)}
          </p>
          <p className="text-xs text-[var(--ink-muted)]">
            Fees {formatPrice(s.deliveryFeesCollected)} − riders{" "}
            {formatPrice(s.riderPayoutTotal)}
          </p>
        </AdminCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Ecom detail */}
        <AdminCard>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Ecommerce breakdown</h2>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[var(--forest)]"
            >
              Orders →
            </Link>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-[var(--ivory)] p-2">
              <p className="text-[10px] text-[var(--ink-muted)]">Paid</p>
              <p className="font-bold">{formatPrice(data.ecom.paidRevenue)}</p>
            </div>
            <div className="rounded-lg bg-[var(--ivory)] p-2">
              <p className="text-[10px] text-[var(--ink-muted)]">Delivered</p>
              <p className="font-bold">
                {formatPrice(data.ecom.deliveredRevenue)}
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            {data.ecom.byStatus.map((row) => (
              <div
                key={row.status}
                className="flex items-center justify-between text-sm"
              >
                <Badge
                  tone={
                    row.status === "DELIVERED"
                      ? "green"
                      : row.status === "CANCELLED"
                        ? "red"
                        : "amber"
                  }
                >
                  {row.status}
                </Badge>
                <span>
                  {row.count} · {formatPrice(row.total)}
                </span>
              </div>
            ))}
            {data.ecom.byStatus.length === 0 && (
              <p className="text-sm text-[var(--ink-muted)]">No orders yet</p>
            )}
          </div>
        </AdminCard>

        {/* Lab */}
        <AdminCard>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Lab revenue</h2>
            <Link
              href="/admin/lab"
              className="text-xs font-semibold text-[var(--forest)]"
            >
              Lab →
            </Link>
          </div>
          <p className="text-3xl font-bold">{formatPrice(data.lab.revenue)}</p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {data.lab.bookingCount} bookings · {data.lab.reportReadyCount}{" "}
            reports ready ({formatPrice(data.lab.reportReadyRevenue)})
          </p>
        </AdminCard>

        {/* Doctor leaders */}
        <AdminCard>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Doctor earnings</h2>
            <Link
              href="/admin/doctors"
              className="text-xs font-semibold text-[var(--forest)]"
            >
              Doctors →
            </Link>
          </div>
          <p className="mb-3 text-xs text-[var(--ink-muted)]">
            {data.doctors.completedConsults} completed ·{" "}
            {data.doctors.activeConsults} active · platform{" "}
            {formatPrice(data.doctors.platform)}
          </p>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {data.doctors.leaders.map((d) => (
              <Link
                key={d.id}
                href={`/admin/doctors/${d.id}`}
                className="flex items-center justify-between rounded-lg bg-[var(--ivory)] px-3 py-2 text-sm hover:ring-1 hover:ring-[var(--forest)]"
              >
                <div>
                  <p className="font-semibold">{d.name}</p>
                  <p className="text-[10px] text-[var(--ink-muted)]">
                    {d.specialty} · {d.consults} consults
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold">{formatPrice(d.gross)}</p>
                  <p className="text-emerald-700">
                    Doc {formatPrice(d.doctorShare)}
                  </p>
                  <p className="text-[var(--forest)]">
                    Plat {formatPrice(d.platform)}
                  </p>
                </div>
              </Link>
            ))}
            {data.doctors.leaders.length === 0 && (
              <p className="text-sm text-[var(--ink-muted)]">
                No completed consults yet
              </p>
            )}
          </div>
        </AdminCard>

        {/* Rider leaders */}
        <AdminCard>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Rider earnings</h2>
            <Link
              href="/admin/riders"
              className="text-xs font-semibold text-[var(--forest)]"
            >
              Riders →
            </Link>
          </div>
          <p className="mb-3 text-xs text-[var(--ink-muted)]">
            {data.riders.deliveryCount} deliveries · fees{" "}
            {formatPrice(data.riders.deliveryFeesCollected)} · margin{" "}
            {formatPrice(data.riders.platformMargin)}
          </p>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {data.riders.leaders.map((r) => (
              <Link
                key={r.id}
                href={`/admin/riders/${r.id}`}
                className="flex items-center justify-between rounded-lg bg-[var(--ivory)] px-3 py-2 text-sm hover:ring-1 hover:ring-[var(--forest)]"
              >
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-[10px] text-[var(--ink-muted)]">
                    {r.phone}
                    {r.zone ? ` · ${r.zone}` : ""} · {r.deliveries} trips
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-emerald-700">
                    {formatPrice(r.riderEarned)}
                  </p>
                  <p className="text-[var(--ink-muted)]">
                    plat {formatPrice(r.platformKept)}
                  </p>
                </div>
              </Link>
            ))}
            {data.riders.leaders.length === 0 && (
              <p className="text-sm text-[var(--ink-muted)]">
                No delivered rider orders yet
              </p>
            )}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
