"use client";

import { useState } from "react";
import { Video, Phone, ShieldCheck, FileText } from "lucide-react";
import { BookConsultModal, type BookDoctor } from "./BookConsultModal";

export function DoctorBookActions({ doctor }: { doctor: BookDoctor }) {
  const [open, setOpen] = useState<"VIDEO" | "AUDIO" | null>(null);

  return (
    <>
      <div className="mt-5 space-y-2.5">
        <button
          type="button"
          onClick={() => setOpen("VIDEO")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--forest)] py-3.5 text-sm font-bold text-white shadow-lg shadow-[var(--forest)]/20 transition hover:bg-[var(--forest-deep)] active:scale-[0.99]"
        >
          <Video className="h-5 w-5" />
          {doctor.isEmergency && doctor.emergencyAvailable
            ? "Emergency video now"
            : doctor.availableNow
              ? "Start video consult"
              : "Schedule video consult"}
        </button>
        <button
          type="button"
          onClick={() => setOpen("AUDIO")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--forest)] py-3.5 text-sm font-bold text-[var(--forest)] transition hover:bg-[var(--brand-soft)] active:scale-[0.99]"
        >
          <Phone className="h-5 w-5" />
          {doctor.isEmergency && doctor.emergencyAvailable
            ? "Emergency audio now"
            : doctor.availableNow
              ? "Start audio consult"
              : "Schedule audio consult"}
        </button>
      </div>

      <ul className="mt-4 space-y-1.5 text-[11px] text-[var(--ink-muted)]">
        {doctor.isEmergency ? (
          <li className="font-semibold text-red-600">
            🚨 Emergency doctor — instant when online
          </li>
        ) : (
          <li className="font-semibold text-[var(--forest)]">
            Normal consult — pick a schedule slot first
          </li>
        )}
        <li className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--forest)]" />
          Secure Agora audio / video room
        </li>
        <li className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-[var(--forest)]" />
          E-prescription after consult
        </li>
      </ul>

      {open && (
        <BookConsultModal
          doctor={doctor}
          defaultType={open}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
