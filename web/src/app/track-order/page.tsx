"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Package,
  Search,
  CheckCircle2,
  Circle,
  Loader2,
  MapPin,
} from "lucide-react";
import { useOrdersStore } from "@/lib/orders-store";
import { apiFetch } from "@/lib/api-client";
import { formatPrice } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderInvoiceButton } from "@/components/orders/OrderInvoiceButton";

type TrackResult = {
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerPhoneMasked?: string;
  address: string;
  city: string;
  area?: string | null;
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  paymentStatus?: string;
  couponCode?: string | null;
  createdAt: string;
  items: { name: string; quantity: number; price: number; image: string }[];
  timeline: {
    key: string;
    label: string;
    desc: string;
    done: boolean;
    current: boolean;
  }[];
};

export default function TrackOrderPage() {
  const { orders } = useOrdersStore();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const q = searchParams.get("order");
    if (q) {
      setOrderNumber(q);
      void lookup(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function lookup(num: string) {
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await apiFetch(
        `/orders?order=${encodeURIComponent(num.trim())}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Not found");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (orderNumber.trim()) lookup(orderNumber);
  }

  return (
    <div className="container-main pb-20 pt-6 lg:pb-12">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
          Track your order
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Enter your order number to see live status
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mb-8 flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5"
      >
        <div className="relative flex-1">
          <Package className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. CHB-XXXX-123"
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--ivory)] py-3 pl-10 pr-4 text-sm outline-none focus:border-[var(--forest)] focus:bg-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !orderNumber.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--forest-deep)] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Track
        </button>
      </form>

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && (
        <div className="mb-10 grid gap-6 lg:grid-cols-5">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm lg:col-span-3">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--gold-deep)]">
                  Order
                </p>
                <p className="font-mono text-lg font-bold">
                  {result.orderNumber}
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  {new Date(result.createdAt).toLocaleString()}
                </p>
              </div>
              <span className="rounded-full bg-[var(--gold-soft)] px-3 py-1 text-xs font-bold text-[var(--gold-deep)]">
                {result.status}
              </span>
            </div>

            <ol className="space-y-0">
              {result.timeline.map((step, i) => (
                <li key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {step.done ? (
                      <CheckCircle2 className="h-5 w-5 text-[var(--forest)]" />
                    ) : (
                      <Circle className="h-5 w-5 text-[var(--line)]" />
                    )}
                    {i < result.timeline.length - 1 && (
                      <div
                        className={`my-1 w-0.5 flex-1 min-h-[28px] ${
                          step.done ? "bg-[var(--forest)]" : "bg-[var(--line)]"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-5">
                    <p
                      className={`text-sm font-bold ${
                        step.current
                          ? "text-[var(--forest)]"
                          : step.done
                            ? "text-[var(--ink)]"
                            : "text-[var(--ink-muted)]"
                      }`}
                    >
                      {step.label}
                      {step.current && (
                        <span className="ml-2 text-[10px] font-semibold uppercase text-[var(--gold-deep)]">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="flex items-start gap-2 rounded-xl bg-[var(--ivory)] p-3 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--forest)]" />
              <div>
                <p className="font-semibold">{result.customerName}</p>
                <p className="text-[var(--ink-muted)]">
                  {result.address}, {result.city}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm lg:col-span-2">
            <h3 className="mb-3 font-bold">Items</h3>
            <div className="max-h-64 space-y-3 overflow-y-auto">
              {result.items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--ivory)]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain p-0.5"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">
                      {item.name}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      ×{item.quantity} · {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-[var(--line)] pt-3 text-sm">
              <div className="flex justify-between text-[var(--ink-muted)]">
                <span>Subtotal</span>
                <span>{formatPrice(result.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[var(--ink-muted)]">
                <span>Delivery</span>
                <span>
                  {result.deliveryFee === 0
                    ? "FREE"
                    : formatPrice(result.deliveryFee)}
                </span>
              </div>
              {(result.discount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>
                    Discount
                    {result.couponCode ? ` (${result.couponCode})` : ""}
                  </span>
                  <span>-{formatPrice(result.discount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-[var(--forest)]">
                  {formatPrice(result.total)}
                </span>
              </div>
              <p className="pt-1 text-xs text-[var(--ink-muted)]">
                Payment: {result.paymentMethod}
              </p>
            </div>
            <OrderInvoiceButton
              className="mt-4 border-t border-[var(--line)] pt-4"
              order={{
                orderNumber: result.orderNumber,
                customerName: result.customerName,
                customerPhone: result.customerPhone,
                address: result.address,
                city: result.city,
                area: result.area,
                subtotal: result.subtotal,
                deliveryFee: result.deliveryFee,
                discount: result.discount,
                total: result.total,
                paymentMethod: result.paymentMethod,
                paymentStatus: result.paymentStatus,
                status: result.status,
                couponCode: result.couponCode,
                createdAt: result.createdAt,
                items: result.items.map((i) => ({
                  name: i.name,
                  quantity: i.quantity,
                  price: i.price,
                })),
              }}
            />
          </div>
        </div>
      )}

      {/* Recent orders from this device */}
      {mounted && (
        <section>
          <h2 className="mb-3 font-serif text-lg font-semibold">
            Recent orders on this device
          </h2>
          {orders.length === 0 ? (
            !result && (
              <EmptyState
                icon={Package}
                title="No recent orders saved"
                description="After checkout, your order number will appear here for quick tracking."
                actionHref="/store"
                actionLabel="Start shopping"
              />
            )
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {orders.map((o) => (
                <button
                  key={o.orderNumber}
                  type="button"
                  onClick={() => {
                    setOrderNumber(o.orderNumber);
                    lookup(o.orderNumber);
                  }}
                  className="rounded-2xl border border-[var(--line)] bg-white p-4 text-left shadow-sm transition hover:border-[var(--forest)]"
                >
                  <p className="font-mono text-sm font-bold">{o.orderNumber}</p>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    {new Date(o.createdAt).toLocaleDateString()} · {o.itemCount}{" "}
                    items
                  </p>
                  <p className="mt-1 font-semibold text-[var(--forest)]">
                    {formatPrice(o.total)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <p className="mt-8 text-center text-sm text-[var(--ink-muted)]">
        Need help?{" "}
        <a href="tel:16778" className="font-semibold text-[var(--forest)]">
          Call 16778
        </a>{" "}
        ·{" "}
        <Link href="/store" className="font-semibold text-[var(--forest)]">
          Continue shopping
        </Link>
      </p>
    </div>
  );
}
