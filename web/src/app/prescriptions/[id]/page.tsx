"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ChevronLeft } from "lucide-react";
import {
  PrescriptionViewer,
  type PrescriptionViewData,
} from "@/components/consult/PrescriptionViewer";

export default function PrescriptionPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<PrescriptionViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(`/prescriptions/${id}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Not found");
        setData(json.prescription);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--forest)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container-main py-16 text-center">
        <p className="font-semibold text-red-600">
          {error || "Prescription not found"}
        </p>
        <Link
          href="/my-consultations"
          className="mt-4 inline-block text-sm font-semibold text-[var(--forest)]"
        >
          My consultations
        </Link>
      </div>
    );
  }

  return (
    <div className="container-main py-8 pb-16">
      <Link
        href={`/consultations/${data.consultation.consultNumber || id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-[var(--forest)] print:hidden"
      >
        <ChevronLeft className="h-4 w-4" /> Back to consultation
      </Link>
      <PrescriptionViewer data={data} />
      <div className="mt-8 text-center print:hidden">
        <Link
          href="/store"
          className="inline-flex rounded-xl bg-[var(--forest)] px-6 py-3 text-sm font-bold text-white"
        >
          Order medicines from store →
        </Link>
      </div>
    </div>
  );
}
