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
  StatCard,
  Pager,
  useListPage,
  type Pagination,
} from "@/components/admin/ui";
import { Loader2 } from "lucide-react";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<
    {
      id: string;
      ticketNo: string;
      name: string;
      phone: string;
      subject: string;
      message: string;
      status: string;
      orderNumber: string | null;
      createdAt: string;
    }[]
  >([]);
  const [open, setOpen] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useListPage(status);
  const [pageInfo, setPageInfo] = useState<Pagination | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    const d = await adminFetch(`/admin/support?${params}`).then((r) => r.json());
    setTickets(d.tickets || []);
    setPageInfo(d.pagination ?? null);
    setOpen(d.open || 0);
    setLoading(false);
  }, [status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setTicketStatus(id: string, next: string) {
    await adminFetch("/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    void load();
  }

  return (
    <div>
      <PageHeader
        title="Support tickets"
        subtitle="Customer messages from contact / support form"
        actions={
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="">All</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </Select>
        }
      />
      <div className="mb-4">
        <StatCard label="Open / in progress" value={open} />
      </div>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--forest)]" />
        </div>
      ) : tickets.length === 0 ? (
        <Empty text="No tickets" />
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <AdminCard key={t.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="font-mono text-xs font-bold">{t.ticketNo}</span>
                    <Badge
                      tone={
                        t.status === "OPEN"
                          ? "amber"
                          : t.status === "RESOLVED"
                            ? "green"
                            : "blue"
                      }
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="mt-1 font-bold">{t.subject}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {t.name} · {t.phone}
                    {t.orderNumber ? ` · ${t.orderNumber}` : ""}
                  </p>
                  <p className="mt-2 text-sm">{t.message}</p>
                </div>
                <Select
                  value={t.status}
                  onChange={(e) => setTicketStatus(t.id, e.target.value)}
                  className="w-40"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </Select>
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
