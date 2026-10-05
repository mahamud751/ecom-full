"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import {
  PageHeader,
  AdminCard,
  Btn,
  Badge,
  Empty,
  StatCard,
  Pager,
  useListPage,
  type Pagination,
} from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function AdminSettlementsPage() {
  const [rows, setRows] = useState<
    {
      id: string;
      settlementNo: string;
      consultCount: number;
      grossFees: number;
      platformCut: number;
      doctorShare: number;
      status: string;
      periodStart: string;
      periodEnd: string;
      doctor: { name: string; specialty: string };
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [page, setPage] = useListPage("");
  const [pageInfo, setPageInfo] = useState<Pagination | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await adminFetch(`/admin/settlements?page=${page}`).then((r) =>
      r.json(),
    );
    setRows(d.settlements || []);
    setPageInfo(d.pagination ?? null);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate() {
    setGenerating(true);
    await adminFetch("/admin/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setGenerating(false);
    void load();
  }

  async function setStatus(id: string, status: string) {
    await adminFetch("/admin/settlements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    void load();
  }

  const payable = rows
    .filter((r) => r.status !== "PAID")
    .reduce((s, r) => s + r.doctorShare, 0);

  return (
    <div>
      <PageHeader
        title="Doctor settlements"
        subtitle="Payout drafts from completed consults (platform cut vs doctor share)"
        actions={
          <Btn onClick={generate} disabled={generating}>
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            Generate last 30 days
          </Btn>
        }
      />
      <div className="mb-4">
        <StatCard
          label="Unpaid doctor share"
          value={formatPrice(payable)}
          hint={`${rows.length} settlement rows`}
        />
      </div>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--forest)]" />
        </div>
      ) : rows.length === 0 ? (
        <Empty text="No settlements — generate from completed consults" />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <AdminCard key={r.id} className="!p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="font-mono text-xs font-bold">
                      {r.settlementNo}
                    </span>
                    <Badge
                      tone={
                        r.status === "PAID"
                          ? "green"
                          : r.status === "APPROVED"
                            ? "blue"
                            : "amber"
                      }
                    >
                      {r.status}
                    </Badge>
                  </div>
                  <p className="font-bold">{r.doctor.name}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {r.doctor.specialty} · {r.consultCount} consults ·{" "}
                    {new Date(r.periodStart).toLocaleDateString()} –{" "}
                    {new Date(r.periodEnd).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-sm">
                    Gross {formatPrice(r.grossFees)} · Platform{" "}
                    {formatPrice(r.platformCut)} ·{" "}
                    <strong className="text-emerald-700">
                      Doctor {formatPrice(r.doctorShare)}
                    </strong>
                  </p>
                </div>
                <div className="flex gap-2">
                  {r.status === "DRAFT" && (
                    <Btn onClick={() => setStatus(r.id, "APPROVED")}>
                      Approve
                    </Btn>
                  )}
                  {r.status === "APPROVED" && (
                    <Btn onClick={() => setStatus(r.id, "PAID")}>Mark paid</Btn>
                  )}
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
