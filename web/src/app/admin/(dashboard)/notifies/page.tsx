"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import Image from "next/image";
import {
  PageHeader,
  AdminCard,
  Btn,
  Badge,
  Select,
  Empty,
  StatCard,
} from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Notify = {
  id: string;
  type: string;
  contact: string;
  contactType: string;
  targetPrice: number | null;
  status: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    stock: number;
  };
};

export default function AdminNotifiesPage() {
  const [notifies, setNotifies] = useState<Notify[]>([]);
  const [counts, setCounts] = useState({ active: 0, ready: 0, sent: 0 });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const q = status ? `?status=${status}` : "";
    const d = await adminFetch(`/admin/notifies${q}`).then((r) => r.json());
    setNotifies(d.notifies || []);
    setCounts(d.counts || { active: 0, ready: 0, sent: 0 });
    setLoading(false);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setNotifyStatus(id: string, next: string) {
    await adminFetch("/admin/notifies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    void load();
  }

  return (
    <div>
      <PageHeader
        title="Product alerts"
        subtitle="Back-in-stock & price-drop requests from customers"
        actions={
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-40"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="READY">READY</option>
            <option value="SENT">SENT</option>
            <option value="CANCELLED">CANCELLED</option>
          </Select>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Waiting" value={counts.active} />
        <StatCard
          label="Ready to send"
          value={counts.ready}
          accent="bg-emerald-500"
        />
        <StatCard label="Sent" value={counts.sent} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--forest)]" />
        </div>
      ) : notifies.length === 0 ? (
        <Empty text="No product alerts yet" />
      ) : (
        <div className="space-y-2">
          {notifies.map((n) => (
            <AdminCard key={n.id} className="!p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={n.product.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized={n.product.image.startsWith("/uploads/")}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={n.type === "STOCK" ? "blue" : "amber"}>
                      {n.type}
                    </Badge>
                    <Badge
                      tone={
                        n.status === "READY"
                          ? "green"
                          : n.status === "ACTIVE"
                            ? "gray"
                            : "blue"
                      }
                    >
                      {n.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 font-semibold text-sm">
                    {n.product.name}
                  </p>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    {n.contact} · stock {n.product.stock} ·{" "}
                    {formatPrice(n.product.price)}
                    {n.targetPrice != null
                      ? ` · target ${formatPrice(n.targetPrice)}`
                      : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {n.status === "ACTIVE" && (
                    <Btn onClick={() => setNotifyStatus(n.id, "READY")}>
                      Mark ready
                    </Btn>
                  )}
                  {n.status === "READY" && (
                    <Btn onClick={() => setNotifyStatus(n.id, "SENT")}>
                      Mark sent
                    </Btn>
                  )}
                  <Btn
                    variant="ghost"
                    onClick={() => setNotifyStatus(n.id, "CANCELLED")}
                  >
                    Cancel
                  </Btn>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
