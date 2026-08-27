"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Star, Loader2, BadgeCheck, MessageSquarePlus } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  isVerified: boolean;
  createdAt: string;
};

function Stars({
  value,
  size = "sm",
  onChange,
}: {
  value: number;
  size?: "sm" | "md";
  onChange?: (n: number) => void;
}) {
  const s = size === "md" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={cn(!onChange && "cursor-default")}
          aria-label={`${n} stars`}
        >
          <Star
            className={cn(
              s,
              n <= value
                ? "fill-[var(--gold)] text-[var(--gold)]"
                : "fill-gray-200 text-gray-200",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({
  productId,
  productName,
  initialRating,
  initialCount,
}: {
  productId: string;
  productName: string;
  initialRating: number;
  initialCount: number;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [breakdown, setBreakdown] = useState<
    { rating: number; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    authorName: "",
    authorPhone: "",
    rating: 5,
    title: "",
    body: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/reviews?productId=${encodeURIComponent(productId)}`,
      );
      const data = await res.json();
      setReviews(data.reviews || []);
      setBreakdown(data.breakdown || []);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch("/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast(data.message || "Review submitted for approval", "success");
      setShowForm(false);
      setForm({
        authorName: "",
        authorPhone: "",
        rating: 5,
        title: "",
        body: "",
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "info");
    } finally {
      setSubmitting(false);
    }
  }

  const totalApproved = reviews.length;
  const avg =
    totalApproved > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / totalApproved
      : initialRating;

  const counts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: breakdown.find((b) => b.rating === rating)?.count || 0,
  }));
  const maxBar = Math.max(1, ...counts.map((c) => c.count));

  return (
    <section className="mt-10 rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Customer reviews</h2>
          <p className="mt-1 text-sm text-muted">
            Only admin-approved reviews are shown publicly
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--forest)] px-4 py-2.5 text-xs font-bold text-white hover:bg-[var(--forest-deep)]"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Write a review
        </button>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-[160px_1fr]">
        <div className="rounded-2xl bg-[var(--ivory)] p-4 text-center">
          <p className="text-4xl font-black text-[var(--forest-deep)]">
            {avg.toFixed(1)}
          </p>
          <div className="mt-1 flex justify-center">
            <Stars value={Math.round(avg)} />
          </div>
          <p className="mt-1 text-xs text-muted">
            {totalApproved || initialCount} approved review
            {(totalApproved || initialCount) !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="space-y-1.5">
          {counts.map((c) => (
            <div key={c.rating} className="flex items-center gap-2 text-xs">
              <span className="w-8 font-semibold">{c.rating}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[var(--gold)]"
                  style={{ width: `${(c.count / maxBar) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-muted">{c.count}</span>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="mb-8 space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--ivory)] p-4 sm:p-5"
        >
          <p className="text-sm font-bold">Review: {productName}</p>
          <p className="text-xs text-muted">
            Your review is pending until our team approves it.
          </p>
          <div>
            <span className="mb-1 block text-xs font-semibold text-muted">
              Your rating *
            </span>
            <Stars
              value={form.rating}
              size="md"
              onChange={(n) => setForm({ ...form, rating: n })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-muted">
              Name *
              <input
                required
                value={form.authorName}
                onChange={(e) =>
                  setForm({ ...form, authorName: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--forest)]"
              />
            </label>
            <label className="block text-xs font-semibold text-muted">
              Phone (optional)
              <input
                value={form.authorPhone}
                onChange={(e) =>
                  setForm({ ...form, authorPhone: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--forest)]"
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-muted">
            Title (optional)
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Great for dry skin"
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--forest)]"
            />
          </label>
          <label className="block text-xs font-semibold text-muted">
            Your review *
            <textarea
              required
              rows={4}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Share your experience with this product…"
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--forest)]"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-[var(--line)] px-4 py-2 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1 rounded-xl bg-[var(--forest)] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit for approval
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--forest)]" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--line)] py-10 text-center text-sm text-muted">
          No approved reviews yet. Be the first to review this product.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-[var(--line)] bg-[var(--ivory)]/50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--forest)] text-xs font-bold text-white">
                    {r.authorName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{r.authorName}</p>
                    <p className="text-[10px] text-muted">
                      {new Date(r.createdAt).toLocaleDateString("en-BD", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  {r.isVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
              {r.title && (
                <p className="mt-2 text-sm font-semibold">{r.title}</p>
              )}
              <p className="mt-1 text-sm leading-relaxed text-[var(--ink)]">
                {r.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
