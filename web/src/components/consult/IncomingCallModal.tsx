"use client";

import { useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Video,
  Siren,
  User,
  Loader2,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";

export type IncomingCall = {
  id: string;
  consultNumber: string;
  type: "VIDEO" | "AUDIO";
  fee: number;
  isEmergency?: boolean;
  patientName: string;
  patientPhone: string;
  patientAge?: number | null;
  symptoms?: string | null;
  createdAt?: string;
};

type Props = {
  call: IncomingCall;
  accepting?: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

/** Premium full-screen incoming call UI for doctors */
export function IncomingCallModal({
  call,
  accepting,
  onAccept,
  onDecline,
}: Props) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Soft ringtone loop
  useEffect(() => {
    let cancelled = false;

    function beep() {
      try {
        const Ctx =
          window.AudioContext ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).webkitAudioContext;
        if (!Ctx) return;
        if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") void ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch {
        /* ignore autoplay blocks */
      }
    }

    beep();
    ringTimerRef.current = setInterval(() => {
      if (!cancelled) beep();
    }, 1800);

    return () => {
      cancelled = true;
      if (ringTimerRef.current) clearInterval(ringTimerRef.current);
      try {
        void audioCtxRef.current?.close();
      } catch {
        /* ignore */
      }
      audioCtxRef.current = null;
    };
  }, [call.id]);

  const isVideo = call.type === "VIDEO";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--forest-deep)]/80 backdrop-blur-md" />

      {/* Pulse rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span className="absolute h-64 w-64 animate-ping rounded-full bg-[var(--gold)]/10" />
        <span className="absolute h-96 w-96 animate-pulse rounded-full bg-emerald-400/5" />
      </div>

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#123d39] via-[var(--forest-deep)] to-[#061816] text-white shadow-2xl ring-1 ring-white/10">
        {/* Top badge */}
        <div className="flex items-center justify-between px-6 pt-5">
          {call.isEmergency ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-red-200 ring-1 ring-red-400/30">
              <Siren className="h-3.5 w-3.5 animate-pulse" />
              Emergency call
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white/80">
              Incoming consult
            </span>
          )}
          <span className="font-mono text-[11px] text-white/45">
            {call.consultNumber}
          </span>
        </div>

        {/* Avatar + ring animation */}
        <div className="flex flex-col items-center px-6 pb-2 pt-8">
          <div className="relative mb-5">
            <span
              className={cn(
                "absolute -inset-3 animate-ping rounded-full opacity-40",
                call.isEmergency ? "bg-red-400" : "bg-[var(--gold)]"
              )}
              style={{ animationDuration: "1.6s" }}
            />
            <span
              className={cn(
                "absolute -inset-1 rounded-full ring-4",
                call.isEmergency ? "ring-red-400/50" : "ring-[var(--gold)]/40"
              )}
            />
            <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white/10">
              <User className="h-14 w-14 text-white/70" />
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
            Incoming {isVideo ? "video" : "audio"} call
          </p>
          <h2 className="mt-2 text-center font-serif text-3xl font-semibold">
            {call.patientName}
          </h2>
          <p className="mt-1 text-sm text-white/60">{call.patientPhone}</p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              {isVideo ? (
                <Video className="h-3.5 w-3.5 text-[var(--gold)]" />
              ) : (
                <Phone className="h-3.5 w-3.5 text-[var(--gold)]" />
              )}
              {call.type}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              {formatPrice(call.fee)}
            </span>
            {call.patientAge != null && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                Age {call.patientAge}
              </span>
            )}
          </div>

          {call.symptoms && (
            <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">
                Symptoms
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/85">
                {call.symptoms}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-center gap-10 px-6 pb-8">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onDecline}
              disabled={accepting}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-900/40 transition hover:scale-105 hover:bg-red-400 active:scale-95 disabled:opacity-50"
              aria-label="Decline"
            >
              <PhoneOff className="h-7 w-7" />
            </button>
            <span className="text-xs font-semibold text-white/60">Decline</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onAccept}
              disabled={accepting}
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-xl shadow-emerald-900/50 transition hover:scale-105 hover:bg-emerald-400 active:scale-95 disabled:opacity-70"
              aria-label="Accept"
            >
              {accepting ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : isVideo ? (
                <Video className="h-8 w-8" />
              ) : (
                <Phone className="h-8 w-8" />
              )}
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300/40" />
            </button>
            <span className="text-xs font-semibold text-emerald-200">
              {accepting ? "Connecting…" : "Accept"}
            </span>
          </div>
        </div>

        <p className="pb-5 text-center text-[11px] text-white/35">
          Accept to open the secure Agora room · patient is waiting
        </p>
      </div>
    </div>
  );
}
