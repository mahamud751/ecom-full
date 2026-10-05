"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import {
  PageHeader,
  AdminCard,
  Btn,
  Input,
  Select,
  Badge,
  Empty,
  Pager,
  useListPage,
  type Pagination,
} from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  riderId: string | null;
  rider: { id: string; name: string; phone: string } | null;
  items: { name: string; quantity: number; price: number }[];
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<{ id: string; name: string; status: string }[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useListPage(`${status}|${q}`);
  const [pageInfo, setPageInfo] = useState<Pagination | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    params.set("page", String(page));
    const [o, r] = await Promise.all([
      adminFetch(`/admin/orders?${params}`).then((x) => x.json()),
      adminFetch("/admin/riders").then((x) => x.json()),
    ]);
    setOrders(o.orders || []);
    setPageInfo(o.pagination ?? null);
    setRiders(r.riders || []);
    setLoading(false);
  }, [status, q, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function update(
    id: string,
    patch: { status?: string; riderId?: string | null; paymentStatus?: string }
  ) {
    await adminFetch("/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    void load();
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Confirm, pack, assign rider, mark delivered"
        actions={
          <>
            <Input
              placeholder="Search order / phone"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-44"
            />
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-40"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--forest)]" />
        </div>
      ) : orders.length === 0 ? (
        <Empty text="No orders found" />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <AdminCard key={o.id}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-xs font-bold">{o.orderNumber}</p>
                    <Badge
                      tone={
                        o.status === "DELIVERED"
                          ? "green"
                          : o.status === "CANCELLED"
                            ? "red"
                            : o.status === "SHIPPED"
                              ? "blue"
                              : "amber"
                      }
                    >
                      {o.status}
                    </Badge>
                    <Badge
                      tone={o.paymentStatus === "PAID" ? "green" : "gray"}
                    >
                      {o.paymentStatus} · {o.paymentMethod}
                    </Badge>
                  </div>
                  <p className="mt-1 font-bold">{o.customerName}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {o.customerPhone} · {o.address}, {o.city}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    {o.items.map((i) => `${i.name} ×${i.quantity}`).join(" · ")}
                  </p>
                  <p className="mt-1 text-lg font-bold text-[var(--forest)]">
                    {formatPrice(o.total)}
                  </p>
                  <p className="text-[10px] text-[var(--ink-muted)]">
                    {new Date(o.createdAt).toLocaleString("en-BD")}
                    {o.rider ? ` · Rider: ${o.rider.name}` : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:min-w-[220px]">
                  <Select
                    label="Status"
                    value={o.status}
                    onChange={(e) => update(o.id, { status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Assign rider"
                    value={o.riderId || ""}
                    onChange={(e) =>
                      update(o.id, {
                        riderId: e.target.value || null,
                        status:
                          e.target.value && o.status === "CONFIRMED"
                            ? "PROCESSING"
                            : undefined,
                      })
                    }
                  >
                    <option value="">Unassigned</option>
                    {riders.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.status})
                      </option>
                    ))}
                  </Select>
                  <div className="flex gap-2">
                    <Btn
                      variant="secondary"
                      className="flex-1"
                      onClick={() =>
                        update(o.id, { paymentStatus: "PAID" })
                      }
                    >
                      Mark paid
                    </Btn>
                    <Btn
                      className="flex-1"
                      onClick={() => update(o.id, { status: "SHIPPED" })}
                    >
                      Ship
                    </Btn>
                  </div>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
      <Pager
        pagination={pageInfo}
        onPage={setPage}
        disabled={loading}
      />
    </div>
  );
}
