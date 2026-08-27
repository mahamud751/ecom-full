"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  Video,
  Phone,
  FileText,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { AgoraCallRoom } from "@/components/consult/AgoraCallRoom";
import { statusColor, statusLabel } from "@/lib/consult-utils";
import { formatPrice, cn } from "@/lib/utils";

type Consultation = {
  id: string;
  consultNumber: string;
  status: string;
  type: "VIDEO" | "AUDIO";
  fee: number;
  isEmergency?: boolean;
  scheduledAt: string | null;
  patientName: string;
  patientPhone: string;
  symptoms: string | null;
  doctor: {
    id: string;
    slug: string;
    name: string;
    specialty: string;
    image: string;
    hospital: string | null;
  };
  prescription: { id: string } | null;
};

export default function ConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [consult, setConsult] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inCall, setInCall] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/consultations/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Not found");
      setConsult(data.consultation);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  // Emergency: auto-enter call room so patient is in channel while doctor gets ring
  useEffect(() => {
    if (!consult) return;
    if (
      consult.isEmergency &&
      ["PENDING", "CONFIRMED", "IN_CALL"].includes(consult.status)
    ) {
      setInCall(true);
    }
  }, [consult?.id, consult?.isEmergency, consult?.status]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--forest)]" />
      </div>
    );
  }

  if (error || !consult) {
    return (
      <div className="container-main py-16 text-center">
        <p className="font-semibold text-red-600">{error || "Not found"}</p>
        <Link href="/doctors" className="mt-4 inline-block text-[var(--forest)]">
          Back to doctors
        </Link>
      </div>
    );
  }

  const canJoin = ["PENDING", "CONFIRMED", "IN_CALL"].includes(consult.status);
  const isDone = consult.status === "COMPLETED";

  return (
    <div className="container-main py-8 pb-20">
      <button
        type="button"
        onClick={() => router.push("/my-consultations")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--forest)]"
      >
        <ArrowLeft className="h-4 w-4" /> My consultations
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-[var(--ink-muted)]">
            {consult.consultNumber}
          </p>
          <h1 className="text-2xl font-bold text-[var(--ink)]">
            Consultation with {consult.doctor.name}
          </h1>
          <p className="text-sm text-[var(--ink-muted)]">
            {consult.doctor.specialty}
            {consult.doctor.hospital ? ` · ${consult.doctor.hospital}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            statusColor(consult.status)
          )}
        >
          {statusLabel(consult.status)}
        </span>
      </div>

      {inCall && canJoin ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <AgoraCallRoom
            consultationId={consult.id}
            role="patient"
            onCallEnd={() => {
              setInCall(false);
              void load();
            }}
          />
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <h2 className="font-bold">During the call</h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--ink-muted)]">
              <li>· Stay in a quiet place with good light</li>
              <li>· Allow camera & microphone access</li>
              <li>· Describe symptoms clearly</li>
              <li>· Doctor will issue e-prescription after call</li>
            </ul>
            {consult.symptoms && (
              <div className="mt-4 rounded-xl bg-[var(--ivory)] p-3 text-sm">
                <p className="text-xs font-semibold text-[var(--ink-muted)]">
                  Your symptoms
                </p>
                <p className="mt-1">{consult.symptoms}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <div className="flex gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-[var(--brand-soft)]">
                <Image
                  src={consult.doctor.image}
                  alt={consult.doctor.name}
                  fill
                  className="object-cover object-top"
                  sizes="80px"
                />
              </div>
              <div>
                <p className="font-bold text-lg">{consult.doctor.name}</p>
                <p className="text-sm text-[var(--forest)]">
                  {consult.doctor.specialty}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-[var(--ink-muted)]">
                  {consult.type === "VIDEO" ? (
                    <Video className="h-3.5 w-3.5" />
                  ) : (
                    <Phone className="h-3.5 w-3.5" />
                  )}
                  {consult.type} · {formatPrice(consult.fee)}
                </p>
                {consult.scheduledAt && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-[var(--ink-muted)]">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(consult.scheduledAt).toLocaleString("en-BD")}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[var(--ivory)] p-3 text-sm">
                <p className="text-xs text-[var(--ink-muted)]">Patient</p>
                <p className="font-semibold">{consult.patientName}</p>
                <p className="text-xs">{consult.patientPhone}</p>
              </div>
              <div className="rounded-xl bg-[var(--ivory)] p-3 text-sm">
                <p className="text-xs text-[var(--ink-muted)]">Status</p>
                <p className="font-semibold">{statusLabel(consult.status)}</p>
                {consult.status === "PENDING" && (
                  <p className="mt-1 text-xs text-amber-700">
                    {consult.isEmergency
                      ? "Calling emergency doctor… stay on this page."
                      : "Waiting for doctor. Join the room when ready."}
                  </p>
                )}
              </div>
            </div>

            {canJoin && (
              <button
                type="button"
                onClick={() => setInCall(true)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--forest)] py-3.5 text-sm font-bold text-white hover:bg-[var(--forest-deep)]"
              >
                {consult.type === "VIDEO" ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <Phone className="h-4 w-4" />
                )}
                {consult.isEmergency
                  ? "Enter call (doctor is being notified)"
                  : `Join ${consult.type === "VIDEO" ? "video" : "audio"} call`}
              </button>
            )}

            {isDone && consult.prescription && (
              <Link
                href={`/prescriptions/${consult.id}`}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] py-3.5 text-sm font-bold text-[var(--forest-deep)]"
              >
                <FileText className="h-4 w-4" />
                View & download prescription
              </Link>
            )}

            {isDone && !consult.prescription && (
              <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Consultation completed. Prescription will appear here when the
                doctor issues it.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
              <h2 className="font-bold">How it works</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-[var(--ink-muted)]">
                <li>Join the secure Agora call room</li>
                <li>Doctor joins from the doctor portal</li>
                <li>Consult with audio + video as needed</li>
                <li>Receive e-prescription · download PDF · print</li>
                <li>
                  Order medicines from{" "}
                  <Link href="/store" className="font-semibold text-[var(--forest)]">
                    Ahona Store
                  </Link>
                </li>
              </ol>
            </div>
            <Link
              href={`/doctors/${consult.doctor.slug}`}
              className="block rounded-2xl border border-[var(--line)] bg-white p-4 text-center text-sm font-semibold text-[var(--forest)]"
            >
              Doctor profile →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
