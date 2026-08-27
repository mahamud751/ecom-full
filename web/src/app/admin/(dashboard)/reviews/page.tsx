"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import Image from "next/image";
import {
  PageHeader,
  AdminCard,
  Btn,
  Badge,
  Input,
  Select,
  Empty,
  StatCard,
} from "@/components/admin/ui";
import { Loader2, Star, Check, X, Trash2 } from "lucide-react";

type Review = {
  id: string;
  authorName: string;
  authorPhone: string | null;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  isVerified: boolean;
  adminNote: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
    rating: number;
    reviewCount: number;
  };
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [status, setStatus] = useState("PENDING");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    const d = await adminFetch(`/admin/reviews?${params}`).then((r) => r.json());
    setReviews(d.reviews || []);
    setCounts(d.counts || { pending: 0, approved: 0, rejected: 0, total: 0 });
    setLoading(false);
  }, [status, q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, next: string) {
    await adminFetch("/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    void load();
  }

  async function toggleVerified(id: string, isVerified: boolean) {
    await adminFetch("/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isVerified: !isVerified }),
    });
    void load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    await adminFetch(`/admin/reviews?id=${id}`, { method: "DELETE" });
    void load();
  }

  return (
    <div>
      <PageHeader
        title="Product reviews"
        subtitle="Approve reviews before they appear on product pages"
        actions={
          <>
            <Input
              placeholder="Search author / product"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-44"
            />
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-36"
            >
              <option value="">All</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </Select>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Pending approval"
          value={counts.pending}
          accent="bg-amber-500"
          hint="Must approve to show publicly"
        />
        <StatCard label="Approved (live)" value={counts.approved} />
        <StatCard label="Rejected" value={counts.rejected} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--forest)]" />
        </div>
      ) : reviews.length === 0 ? (
        <Empty text="No reviews in this filter" />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <AdminCard key={r.id}>
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={r.product.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                    unoptimized={r.product.image.startsWith("/uploads/")}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={
                        r.status === "APPROVED"
                          ? "green"
                          : r.status === "PENDING"
                            ? "amber"
                            : "red"
                      }
                    >
                      {r.status}
                    </Badge>
                    {r.isVerified && <Badge tone="blue">Verified buy</Badge>}
                    <span className="flex items-center gap-0.5 text-xs font-bold">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < r.rating
                              ? "fill-[var(--gold)] text-[var(--gold)]"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold">{r.product.name}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    by <strong>{r.authorName}</strong>
                    {r.authorPhone ? ` · ${r.authorPhone}` : ""} ·{" "}
                    {new Date(r.createdAt).toLocaleString("en-BD")}
                  </p>
                  {r.title && (
                    <p className="mt-1 text-sm font-semibold">{r.title}</p>
                  )}
                  <p className="mt-1 text-sm leading-relaxed text-[var(--ink)]">
                    {r.body}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--ink-muted)]">
                    Product live rating: {r.product.rating} (
                    {r.product.reviewCount} approved)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
                  {r.status !== "APPROVED" && (
                    <Btn onClick={() => act(r.id, "APPROVED")}>
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Btn>
                  )}
                  {r.status !== "REJECTED" && (
                    <Btn
                      variant="secondary"
                      onClick={() => act(r.id, "REJECTED")}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Btn>
                  )}
                  {r.status === "APPROVED" && (
                    <Btn
                      variant="secondary"
                      onClick={() => act(r.id, "PENDING")}
                    >
                      Unpublish
                    </Btn>
                  )}
                  <Btn
                    variant="ghost"
                    onClick={() => toggleVerified(r.id, r.isVerified)}
                  >
                    {r.isVerified ? "Unverify" : "Mark verified"}
                  </Btn>
                  <Btn variant="danger" onClick={() => remove(r.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
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
