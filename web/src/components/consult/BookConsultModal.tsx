"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  X,
  Video,
  Phone,
  Loader2,
  Calendar,
  Zap,
  User,
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  Stethoscope,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";

export type BookDoctor = {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  fee: number;
  emergencyFee?: number | null;
  /** Can take instant emergency (flagged + online) */
  isEmergency?: boolean;
  emergencyAvailable?: boolean;
  availableNow: boolean;
  nextSlots: {
    iso: string;
    label: string;
    dateLabel: string;
    timeLabel: string;
  }[];
  image?: string;
  hospital?: string | null;
};

type Props = {
  doctor: BookDoctor;
  defaultType?: "VIDEO" | "AUDIO";
  onClose: () => void;
};

export function BookConsultModal({
  doctor,
  defaultType = "VIDEO",
  onClose,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<"VIDEO" | "AUDIO">(defaultType);
  // Emergency doctors → instant when online. Normal doctors → schedule only.
  const canEmergency =
    Boolean(doctor.isEmergency) &&
    Boolean(doctor.emergencyAvailable ?? doctor.availableNow);
  const [mode, setMode] = useState<"instant" | "schedule">(
    canEmergency ? "instant" : "schedule"
  );
  const [slot, setSlot] = useState(doctor.nextSlots[0]?.iso || "");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill from previous booking
  useEffect(() => {
    try {
      const n = localStorage.getItem("htp_patient_name");
      const p = localStorage.getItem("htp_patient_phone");
      if (n) setPatientName(n);
      if (p) setPatientPhone(p);
    } catch {
      /* ignore */
    }
  }, []);

  // Lock body scroll while modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function canContinueStep1() {
    if (mode === "instant") return canEmergency;
    return Boolean(slot);
  }

  const displayFee =
    mode === "instant" && doctor.emergencyFee
      ? doctor.emergencyFee
      : doctor.fee;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) {
      if (!canContinueStep1()) {
        setError(
          mode === "instant"
            ? "Emergency doctor is offline. Choose another or schedule a normal consult."
            : "Please select a time slot for audio/video consult."
        );
        return;
      }
      setError(null);
      setStep(2);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: doctor.id,
          patientName,
          patientPhone,
          patientAge: patientAge ? Number(patientAge) : undefined,
          patientGender: patientGender || undefined,
          symptoms,
          type,
          emergency: mode === "instant",
          instant: mode === "instant",
          scheduledAt: mode === "schedule" ? slot : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      try {
        localStorage.setItem("htp_patient_phone", patientPhone.trim());
        localStorage.setItem("htp_patient_name", patientName.trim());
      } catch {
        /* ignore */
      }

      router.push(`/consultations/${data.consultation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
      setLoading(false);
    }
  }

  const selectedSlotLabel =
    doctor.nextSlots.find((s) => s.iso === slot)?.label || "";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consult-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--forest-deep)]/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel — full height mobile, large card desktop */}
      <div className="relative z-10 flex h-[min(96dvh,920px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-3xl">
        {/* Header */}
        <div className="relative shrink-0 border-b border-[var(--line)] bg-gradient-to-br from-[var(--forest-deep)] via-[var(--forest)] to-[#1a5c56] px-5 pb-5 pt-4 text-white sm:px-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur">
              <Stethoscope className="h-3.5 w-3.5 text-[var(--gold)]" />
              Book consultation
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/15 p-2 hover:bg-white/25"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-4">
            {doctor.image && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/30 sm:h-24 sm:w-24">
                <Image
                  src={doctor.image}
                  alt={doctor.name}
                  fill
                  className="object-cover object-top"
                  sizes="96px"
                  unoptimized={doctor.image.startsWith("/uploads/")}
                />
              </div>
            )}
            <div className="min-w-0">
              <h2
                id="consult-modal-title"
                className="text-xl font-bold leading-tight sm:text-2xl"
              >
                {doctor.name}
              </h2>
              <p className="mt-0.5 text-sm text-white/85">{doctor.specialty}</p>
              {doctor.hospital && (
                <p className="mt-0.5 truncate text-xs text-white/60">
                  {doctor.hospital}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {doctor.isEmergency && (
                  <span className="rounded-full bg-red-500/25 px-2.5 py-0.5 text-[11px] font-bold text-red-100">
                    🚨 Emergency
                  </span>
                )}
                {canEmergency ? (
                  <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
                    ● Instant ready
                  </span>
                ) : (
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-white/80">
                    Schedule required
                  </span>
                )}
                <span className="rounded-full bg-[var(--gold)]/20 px-2.5 py-0.5 text-[11px] font-bold text-[var(--gold)]">
                  Fee {formatPrice(displayFee)}
                </span>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="mt-5 flex items-center gap-2">
            <StepPill n={1} label="Consult type" active={step === 1} done={step > 1} />
            <div className="h-px flex-1 bg-white/20" />
            <StepPill n={2} label="Patient details" active={step === 2} done={false} />
          </div>
        </div>

        {/* Body */}
        <form
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
            {step === 1 && (
              <>
                {/* Audio / Video */}
                <section>
                  <h3 className="mb-2 text-sm font-bold text-[var(--ink)]">
                    How do you want to consult?
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TypeCard
                      active={type === "VIDEO"}
                      onClick={() => setType("VIDEO")}
                      icon={Video}
                      title="Video consult"
                      desc="HD face-to-face via Agora. Best for skin, injury & general check."
                      badge="Recommended"
                    />
                    <TypeCard
                      active={type === "AUDIO"}
                      onClick={() => setType("AUDIO")}
                      icon={Phone}
                      title="Audio consult"
                      desc="Voice-only call. Private, lower data — great for follow-ups."
                    />
                  </div>
                </section>

                {/* When: Emergency instant OR scheduled (normal doctors) */}
                <section>
                  <h3 className="mb-2 text-sm font-bold text-[var(--ink)]">
                    When?
                  </h3>
                  {!doctor.isEmergency && (
                    <p className="mb-3 rounded-xl bg-[var(--ivory)] px-3 py-2 text-xs text-[var(--ink-muted)]">
                      Normal doctors require a <strong>scheduled</strong>{" "}
                      slot first, then audio/video consult.
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {doctor.isEmergency && (
                    <button
                      type="button"
                      disabled={!canEmergency}
                      onClick={() => setMode("instant")}
                      className={cn(
                        "flex flex-col items-start rounded-2xl border-2 p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45",
                        mode === "instant"
                          ? "border-red-500 bg-red-50 shadow-sm"
                          : "border-[var(--line)] hover:border-red-300"
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-bold">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
                          <Zap className="h-4 w-4" />
                        </span>
                        Emergency instant
                      </span>
                      <span className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
                        {canEmergency
                          ? "Connect now — no schedule. Doctor joins the queue."
                          : "Emergency doctor is offline. Try later or schedule."}
                      </span>
                    </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setMode("schedule")}
                      className={cn(
                        "flex flex-col items-start rounded-2xl border-2 p-4 text-left transition",
                        mode === "schedule"
                          ? "border-[var(--forest)] bg-[var(--brand-soft)] shadow-sm"
                          : "border-[var(--line)] hover:border-[var(--forest)]/40"
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-bold">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--forest)]/10 text-[var(--forest)]">
                          <Calendar className="h-4 w-4" />
                        </span>
                        Schedule slot
                      </span>
                      <span className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
                        Pick a free time from the doctor&apos;s weekly hours.
                      </span>
                    </button>
                  </div>
                </section>

                {mode === "schedule" && (
                  <section>
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--ink)]">
                      <Clock className="h-4 w-4 text-[var(--forest)]" />
                      Available slots
                    </h3>
                    {doctor.nextSlots.length === 0 ? (
                      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        No open slots in the next week. Try instant if the
                        doctor is online, or another specialist.
                      </p>
                    ) : (
                      <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--ivory)] p-3 sm:grid-cols-3">
                        {doctor.nextSlots.map((s) => (
                          <button
                            key={s.iso}
                            type="button"
                            onClick={() => setSlot(s.iso)}
                            className={cn(
                              "rounded-xl border px-2.5 py-2.5 text-left text-xs font-semibold transition",
                              slot === s.iso
                                ? "border-[var(--forest)] bg-[var(--forest)] text-white shadow"
                                : "border-white bg-white text-[var(--ink)] hover:border-[var(--forest)]"
                            )}
                          >
                            <span className="block text-[10px] opacity-80">
                              {s.dateLabel}
                            </span>
                            <span className="text-sm">{s.timeLabel}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* What's included */}
                <section className="rounded-2xl border border-[var(--line)] bg-[var(--ivory)] p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">
                    Included in {formatPrice(doctor.fee)}
                  </p>
                  <ul className="space-y-2 text-sm text-[var(--ink)]">
                    <li className="flex items-center gap-2">
                      {type === "VIDEO" ? (
                        <Video className="h-4 w-4 text-[var(--forest)]" />
                      ) : (
                        <Phone className="h-4 w-4 text-[var(--forest)]" />
                      )}
                      Secure Agora {type === "VIDEO" ? "video" : "audio"} room
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[var(--forest)]" />
                      Digital e-prescription (PDF download)
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[var(--forest)]" />
                      BMDC-registered specialist
                    </li>
                  </ul>
                </section>
              </>
            )}

            {step === 2 && (
              <>
                {/* Summary chip */}
                <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--line)] bg-[var(--brand-soft)] px-4 py-3 text-xs font-semibold text-[var(--forest)]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                    {type === "VIDEO" ? (
                      <Video className="h-3.5 w-3.5" />
                    ) : (
                      <Phone className="h-3.5 w-3.5" />
                    )}
                    {type}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                    {mode === "instant" ? (
                      <Zap className="h-3.5 w-3.5" />
                    ) : (
                      <Calendar className="h-3.5 w-3.5" />
                    )}
                    {mode === "instant" ? "Instant" : selectedSlotLabel || "Scheduled"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                    {formatPrice(doctor.fee)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="ml-auto text-[var(--forest)] underline"
                  >
                    Change
                  </button>
                </div>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-[var(--ink)]">
                    <User className="h-4 w-4 text-[var(--forest)]" />
                    Patient details
                  </h3>
                  <Field
                    label="Full name *"
                    required
                    value={patientName}
                    onChange={setPatientName}
                    placeholder="Your full name"
                  />
                  <Field
                    label="Phone number *"
                    required
                    value={patientPhone}
                    onChange={setPatientPhone}
                    placeholder="01XXXXXXXXX"
                    inputMode="tel"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Age"
                      value={patientAge}
                      onChange={setPatientAge}
                      placeholder="e.g. 28"
                      inputMode="numeric"
                    />
                    <label className="block text-xs">
                      <span className="mb-1 block font-semibold text-[var(--ink-muted)]">
                        Gender
                      </span>
                      <select
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value)}
                        className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--forest)]"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </label>
                  </div>
                  <label className="block text-xs">
                    <span className="mb-1 block font-semibold text-[var(--ink-muted)]">
                      Symptoms / reason for visit
                    </span>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="Describe symptoms so the doctor can prepare…"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--forest)]"
                    />
                  </label>
                </section>
              </>
            )}

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
          </div>

          {/* Sticky footer actions */}
          <div className="shrink-0 border-t border-[var(--line)] bg-white px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep(1);
                  }}
                  className="order-2 rounded-xl border border-[var(--line)] px-5 py-3.5 text-sm font-bold text-[var(--ink)] sm:order-1"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={
                  loading ||
                  (step === 1 && !canContinueStep1()) ||
                  (step === 2 && (!patientName.trim() || !patientPhone.trim()))
                }
                className={cn(
                  "order-1 flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition disabled:opacity-45 sm:order-2",
                  type === "VIDEO"
                    ? "bg-[var(--forest)] hover:bg-[var(--forest-deep)]"
                    : "bg-[#0e5c8c] hover:bg-[#0a4a70]"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Booking…
                  </>
                ) : step === 1 ? (
                  <>
                    Continue
                    <span className="opacity-80">· Patient details</span>
                  </>
                ) : (
                  <>
                    {type === "VIDEO" ? (
                      <Video className="h-4 w-4" />
                    ) : (
                      <Phone className="h-4 w-4" />
                    )}
                    Confirm {type === "VIDEO" ? "video" : "audio"} ·{" "}
                    {formatPrice(doctor.fee)}
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-[var(--ink-muted)]">
              After confirm you enter a secure Agora call room. Prescription is
              issued after the consult.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function StepPill({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
        active && "bg-white text-[var(--forest-deep)]",
        done && !active && "bg-white/20 text-white",
        !active && !done && "bg-white/10 text-white/60"
      )}
    >
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full text-[10px]",
            active ? "bg-[var(--forest)] text-white" : "bg-white/20"
          )}
        >
          {n}
        </span>
      )}
      {label}
    </div>
  );
}

function TypeCard({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start rounded-2xl border-2 p-4 text-left transition",
        active
          ? "border-[var(--forest)] bg-[var(--brand-soft)] shadow-md"
          : "border-[var(--line)] hover:border-[var(--forest)]/50"
      )}
    >
      {badge && (
        <span className="absolute right-3 top-3 rounded-full bg-[var(--gold)] px-2 py-0.5 text-[9px] font-bold text-[var(--forest-deep)]">
          {badge}
        </span>
      )}
      <span
        className={cn(
          "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl",
          active
            ? "bg-[var(--forest)] text-white"
            : "bg-[var(--ivory)] text-[var(--forest)]"
        )}
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className="text-base font-bold text-[var(--ink)]">{title}</span>
      <span className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
        {desc}
      </span>
      {active && (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--forest)]">
          <CheckCircle2 className="h-3.5 w-3.5" /> Selected
        </span>
      )}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-semibold text-[var(--ink-muted)]">
        {label}
      </span>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--forest)] focus:ring-2 focus:ring-[var(--forest)]/10"
      />
    </label>
  );
}
