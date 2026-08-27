"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  PageHeader,
  AdminCard,
  Badge,
  StatCard,
  Btn,
} from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import { Loader2, ChevronLeft } from "lucide-react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminDoctorDetailPage() {
  const params = useParams();
  const id = params.id as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminFetch(`/admin/doctors?id=${id}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Not found");
      return;
    }
    setData(json);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-red-600">{error}</p>
        <Link href="/admin/doctors" className="mt-3 inline-block text-[var(--forest)]">
          ← Back
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--forest)]" />
      </div>
    );
  }

  const d = data.doctor;
  const e = data.earnings;

  return (
    <div>
      <Link
        href="/admin/doctors"
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--forest)]"
      >
        <ChevronLeft className="h-4 w-4" /> All doctors
      </Link>
      <PageHeader
        title={d.name}
        subtitle={`${d.specialty} · BMDC ${d.bmdcNumber || "—"}`}
        actions={
          <>
            <Badge tone={d.isOnline ? "green" : "gray"}>
              {d.isOnline ? "Online" : "Offline"}
            </Badge>
            <Link href="/admin/doctors">
              <Btn variant="secondary">Manage list</Btn>
            </Link>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-4 sm:flex-row">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl">
          <Image src={d.image} alt="" fill className="object-cover object-top" sizes="112px" />
        </div>
        <div className="text-sm">
          <p>{d.hospital}</p>
          <p className="text-[var(--ink-muted)]">{d.languages}</p>
          <p className="text-[var(--ink-muted)]">
            {d.phone || "No phone"} · {d.email || "No email"}
          </p>
          <p className="mt-1 font-bold">
            Fee {formatPrice(d.fee)} · Platform cut {d.platformCutPct}%
          </p>
          {d.bio && (
            <p className="mt-2 max-w-xl text-xs text-[var(--ink-muted)]">{d.bio}</p>
          )}
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Completed" value={e.completedCount} />
        <StatCard label="Gross fees" value={formatPrice(e.gross)} />
        <StatCard label="Platform earn" value={formatPrice(e.platform)} />
        <StatCard
          label="Doctor earn"
          value={formatPrice(e.doctorShare)}
          accent="bg-emerald-500"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <h2 className="mb-3 font-bold">Weekly availability</h2>
          <div className="space-y-1">
            {d.schedules.map(
              (s: {
                id: string;
                dayOfWeek: number;
                startTime: string;
                endTime: string;
                slotMins: number;
                isActive: boolean;
              }) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-[var(--ivory)] px-3 py-2 text-sm"
                >
                  <span className="font-semibold w-12">
                    {DAY_NAMES[s.dayOfWeek]}
                  </span>
                  {s.isActive ? (
                    <span>
                      {s.startTime} – {s.endTime} · {s.slotMins}m slots
                    </span>
                  ) : (
                    <Badge tone="gray">Off</Badge>
                  )}
                </div>
              )
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="mb-3 font-bold">Consult status mix</h2>
          <div className="space-y-2">
            {Object.entries(e.byStatus as Record<string, number>).map(
              ([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between text-sm"
                >
                  <Badge
                    tone={
                      status === "COMPLETED"
                        ? "green"
                        : status === "CANCELLED"
                          ? "red"
                          : "amber"
                    }
                  >
                    {status}
                  </Badge>
                  <span className="font-bold">{count}</span>
                </div>
              )
            )}
            {Object.keys(e.byStatus).length === 0 && (
              <p className="text-sm text-[var(--ink-muted)]">No consultations yet</p>
            )}
          </div>
        </AdminCard>
      </div>

      <AdminCard className="mt-4">
        <h2 className="mb-3 font-bold">Recent consultations</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[10px] uppercase text-[var(--ink-muted)]">
              <tr>
                <th className="pb-2">#</th>
                <th className="pb-2">Patient</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Fee</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">When</th>
                <th className="pb-2">Rx</th>
              </tr>
            </thead>
            <tbody>
              {d.consultations.map(
                (c: {
                  id: string;
                  consultNumber: string;
                  patientName: string;
                  patientPhone: string;
                  type: string;
                  fee: number;
                  status: string;
                  createdAt: string;
                  prescription: { id: string } | null;
                }) => (
                  <tr key={c.id} className="border-t border-[var(--line)]">
                    <td className="py-2 font-mono text-xs">{c.consultNumber}</td>
                    <td className="py-2">
                      <p className="font-semibold">{c.patientName}</p>
                      <p className="text-[10px] text-[var(--ink-muted)]">
                        {c.patientPhone}
                      </p>
                    </td>
                    <td className="py-2 text-xs">{c.type}</td>
                    <td className="py-2 font-semibold">{formatPrice(c.fee)}</td>
                    <td className="py-2">
                      <Badge
                        tone={
                          c.status === "COMPLETED"
                            ? "green"
                            : c.status === "CANCELLED"
                              ? "red"
                              : "amber"
                        }
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-xs">
                      {new Date(c.createdAt).toLocaleString("en-BD")}
                    </td>
                    <td className="py-2">
                      {c.prescription ? (
                        <Link
                          href={`/prescriptions/${c.id}`}
                          className="text-xs font-bold text-[var(--forest)]"
                        >
                          View
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
