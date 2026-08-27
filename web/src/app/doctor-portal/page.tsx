"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  Stethoscope,
  Video,
  Phone,
  FileText,
  Power,
  RefreshCw,
  LogOut,
  Siren,
  Lock,
  Mail,
} from "lucide-react";
import { AgoraCallRoom } from "@/components/consult/AgoraCallRoom";
import { PrescriptionForm } from "@/components/consult/PrescriptionForm";
import {
  IncomingCallModal,
  type IncomingCall,
} from "@/components/consult/IncomingCallModal";
import { statusColor, statusLabel } from "@/lib/consult-utils";
import { setAccessToken, doctorFetch } from "@/lib/api-client";
import { cn, formatPrice } from "@/lib/utils";

type DoctorSession = {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  image: string;
  email: string | null;
  fee: number;
  emergencyFee: number | null;
  isOnline: boolean;
  isEmergency: boolean;
  availableNow: boolean;
};

type ConsultRow = {
  id: string;
  consultNumber: string;
  status: string;
  type: "VIDEO" | "AUDIO";
  fee: number;
  isEmergency?: boolean;
  patientName: string;
  patientPhone: string;
  patientAge: number | null;
  symptoms: string | null;
  scheduledAt: string | null;
  createdAt: string;
  prescription: { id: string } | null;
};

export default function DoctorPortalPage() {
  const [doctor, setDoctor] = useState<DoctorSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [queue, setQueue] = useState<ConsultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<ConsultRow | null>(null);
  const [inCall, setInCall] = useState(false);
  const [showRx, setShowRx] = useState(false);
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  /** Calls doctor dismissed — do not re-popup */
  const dismissedRef = useRef<Set<string>>(new Set());
  /** Call currently ringing / accepted */
  const activeCallIdRef = useRef<string | null>(null);
  const inCallRef = useRef(false);
  const showRxRef = useRef(false);

  useEffect(() => {
    inCallRef.current = inCall;
  }, [inCall]);
  useEffect(() => {
    showRxRef.current = showRx;
  }, [showRx]);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth-proxy", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "doctor", action: "bootstrap" }),
      });
      if (!res.ok) {
        setAccessToken("doctor", null);
        setDoctor(null);
        return;
      }
      const data = await res.json();
      setAccessToken("doctor", data.accessToken || null);
      setDoctor(data.doctor);
    } catch {
      setDoctor(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const loadQueue = useCallback(
    async (id: string, opts?: { silent?: boolean }) => {
      if (!id) return;
      if (!opts?.silent) setLoading(true);
      try {
        const res = await doctorFetch(
          `/consultations?doctorId=${encodeURIComponent(id)}&status=active`,
        );
        const data = await res.json();
        const list = (data.consultations || []) as ConsultRow[];
        setQueue(list);

        // Incoming modal: any active consult doctor has not dismissed / accepted
        if (inCallRef.current || showRxRef.current) return;

        const ringable = list
          .filter(
            (c) =>
              ["PENDING", "CONFIRMED", "IN_CALL"].includes(c.status) &&
              !dismissedRef.current.has(c.id) &&
              activeCallIdRef.current !== c.id,
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );

        if (ringable[0]) {
          const newest = ringable[0];
          setIncoming((prev) => {
            if (prev?.id === newest.id) return prev;
            return {
              id: newest.id,
              consultNumber: newest.consultNumber,
              type: newest.type,
              fee: newest.fee,
              isEmergency: newest.isEmergency,
              patientName: newest.patientName,
              patientPhone: newest.patientPhone,
              patientAge: newest.patientAge,
              symptoms: newest.symptoms,
              createdAt: newest.createdAt,
            };
          });
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  useEffect(() => {
    if (!doctor?.id) return;
    void loadQueue(doctor.id);
    // Fast poll for incoming call modal
    const t = setInterval(
      () => void loadQueue(doctor.id, { silent: true }),
      1500,
    );
    return () => clearInterval(t);
  }, [doctor?.id, loadQueue]);

  async function acceptIncoming() {
    if (!incoming || !doctor) return;
    setAccepting(true);
    try {
      await doctorFetch(`/consultations/${incoming.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join" }),
      });
      const row =
        queue.find((c) => c.id === incoming.id) ||
        ({
          id: incoming.id,
          consultNumber: incoming.consultNumber,
          status: "IN_CALL",
          type: incoming.type,
          fee: incoming.fee,
          isEmergency: incoming.isEmergency,
          patientName: incoming.patientName,
          patientPhone: incoming.patientPhone,
          patientAge: incoming.patientAge ?? null,
          symptoms: incoming.symptoms ?? null,
          scheduledAt: null,
          createdAt: incoming.createdAt || new Date().toISOString(),
          prescription: null,
        } satisfies ConsultRow);
      activeCallIdRef.current = incoming.id;
      dismissedRef.current.add(incoming.id);
      setActive(row);
      setIncoming(null);
      setInCall(true);
    } finally {
      setAccepting(false);
    }
  }

  async function declineIncoming() {
    if (!incoming) return;
    dismissedRef.current.add(incoming.id);
    try {
      await doctorFetch(`/consultations/${incoming.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
    } catch {
      /* ignore */
    }
    setIncoming(null);
    if (doctor) void loadQueue(doctor.id, { silent: true });
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          kind: "doctor",
          action: "login",
          payload: loginForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setAccessToken("doctor", data.accessToken || null);
      await loadMe();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth-proxy", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "doctor", action: "logout" }),
    });
    setAccessToken("doctor", null);
    setDoctor(null);
    setQueue([]);
  }

  async function toggleOnline() {
    if (!doctor) return;
    try {
      const res = await doctorFetch(`/doctors/${doctor.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: !doctor.isOnline }),
      });
      if (res.ok) {
        const d = await res.json();
        setDoctor((prev) =>
          prev
            ? {
                ...prev,
                isOnline: Boolean(d.isOnline),
                availableNow: Boolean(
                  d.isOnline && (prev.isEmergency || d.availableNow),
                ),
              }
            : prev,
        );
        return;
      }
    } catch {
      /* ignore */
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--forest)]" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container-main flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-xl">
          <div className="bg-gradient-to-br from-[var(--forest-deep)] to-[var(--forest)] px-6 py-8 text-white">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
              <Stethoscope className="h-4 w-4" />
              Doctor portal
            </p>
            <h1 className="mt-2 font-serif text-2xl font-semibold">
              Sign in to your clinic desk
            </h1>
            <p className="mt-1 text-sm text-white/75">
              Emergency doctors see instant queue · Specialists see scheduled
              consults
            </p>
          </div>
          <form onSubmit={onLogin} className="space-y-4 p-6">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">Email</span>
              <span className="relative flex items-center">
                <Mail className="absolute left-3 h-4 w-4 text-[var(--ink-muted)]" />
                <input
                  required
                  type="email"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[var(--line)] py-3 pl-10 pr-3 text-sm outline-none focus:border-[var(--forest)]"
                  placeholder="doctor@ahona.store"
                />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">
                Password
              </span>
              <span className="relative flex items-center">
                <Lock className="absolute left-3 h-4 w-4 text-[var(--ink-muted)]" />
                <input
                  required
                  type="password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[var(--line)] py-3 pl-10 pr-3 text-sm outline-none focus:border-[var(--forest)]"
                  placeholder="••••••••"
                />
              </span>
            </label>
            {loginError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {loginError}
              </p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--forest-deep)] py-3.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {loginLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign in as doctor"
              )}
            </button>
            <p className="text-center text-[11px] text-[var(--ink-muted)]">
              Patients book via{" "}
              <Link
                href="/doctors"
                className="font-semibold text-[var(--forest)]"
              >
                /doctors
              </Link>
            </p>
          </form>
        </div>
      </div>
    );
  }

  if (inCall && active) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--forest-deep)]">
        <div className="border-b border-white/10 px-4 py-3 text-center text-sm text-white/70">
          Live with <strong className="text-white">{active.patientName}</strong>
          {active.isEmergency ? " · Emergency" : ""} · {active.type}
        </div>
        <div className="mx-auto w-full max-w-5xl flex-1 p-3 sm:p-6">
          <AgoraCallRoom
            consultationId={active.id}
            role="doctor"
            className="min-h-[70vh]"
            onCallEnd={() => {
              activeCallIdRef.current = null;
              setInCall(false);
              setActive(null);
              void loadQueue(doctor.id);
            }}
          />
        </div>
      </div>
    );
  }

  if (showRx && active) {
    return (
      <div className="container-main py-8">
        <PrescriptionForm
          consultationId={active.id}
          onSaved={() => {
            setShowRx(false);
            setActive(null);
            void loadQueue(doctor.id);
          }}
        />
      </div>
    );
  }

  const emergencyQueue = queue.filter((c) => c.isEmergency);
  const scheduledQueue = queue.filter((c) => !c.isEmergency);

  return (
    <div className="container-main py-8 pb-20">
      {incoming && !inCall && (
        <IncomingCallModal
          call={incoming}
          accepting={accepting}
          onAccept={() => void acceptIncoming()}
          onDecline={() => void declineIncoming()}
        />
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl">
            <Image
              src={doctor.image}
              alt={doctor.name}
              fill
              className="object-cover object-top"
              sizes="56px"
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold-deep)]">
              {doctor.isEmergency ? "Emergency desk" : "Clinic desk"}
            </p>
            <h1 className="font-serif text-2xl font-bold">{doctor.name}</h1>
            <p className="text-sm text-[var(--ink-muted)]">
              {doctor.specialty}
              {doctor.isEmergency && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  EMERGENCY
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadQueue(doctor.id)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void toggleOnline()}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white",
              doctor.isOnline ? "bg-emerald-600" : "bg-gray-500",
            )}
          >
            <Power className="h-4 w-4" />
            {doctor.isOnline ? "Online" : "Go online"}
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {doctor.isEmergency && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <Siren className="mr-2 inline h-4 w-4" />
          You are an <strong>emergency doctor</strong>. Stay online to receive
          instant patient queue (no schedule). Toggle offline to pause.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <QueuePanel
          title="🚨 Emergency queue"
          empty="No emergency patients waiting"
          rows={emergencyQueue}
          onJoin={async (c) => {
            await doctorFetch(`/consultations/${c.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "join" }),
            });
            setActive(c);
            setIncoming(null);
            setInCall(true);
          }}
          onRx={(c) => {
            setActive(c);
            setShowRx(true);
          }}
        />
        <QueuePanel
          title="📅 Scheduled consults"
          empty="No scheduled consults right now"
          rows={scheduledQueue}
          onJoin={async (c) => {
            await doctorFetch(`/consultations/${c.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "join" }),
            });
            setActive(c);
            setIncoming(null);
            setInCall(true);
          }}
          onRx={(c) => {
            setActive(c);
            setShowRx(true);
          }}
        />
      </div>
    </div>
  );
}

function QueuePanel({
  title,
  empty,
  rows,
  onJoin,
  onRx,
}: {
  title: string;
  empty: string;
  rows: ConsultRow[];
  onJoin: (c: ConsultRow) => void | Promise<void>;
  onRx: (c: ConsultRow) => void;
}) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold">{title}</h2>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-[var(--ivory)] px-4 py-8 text-center text-sm text-[var(--ink-muted)]">
          {empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-[var(--line)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{c.patientName}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {c.consultNumber} · {c.patientPhone}
                  </p>
                  {c.symptoms && (
                    <p className="mt-1 text-xs text-[var(--ink)]">
                      {c.symptoms}
                    </p>
                  )}
                  {c.scheduledAt && (
                    <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                      {new Date(c.scheduledAt).toLocaleString("en-BD")}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      statusColor(c.status),
                    )}
                  >
                    {statusLabel(c.status)}
                  </span>
                  <p className="mt-1 text-xs font-bold">
                    {c.type === "VIDEO" ? (
                      <Video className="inline h-3 w-3" />
                    ) : (
                      <Phone className="inline h-3 w-3" />
                    )}{" "}
                    {formatPrice(c.fee)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onJoin(c)}
                  className="flex-1 rounded-lg bg-[var(--forest-deep)] py-2 text-xs font-bold text-white"
                >
                  Join call
                </button>
                <button
                  type="button"
                  onClick={() => onRx(c)}
                  className="flex items-center gap-1 rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-bold"
                >
                  <FileText className="h-3.5 w-3.5" /> Rx
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
