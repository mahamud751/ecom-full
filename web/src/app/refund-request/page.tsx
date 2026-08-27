"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import Link from "next/link";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n";

export default function RefundRequestPage() {
  const { t } = useI18n();
  const [form, setForm] = useState({
    orderNumber: "",
    phone: "",
    reason: "Damaged / wrong item",
    details: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDone(data.refund.requestNo);
      toast("Refund request submitted", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "info");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-main max-w-lg py-10 pb-20">
      <Link href="/" className="text-sm font-semibold text-[var(--forest)]">
        ← {t("common.home")}
      </Link>
      <h1 className="mt-4 flex items-center gap-2 font-serif text-3xl font-bold">
        <RotateCcw className="h-7 w-7 text-[var(--forest)]" />
        {t("refund.title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        {t("refund.policyFirst")}{" "}
        <Link href="/refund" className="font-semibold text-[var(--forest)]">
          {t("refund.policyLink")}
        </Link>{" "}
        {t("refund.policyAfter")}
      </p>

      {done ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="font-bold text-emerald-900">Request received</p>
          <p className="mt-2 font-mono text-lg font-bold">{done}</p>
          <p className="mt-2 text-sm text-emerald-800">
            Our team will review and contact you on the order phone.
          </p>
          <Link
            href="/track-order"
            className="mt-4 inline-block text-sm font-semibold text-[var(--forest)]"
          >
            Track order →
          </Link>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="mt-8 space-y-3 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm"
        >
          <input
            required
            placeholder="Order number (CHB-…)"
            value={form.orderNumber}
            onChange={(e) =>
              setForm({ ...form, orderNumber: e.target.value.toUpperCase() })
            }
            className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--forest)]"
          />
          <input
            required
            placeholder="Phone used on order"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--forest)]"
          />
          <select
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--forest)]"
          >
            <option>Damaged / wrong item</option>
            <option>Missing items</option>
            <option>Expired product</option>
            <option>Other</option>
          </select>
          <textarea
            rows={3}
            placeholder="Details (optional)"
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--forest)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--forest)] py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit refund request
          </button>
        </form>
      )}
    </div>
  );
}
