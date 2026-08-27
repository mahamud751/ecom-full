"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import Image from "next/image";
import Link from "next/link";
import { Package, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Order = {
  orderNumber: string;
  status: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  address: string;
  city: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    image: string;
  }[];
};

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/auth/orders", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--forest)]" />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white py-16 text-center shadow-sm">
        <Package className="mx-auto h-12 w-12 text-[var(--ink-muted)]" />
        <h2 className="mt-4 text-lg font-bold">No orders yet</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          When you place an order while signed in, it appears here.
        </p>
        <Link
          href="/store"
          className="mt-5 inline-flex rounded-full bg-[var(--forest-deep)] px-6 py-2.5 text-sm font-bold text-white"
        >
          Browse store
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">My orders</h2>
      {orders.map((o) => (
        <article
          key={o.orderNumber}
          className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--ivory)]/50 px-4 py-3">
            <div>
              <p className="font-bold text-[var(--ink)]">{o.orderNumber}</p>
              <p className="text-xs text-[var(--ink-muted)]">
                {new Date(o.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--forest-deep)] px-3 py-1 text-[11px] font-bold uppercase text-white">
                {o.status}
              </span>
              <span className="text-sm font-bold text-[var(--forest-deep)]">
                {formatPrice(o.total)}
              </span>
            </div>
          </div>
          <div className="space-y-3 p-4">
            {o.items.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--ivory)]">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain p-1"
                      sizes="56px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold">
                    {item.name}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>
              </div>
            ))}
            <p className="text-xs text-[var(--ink-muted)]">
              {o.paymentMethod} · {o.paymentStatus} · {o.address}, {o.city}
            </p>
            <Link
              href={`/track-order?order=${encodeURIComponent(o.orderNumber)}`}
              className="inline-block text-sm font-bold text-[var(--forest)] hover:underline"
            >
              Track order
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
