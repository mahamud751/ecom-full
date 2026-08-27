import type { Metadata } from "next";
import { listDoctors, SPECIALTIES } from "@/lib/doctors-data";
import { DoctorsBrowse } from "@/components/consult/DoctorsBrowse";
import {
  BadgeCheck,
  Clock,
  Stethoscope,
  Video,
  FileText,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Online Doctors",
  description:
    "Consult verified doctors via video or audio. Book by schedule, get e-prescriptions.",
};

export const dynamic = "force-dynamic";

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; q?: string; available?: string }>;
}) {
  const sp = await searchParams;
  const doctors = await listDoctors({
    specialty: sp.specialty,
    q: sp.q,
    availableOnly: sp.available === "1",
  });

  const onlineCount = doctors.filter((d) => d.availableNow).length;

  return (
    <div className="pb-16">
      <div className="bg-gradient-to-br from-[var(--forest-deep)] via-[var(--forest)] to-[#1a5c56] text-white">
        <div className="container-main py-10 sm:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
                <Stethoscope className="h-3.5 w-3.5 text-[var(--gold)]" />
                Online Doctor Consultation
              </div>
              <h1 className="font-serif text-3xl font-bold leading-tight sm:text-4xl">
                Talk to a verified doctor
                <br />
                <span className="text-[var(--gold)]">from home</span>
              </h1>
              <p className="mt-3 text-sm text-white/80 sm:text-base">
                Video & audio via Agora · Live availability · Schedule slots ·
                Digital prescription with PDF download
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs sm:text-sm">
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                  <Video className="h-4 w-4" /> HD Video & Audio
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                  <Clock className="h-4 w-4" /> Instant or scheduled
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                  <FileText className="h-4 w-4" /> E-prescription
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                  <BadgeCheck className="h-4 w-4" /> BMDC verified
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-2xl font-bold text-[var(--gold)]">
                  {onlineCount}
                </p>
                <p className="text-xs text-white/70">Available now</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-2xl font-bold">{doctors.length}</p>
                <p className="text-xs text-white/70">Specialists listed</p>
              </div>
              <Link
                href="/doctor-portal"
                className="flex items-center rounded-2xl border border-white/20 bg-white/5 px-5 py-4 text-sm font-semibold hover:bg-white/10"
              >
                Doctor portal →
              </Link>
              <Link
                href="/my-consultations"
                className="flex items-center rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-5 py-4 text-sm font-semibold text-[var(--gold)] hover:bg-[var(--gold)]/20"
              >
                My consultations →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <DoctorsBrowse
        initialDoctors={doctors}
        specialties={[...SPECIALTIES]}
        initialSpecialty={sp.specialty || "All"}
        initialQuery={sp.q || ""}
        initialAvailableOnly={sp.available === "1"}
      />
    </div>
  );
}
