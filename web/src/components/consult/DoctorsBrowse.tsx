"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Star,
  Video,
  Phone,
  Search,
  Calendar,
  BadgeCheck,
  Zap,
} from "lucide-react";
import type { DoctorCard } from "@/lib/doctors-data";
import { formatPrice } from "@/lib/utils";
import { BookConsultModal, type BookDoctor } from "./BookConsultModal";

type Props = {
  initialDoctors: DoctorCard[];
  specialties: string[];
  initialSpecialty: string;
  initialQuery: string;
  initialAvailableOnly: boolean;
};

export function DoctorsBrowse({
  initialDoctors,
  specialties,
  initialSpecialty,
  initialQuery,
  initialAvailableOnly,
}: Props) {
  const [spec, setSpec] = useState(initialSpecialty);
  const [q, setQ] = useState(initialQuery);
  const [availableOnly, setAvailableOnly] = useState(initialAvailableOnly);
  const [booking, setBooking] = useState<{
    doctor: BookDoctor;
    type: "VIDEO" | "AUDIO";
  } | null>(null);

  const filtered = useMemo(() => {
    return initialDoctors.filter((d) => {
      const matchSpec = spec === "All" || d.specialty === spec;
      const matchQ =
        !q.trim() ||
        d.name.toLowerCase().includes(q.toLowerCase()) ||
        d.specialty.toLowerCase().includes(q.toLowerCase()) ||
        (d.hospital || "").toLowerCase().includes(q.toLowerCase());
      const matchAvail = !availableOnly || d.availableNow;
      return matchSpec && matchQ && matchAvail;
    });
  }, [initialDoctors, spec, q, availableOnly]);

  const emergencyDocs = filtered.filter((d) => d.isEmergency);
  const normalDocs = filtered.filter((d) => !d.isEmergency);

  function openBook(doc: DoctorCard, type: "VIDEO" | "AUDIO") {
    setBooking({
      doctor: {
        id: doc.id,
        slug: doc.slug,
        name: doc.name,
        specialty: doc.specialty,
        fee: doc.fee,
        emergencyFee: doc.emergencyFee,
        isEmergency: doc.isEmergency,
        emergencyAvailable: doc.emergencyAvailable,
        availableNow: doc.availableNow,
        nextSlots: doc.nextSlots,
        image: doc.image,
        hospital: doc.hospital,
      },
      type,
    });
  }

  return (
    <>
      <div className="sticky top-[72px] z-30 border-b border-[var(--line)] bg-white/95 backdrop-blur md:top-[80px]">
        <div className="container-main space-y-3 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, specialty, hospital…"
                className="w-full rounded-xl border border-[var(--line)] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--forest)]"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm font-medium">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="accent-[var(--forest)]"
              />
              Available now
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {specialties.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpec(s)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  spec === s
                    ? "bg-[var(--forest)] text-white"
                    : "border border-[var(--line)] bg-white text-gray-700 hover:border-[var(--forest)]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-main py-8">
        <p className="mb-4 text-sm text-[var(--ink-muted)]">
          Showing <strong className="text-[var(--ink)]">{filtered.length}</strong>{" "}
          doctors
          {spec !== "All" ? ` in ${spec}` : ""}
          {availableOnly ? " · available now" : ""}
        </p>

        {emergencyDocs.length > 0 && (
          <section className="mb-8">
            <div className="mb-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-white to-white px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-red-700">
                <Zap className="h-4 w-4" />
                Emergency doctors — instant connect (no schedule)
              </h2>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                Online emergency GPs join the queue immediately. Choose audio or
                video after booking.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {emergencyDocs.map((doc) => (
                <DoctorListCard
                  key={doc.id}
                  doc={doc}
                  onBook={openBook}
                  emergency
                />
              ))}
            </div>
          </section>
        )}

        {normalDocs.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-bold text-[var(--ink)]">
              Specialists — book a slot, then audio/video
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {normalDocs.map((doc) => (
                <DoctorListCard key={doc.id} doc={doc} onBook={openBook} />
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-[var(--line)] bg-white py-16 text-center">
            <p className="font-semibold">No doctors found</p>
            <button
              type="button"
              onClick={() => {
                setSpec("All");
                setQ("");
                setAvailableOnly(false);
              }}
              className="mt-3 text-sm font-semibold text-[var(--forest)]"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {booking && (
        <BookConsultModal
          doctor={booking.doctor}
          defaultType={booking.type}
          onClose={() => setBooking(null)}
        />
      )}
    </>
  );
}

function DoctorListCard({
  doc,
  onBook,
  emergency,
}: {
  doc: DoctorCard;
  onBook: (d: DoctorCard, t: "VIDEO" | "AUDIO") => void;
  emergency?: boolean;
}) {
  const fee =
    emergency && doc.emergencyFee ? doc.emergencyFee : doc.fee;

  return (
    <article
      className={`doctor-card flex flex-col overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        emergency ? "border-red-200 ring-1 ring-red-100" : "border-[var(--line)]"
      }`}
    >
      <div className="flex gap-3">
        <Link
          href={`/doctors/${doc.slug}`}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--brand-soft)]"
        >
          <Image
            src={doc.image}
            alt={doc.name}
            fill
            className="object-cover object-top"
            sizes="80px"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                href={`/doctors/${doc.slug}`}
                className="font-bold text-[var(--ink)] hover:text-[var(--forest)]"
              >
                {doc.name}
              </Link>
              <p className="text-sm font-medium text-[var(--forest)]">
                {doc.specialty}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {emergency && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  Emergency
                </span>
              )}
              {doc.availableNow ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  ● Online
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                  {emergency ? "Offline" : "Schedule"}
                </span>
              )}
            </div>
          </div>
          <p className="mt-0.5 truncate text-xs text-[var(--ink-muted)]">
            {doc.hospital}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
            <Star className="h-3 w-3 fill-[var(--gold)] text-[var(--gold)]" />
            {doc.rating} · {doc.experience} yrs · {doc.patients}
          </div>
          {doc.bmdcNumber && (
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--ink-muted)]">
              <BadgeCheck className="h-3 w-3 text-[var(--forest)]" />
              BMDC {doc.bmdcNumber}
            </p>
          )}
        </div>
      </div>

      {!emergency && doc.nextSlots.length > 0 && (
        <div className="mt-3 flex items-start gap-1.5 text-[11px] text-[var(--ink-muted)]">
          <Calendar className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            Next:{" "}
            {doc.nextSlots
              .slice(0, 3)
              .map((s) => s.label)
              .join(" · ")}
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3">
        <div>
          <p className="text-[10px] uppercase text-[var(--ink-muted)]">
            {emergency ? "Emergency fee" : "Fee"}
          </p>
          <p className="text-lg font-bold text-[var(--ink)]">
            {formatPrice(fee)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onBook(doc, "AUDIO")}
            className="flex items-center gap-1 rounded-lg border border-[var(--forest)] px-3 py-2 text-xs font-bold text-[var(--forest)] hover:bg-[var(--brand-soft)]"
          >
            <Phone className="h-3.5 w-3.5" /> Audio
          </button>
          <button
            type="button"
            onClick={() => onBook(doc, "VIDEO")}
            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-white ${
              emergency
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[var(--forest)] hover:bg-[var(--forest-deep)]"
            }`}
          >
            <Video className="h-3.5 w-3.5" />{" "}
            {emergency ? "Instant" : "Video"}
          </button>
        </div>
      </div>
    </article>
  );
}
