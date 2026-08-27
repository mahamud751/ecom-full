import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  BadgeCheck,
  MapPin,
  Languages,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { getDoctorBySlug } from "@/lib/doctors-data";
import { formatPrice } from "@/lib/utils";
import { dayName } from "@/lib/schedule";
import { DoctorBookActions } from "@/components/consult/DoctorBookActions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doctor = await getDoctorBySlug(slug);
  if (!doctor) return { title: "Doctor" };
  return {
    title: `${doctor.name} — ${doctor.specialty}`,
    description: doctor.bio || `Consult ${doctor.name} online on Ahona`,
  };
}

export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doctor = await getDoctorBySlug(slug);
  if (!doctor) notFound();

  return (
    <div className="container-main py-8 pb-16">
      <Link
        href="/doctors"
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-[var(--forest)]"
      >
        <ChevronLeft className="h-4 w-4" /> All doctors
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-col gap-5 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm sm:flex-row">
            <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-2xl bg-[var(--brand-soft)] sm:mx-0">
              <Image
                src={doctor.image}
                alt={doctor.name}
                fill
                className="object-cover object-top"
                sizes="160px"
                priority
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-bold text-[var(--ink)]">
                  {doctor.name}
                </h1>
                {doctor.availableNow ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    ● Available now
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
                    Book a slot
                  </span>
                )}
              </div>
              <p className="mt-1 text-base font-medium text-[var(--forest)]">
                {doctor.specialty}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-[var(--ink-muted)] sm:justify-start">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-[var(--gold)] text-[var(--gold)]" />
                  {doctor.rating}
                </span>
                <span>{doctor.experience} years exp</span>
                <span>{doctor.patients} patients</span>
              </div>
              {doctor.bmdcNumber && (
                <p className="mt-2 flex items-center justify-center gap-1 text-xs text-[var(--ink-muted)] sm:justify-start">
                  <BadgeCheck className="h-3.5 w-3.5 text-[var(--forest)]" />
                  BMDC {doctor.bmdcNumber}
                </p>
              )}
              {doctor.hospital && (
                <p className="mt-1 flex items-center justify-center gap-1 text-sm text-[var(--ink-muted)] sm:justify-start">
                  <MapPin className="h-3.5 w-3.5" />
                  {doctor.hospital}
                </p>
              )}
              <p className="mt-1 flex items-center justify-center gap-1 text-sm text-[var(--ink-muted)] sm:justify-start">
                <Languages className="h-3.5 w-3.5" />
                {doctor.languages}
              </p>
            </div>
          </div>

          {doctor.bio && (
            <div className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-6">
              <h2 className="font-bold text-[var(--ink)]">About</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                {doctor.bio}
              </p>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-6">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-[var(--ink)]">
              <Clock className="h-4 w-4 text-[var(--forest)]" />
              Weekly schedule
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {doctor.schedules
                .filter((s) => s.isActive)
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl bg-[var(--ivory)] px-3 py-2 text-sm"
                  >
                    <span className="font-semibold">{dayName(s.dayOfWeek)}</span>
                    <span className="text-[var(--ink-muted)]">
                      {s.startTime} – {s.endTime}
                    </span>
                  </div>
                ))}
            </div>
            {doctor.nextSlots.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase text-[var(--ink-muted)]">
                  Upcoming free slots
                </p>
                <div className="flex flex-wrap gap-2">
                  {doctor.nextSlots.slice(0, 12).map((slot) => (
                    <span
                      key={slot.iso}
                      className="rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs font-medium"
                    >
                      {slot.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase text-[var(--ink-muted)]">
              Consultation fee
            </p>
            <p className="mt-1 font-serif text-3xl font-bold text-[var(--ink)]">
              {formatPrice(doctor.fee)}
            </p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              Includes video/audio call + e-prescription
            </p>
            <DoctorBookActions
              doctor={{
                id: doctor.id,
                slug: doctor.slug,
                name: doctor.name,
                specialty: doctor.specialty,
                fee: doctor.fee,
                emergencyFee: doctor.emergencyFee,
                isEmergency: doctor.isEmergency,
                emergencyAvailable: doctor.emergencyAvailable,
                availableNow: doctor.availableNow,
                nextSlots: doctor.nextSlots,
                image: doctor.image,
                hospital: doctor.hospital,
              }}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
