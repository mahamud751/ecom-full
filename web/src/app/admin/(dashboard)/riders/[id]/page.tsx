"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  PageHeader,
  AdminCard,
  Badge,
  StatCard,
  Btn,
} from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import { Loader2, ChevronLeft } from "lucide-react";

export default function AdminRiderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetch(`/admin/riders?id=${id}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Not found");
      return;
    }
    setData(json);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-red-600">{error}</p>
        <Link href="/admin/riders" className="mt-3 inline-block text-[var(--forest)]">
          ← Back
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--forest)]" />
      </div>
    );
  }

  const r = data.rider;
  const s = data.stats;

  return (
    <div>
      <Link
        href="/admin/riders"
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--forest)]"
      >
        <ChevronLeft className="h-4 w-4" /> All riders
      </Link>
      <PageHeader
        title={r.name}
        subtitle={`${r.phone} · ${r.vehicleType}${r.zone ? ` · ${r.zone}` : ""}`}
        actions={
          <Badge
            tone={
              r.status === "AVAILABLE"
                ? "green"
                : r.status === "BUSY"
                  ? "amber"
                  : "gray"
            }
          >
            {r.status}
          </Badge>
        }
      />

      <div className="mb-4 text-sm text-[var(--ink-muted)]">
        <p>NID: {r.nid || "—"}</p>
        <p>Address: {r.address || "—"}</p>
        <p>Payout: ৳{r.perDelivery} / delivery</p>
        {r.notes && <p className="mt-1">Notes: {r.notes}</p>}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total orders" value={s.totalOrders} />
        <StatCard label="Delivered" value={s.delivered} />
        <StatCard
          label="Rider earned"
          value={formatPrice(s.riderEarned)}
          accent="bg-emerald-500"
        />
        <StatCard
          label="Platform kept"
          value={formatPrice(s.platformKept)}
          hint={`Fees ${formatPrice(s.deliveryFees)} · GMV ${formatPrice(s.gmv)}`}
        />
      </div>

      <div className="mb-4 flex gap-3 text-sm">
        <Badge tone="amber">{s.active} active</Badge>
        <Badge tone="red">{s.cancelled} cancelled</Badge>
      </div>

      <AdminCard>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Order history</h2>
          <Link href="/admin/orders">
            <Btn variant="secondary">All orders</Btn>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="text-[10px] uppercase text-[var(--ink-muted)]">
              <tr>
                <th className="pb-2">Order</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Area</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Delivery fee</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">When</th>
              </tr>
            </thead>
            <tbody>
              {r.orders.map(
                (o: {
                  id: string;
                  orderNumber: string;
                  customerName: string;
                  customerPhone: string;
                  area: string | null;
                  city: string;
                  total: number;
                  deliveryFee: number;
                  status: string;
                  createdAt: string;
                }) => (
                  <tr key={o.id} className="border-t border-[var(--line)]">
                    <td className="py-2 font-mono text-xs">{o.orderNumber}</td>
                    <td className="py-2">
                      <p className="font-semibold">{o.customerName}</p>
                      <p className="text-[10px] text-[var(--ink-muted)]">
                        {o.customerPhone}
                      </p>
                    </td>
                    <td className="py-2 text-xs">
                      {o.area || o.city}
                    </td>
                    <td className="py-2 font-semibold">
                      {formatPrice(o.total)}
                    </td>
                    <td className="py-2">{formatPrice(o.deliveryFee)}</td>
                    <td className="py-2">
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
                    </td>
                    <td className="py-2 text-xs">
                      {new Date(o.createdAt).toLocaleString("en-BD")}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
          {r.orders.length === 0 && (
            <p className="py-8 text-center text-sm text-[var(--ink-muted)]">
              No orders assigned yet
            </p>
          )}
        </div>
      </AdminCard>
    </div>
  );
}
