"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import {
  PageHeader,
  AdminCard,
  Btn,
  Badge,
  Select,
  Empty,
  Pager,
  useListPage,
  type Pagination,
} from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<
    {
      id: string;
      requestNo: string;
      reason: string;
      details: string | null;
      status: string;
      refundAmount: number | null;
      createdAt: string;
      order: {
        orderNumber: string;
        customerName: string;
        customerPhone: string;
        total: number;
        status: string;
      };
    }[]
  >([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useListPage(status);
  const [pageInfo, setPageInfo] = useState<Pagination | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    const d = await adminFetch(`/admin/refunds?${params}`).then((r) => r.json());
    setRefunds(d.refunds || []);
    setPageInfo(d.pagination ?? null);
    setLoading(false);
  }, [status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, next: string) {
    await adminFetch("/admin/refunds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    void load();
  }

  return (
    <div>
      <PageHeader
        title="Refund requests"
        subtitle="Customer return / refund claims"
        actions={
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="">All</option>
            <option value="REQUESTED">REQUESTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="REFUNDED">REFUNDED</option>
          </Select>
        }
      />
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--forest)]" />
        </div>
      ) : refunds.length === 0 ? (
        <Empty text="No refund requests" />
      ) : (
        <div className="space-y-2">
          {refunds.map((r) => (
            <AdminCard key={r.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="font-mono text-xs font-bold">
                      {r.requestNo}
                    </span>
                    <Badge
                      tone={
                        r.status === "REFUNDED" || r.status === "APPROVED"
                          ? "green"
                          : r.status === "REJECTED"
                            ? "red"
                            : "amber"
                      }
                    >
                      {r.status}
                    </Badge>
                  </div>
                  <p className="mt-1 font-bold">{r.order.orderNumber}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {r.order.customerName} · {r.order.customerPhone} · order{" "}
                    {formatPrice(r.order.total)}
                  </p>
                  <p className="mt-2 text-sm">
                    <strong>{r.reason}</strong>
                    {r.details ? ` — ${r.details}` : ""}
                  </p>
                  {r.refundAmount != null && (
                    <p className="text-sm font-semibold text-[var(--forest)]">
                      Refund amount: {formatPrice(r.refundAmount)}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.status === "REQUESTED" && (
                    <>
                      <Btn onClick={() => act(r.id, "APPROVED")}>Approve</Btn>
                      <Btn variant="danger" onClick={() => act(r.id, "REJECTED")}>
                        Reject
                      </Btn>
                    </>
                  )}
                  {r.status === "APPROVED" && (
                    <Btn onClick={() => act(r.id, "REFUNDED")}>Mark refunded</Btn>
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
