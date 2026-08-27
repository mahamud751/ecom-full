"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { apiFetch } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { useOrdersStore } from "@/lib/orders-store";
import { formatPrice } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import {
  Loader2,
  ShieldCheck,
  Upload,
  Tag,
  FileWarning,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuthStore } from "@/lib/auth-store";

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const setAuthOpen = useAuthStore((s) => s.setAuthOpen);
  const { items, subtotal, clearCart } = useCartStore();
  const saveOrder = useOrdersStore((s) => s.saveOrder);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [rxUrl, setRxUrl] = useState("");
  const [rxUploading, setRxUploading] = useState(false);
  const [needsRx, setNeedsRx] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    address: "",
    city: "Dhaka",
    area: "",
    notes: "",
    paymentMethod: "COD",
  });

  useEffect(() => setMounted(true), []);

  // Prefill from signed-in profile
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      customerName: f.customerName || user.name || "",
      customerPhone: f.customerPhone || user.phone || "",
      customerEmail: f.customerEmail || user.email || "",
      address: f.address || user.address || "",
      city: f.city || user.city || "Dhaka",
      area: f.area || user.area || "",
    }));
  }, [user]);

  // Detect Rx-required products in cart
  useEffect(() => {
    if (!items.length) {
      setNeedsRx(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/wishlist/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: items.map((i) => i.id) }),
        });
        // wishlist status doesn't return requiresRx — check via products store API fallback
        // Use simple cart flag: query each from search won't work. Use dedicated lightweight check.
      } catch {
        /* ignore */
      }
      // Fallback: fetch product details via orders validation happens server-side
      // Client: call a mini endpoint or mark from product pages — check with parallel product fetch
      try {
        const checks = await Promise.all(
          items.map(async (i) => {
            const r = await apiFetch(`/products/rx-check?id=${i.id}`);
            if (!r.ok) return false;
            const d = await r.json();
            return Boolean(d.requiresRx);
          })
        );
        if (!cancelled) setNeedsRx(checks.some(Boolean));
      } catch {
        if (!cancelled) setNeedsRx(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const total = useMemo(() => (mounted ? subtotal() : 0), [mounted, items, subtotal]);
  const delivery = total >= 999 ? 0 : total > 0 ? 60 : 0;
  const grand = Math.max(0, total + delivery - discount);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted">
        {t("checkout.loading")}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">{t("checkout.empty")}</h1>
        <Link
          href="/products"
          className="mt-4 inline-block font-semibold text-brand hover:underline"
        >
          {t("checkout.browse")}
        </Link>
      </div>
    );
  }

  async function applyCoupon() {
    setCouponMsg("");
    const res = await apiFetch("/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponInput, subtotal: total }),
    });
    const data = await res.json();
    if (!res.ok) {
      setDiscount(0);
      setAppliedCode(null);
      setCouponMsg(data.error || "Invalid coupon");
      return;
    }
    setDiscount(data.discount);
    setAppliedCode(data.code);
    setCouponMsg(`Applied · save ${formatPrice(data.discount)}`);
    trackEvent("coupon_applied", { code: data.code, discount: data.discount });
  }

  async function uploadRx(file: File) {
    setRxUploading(true);
    setError("");
    try {
      const f = new FormData();
      f.append("file", file);
      f.append("folder", "prescriptions");
      const res = await apiFetch("/upload", { method: "POST", body: f });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Upload failed");
      setRxUrl(d.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rx upload failed");
    } finally {
      setRxUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (needsRx && !rxUrl) {
      setError("Please upload a prescription for Rx medicines in your cart");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          couponCode: appliedCode,
          prescriptionUrl: rxUrl || undefined,
          items: items.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
            price: i.price,
            name: i.name,
            image: i.image,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order failed");
      const itemCount = items.reduce((s, i) => s + i.quantity, 0);
      saveOrder({
        orderNumber: data.orderNumber,
        total: data.total,
        createdAt: new Date().toISOString(),
        itemCount: data.itemCount || itemCount,
        status: data.status || "CONFIRMED",
      });
      trackEvent("purchase", {
        order_number: data.orderNumber,
        value: data.total,
      });
      clearCart();
      router.push(
        `/order-success?order=${data.orderNumber}&total=${data.total}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{t("checkout.title")}</h1>

      {!user && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold-soft)]/50 px-4 py-3">
          <p className="text-sm font-medium text-[var(--ink)]">
            Sign in for faster checkout & order history
          </p>
          <button
            type="button"
            onClick={() => setAuthOpen(true, "login")}
            className="rounded-full bg-[var(--forest-deep)] px-4 py-2 text-xs font-bold text-white"
          >
            Sign in / Sign up
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">{t("checkout.deliveryDetails")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium">
                  {t("checkout.fullName")}
                </label>
                <input
                  required
                  value={form.customerName}
                  onChange={(e) => update("customerName", e.target.value)}
                  className="w-full rounded-xl border border-border bg-brand-soft/40 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("checkout.phone")}
                </label>
                <input
                  required
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => update("customerPhone", e.target.value)}
                  className="w-full rounded-xl border border-border bg-brand-soft/40 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white"
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("checkout.email")}
                </label>
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => update("customerEmail", e.target.value)}
                  className="w-full rounded-xl border border-border bg-brand-soft/40 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("checkout.city")}
                </label>
                <select
                  required
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="w-full rounded-xl border border-border bg-brand-soft/40 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white"
                >
                  {[
                    "Dhaka",
                    "Chittagong",
                    "Sylhet",
                    "Rajshahi",
                    "Khulna",
                    "Barisal",
                    "Rangpur",
                    "Mymensingh",
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("checkout.area")}
                </label>
                <input
                  value={form.area}
                  onChange={(e) => update("area", e.target.value)}
                  className="w-full rounded-xl border border-border bg-brand-soft/40 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium">
                  {t("checkout.address")}
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  className="w-full resize-none rounded-xl border border-border bg-brand-soft/40 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white"
                />
              </div>
            </div>
          </section>

          {/* Prescription upload */}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
              <Upload className="h-5 w-5 text-brand" />
              {t("checkout.uploadRx")}
            </h2>
            {needsRx ? (
              <p className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
                {t("checkout.rxRequired")}
              </p>
            ) : (
              <p className="mb-3 text-xs text-muted">
                {t("checkout.rxOptional")}
              </p>
            )}
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadRx(f);
              }}
              className="block w-full text-sm"
            />
            {rxUploading && (
              <p className="mt-2 text-xs text-brand">{t("checkout.uploading")}</p>
            )}
            {rxUrl && (
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                {t("checkout.rxAttached")}
              </p>
            )}
            <p className="mt-2 text-[11px] text-muted">
              Licensed pharmacy · See{" "}
              <Link href="/compliance" className="font-semibold text-brand">
                pharmacy compliance
              </Link>
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">{t("checkout.payment")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  value: "COD",
                  label: t("checkout.cod"),
                  desc: t("checkout.codDesc"),
                },
                {
                  value: "bKash",
                  label: t("checkout.bkash"),
                  desc: t("checkout.bkashDesc"),
                },
              ].map((m) => (
                <label
                  key={m.value}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition ${
                    form.paymentMethod === m.value
                      ? "border-brand bg-brand-light"
                      : "border-border hover:border-brand/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.value}
                    checked={form.paymentMethod === m.value}
                    onChange={() => update("paymentMethod", m.value)}
                    className="sr-only"
                  />
                  <p className="font-semibold">{m.label}</p>
                  <p className="text-xs text-muted">{m.desc}</p>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-36 rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">{t("checkout.yourOrder")}</h2>
            <div className="max-h-52 space-y-3 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-brand-soft">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain p-0.5"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="mt-4 border-t border-border pt-4">
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium">
                <Tag className="h-4 w-4" /> {t("checkout.coupon")}
              </label>
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="CHOLBE10"
                  className="min-w-0 flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="rounded-xl bg-[var(--forest)] px-3 py-2 text-xs font-bold text-white"
                >
                  {t("checkout.apply")}
                </button>
              </div>
              {couponMsg && (
                <p
                  className={`mt-1 text-xs font-semibold ${
                    appliedCode ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {couponMsg}
                </p>
              )}
            </div>

            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <span>{t("checkout.subtotal")}</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>{t("checkout.delivery")}</span>
                <span>
                  {delivery === 0 ? (
                    <span className="font-semibold text-brand">
                      {t("cart.free")}
                    </span>
                  ) : (
                    formatPrice(delivery)
                  )}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>
                    {t("checkout.discount")}
                    {appliedCode ? ` (${appliedCode})` : ""}
                  </span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>{t("checkout.total")}</span>
                <span className="text-brand-deeper">{formatPrice(grand)}</span>
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-discount">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || rxUploading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> {t("checkout.placing")}
                </>
              ) : (
                t("checkout.placeOrder")
              )}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" />
              {t("checkout.secure")}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
