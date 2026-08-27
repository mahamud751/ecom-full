"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Search, FileText, Video, Phone } from "lucide-react";
import { statusColor, statusLabel } from "@/lib/consult-utils";
import { apiFetch } from "@/lib/api-client";
import { cn, formatPrice } from "@/lib/utils";

type Row = {
  id: string;
  consultNumber: string;
  status: string;
  type: string;
  fee: number;
  scheduledAt: string | null;
  createdAt: string;
  patientName: string;
  doctor: {
    name: string;
    specialty: string;
    image: string;
    slug: string;
  };
  prescription: { id: string } | null;
};

export default function MyConsultationsPage() {
  const [phone, setPhone] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("htp_patient_phone");
      if (saved) setPhone(saved);
    } catch {
      /* ignore */
    }
  }, []);

  async function load(e?: React.FormEvent) {
    e?.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      localStorage.setItem("htp_patient_phone", phone.trim());
      const res = await apiFetch(
        `/consultations?phone=${encodeURIComponent(phone.trim())}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setRows(data.consultations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (phone.trim().length >= 8) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container-main py-8 pb-16">
      <div className="mb-8 max-w-xl">
        <h1 className="font-serif text-3xl font-bold text-[var(--ink)]">
          My consultations
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Enter the phone number used when booking to see calls & prescriptions
        </p>
      </div>

      <form
        onSubmit={load}
        className="mb-8 flex max-w-md flex-col gap-2 sm:flex-row"
      >
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          inputMode="tel"
          className="flex-1 rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-[var(--forest)]"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--forest)] px-5 py-2.5 text-sm font-bold text-white"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Find
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {searched && !loading && rows.length === 0 && (
        <div className="rounded-2xl border border-[var(--line)] bg-white py-16 text-center">
          <p className="font-semibold">No consultations found</p>
          <Link
            href="/doctors"
            className="mt-3 inline-block text-sm font-semibold text-[var(--forest)]"
          >
            Book a doctor →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {rows.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-white p-4 sm:flex-row sm:items-center"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--brand-soft)]">
              <Image
                src={c.doctor.image}
                alt={c.doctor.name}
                fill
                className="object-cover object-top"
                sizes="56px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">{c.doctor.name}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    statusColor(c.status),
                  )}
                >
                  {statusLabel(c.status)}
                </span>
              </div>
              <p className="text-sm text-[var(--forest)]">
                {c.doctor.specialty}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
                <span className="font-mono">{c.consultNumber}</span>
                <span className="flex items-center gap-0.5">
                  {c.type === "VIDEO" ? (
                    <Video className="h-3 w-3" />
                  ) : (
                    <Phone className="h-3 w-3" />
                  )}
                  {c.type}
                </span>
                <span>{formatPrice(c.fee)}</span>
                <span>
                  {new Date(c.scheduledAt || c.createdAt).toLocaleString(
                    "en-BD",
                  )}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/consultations/${c.id}`}
                className="rounded-lg bg-[var(--forest)] px-3 py-2 text-xs font-bold text-white"
              >
                Open
              </Link>
              {c.prescription && (
                <Link
                  href={`/prescriptions/${c.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-bold"
                >
                  <FileText className="h-3.5 w-3.5" /> Rx
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
