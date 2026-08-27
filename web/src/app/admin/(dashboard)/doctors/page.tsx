"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import Image from "next/image";
import Link from "next/link";
import {
  PageHeader,
  AdminCard,
  Btn,
  Input,
  Select,
  Textarea,
  Modal,
  Badge,
  Empty,
  StatCard,
} from "@/components/admin/ui";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { formatPrice } from "@/lib/utils";
import { Loader2, Plus, Pencil, Calendar, Wallet } from "lucide-react";

const SPECIALTIES = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "Gynecologist",
  "Orthopedic",
  "ENT",
  "Psychiatrist",
  "Neurologist",
  "Diabetologist",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Schedule = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMins: number;
  isActive: boolean;
};

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  image: string;
  fee: number;
  experience: number;
  isOnline: boolean;
  isActive: boolean;
  hospital: string | null;
  bmdcNumber: string | null;
  phone: string | null;
  email: string | null;
  languages: string;
  bio: string | null;
  platformCutPct: number;
  patients: string;
  rating: number;
  completedConsults: number;
  earnings: { gross: number; platform: number; doctorShare: number };
  schedules: Schedule[];
  _count: { consultations: number };
};

const emptyForm = {
  name: "",
  specialty: "General Physician",
  fee: "299",
  experience: "5",
  hospital: "",
  bmdcNumber: "",
  phone: "",
  email: "",
  languages: "Bangla, English",
  bio: "",
  image: "",
  platformCutPct: "20",
  isOnline: true,
  isActive: true,
};

function defaultWeek(): Schedule[] {
  return [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    startTime: "09:00",
    endTime: "18:00",
    slotMins: 30,
    isActive: dayOfWeek !== 5, // Fri off by default optional - actually keep all on
  }));
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [scheduleModal, setScheduleModal] = useState<Doctor | null>(null);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [schedules, setSchedules] = useState<Schedule[]>(defaultWeek());
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const d = await adminFetch("/admin/doctors").then((r) => r.json());
    setDoctors(d.doctors || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = doctors.filter(
    (d) =>
      !q.trim() ||
      d.name.toLowerCase().includes(q.toLowerCase()) ||
      d.specialty.toLowerCase().includes(q.toLowerCase())
  );

  const totalGross = doctors.reduce((s, d) => s + (d.earnings?.gross || 0), 0);
  const totalPlatform = doctors.reduce(
    (s, d) => s + (d.earnings?.platform || 0),
    0
  );
  const onlineCount = doctors.filter((d) => d.isOnline && d.isActive).length;

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  }

  function openEdit(d: Doctor) {
    setEditing(d);
    setForm({
      name: d.name,
      specialty: d.specialty,
      fee: String(d.fee),
      experience: String(d.experience),
      hospital: d.hospital || "",
      bmdcNumber: d.bmdcNumber || "",
      phone: d.phone || "",
      email: d.email || "",
      languages: d.languages || "Bangla, English",
      bio: d.bio || "",
      image: d.image,
      platformCutPct: String(d.platformCutPct ?? 20),
      isOnline: d.isOnline,
      isActive: d.isActive,
    });
    setModal(true);
  }

  function openSchedule(d: Doctor) {
    const base = defaultWeek();
    const map = new Map(d.schedules.map((s) => [s.dayOfWeek, s]));
    setSchedules(
      base.map((b) => {
        const existing = map.get(b.dayOfWeek);
        return existing
          ? {
              dayOfWeek: existing.dayOfWeek,
              startTime: existing.startTime,
              endTime: existing.endTime,
              slotMins: existing.slotMins || 30,
              isActive: existing.isActive,
            }
          : { ...b, isActive: false };
      })
    );
    setScheduleModal(d);
  }

  async function saveDoctor() {
    if (!form.image && !editing) {
      alert("Please upload a doctor photo");
      return;
    }
    setSaving(true);
    const payload = {
      ...(editing ? { id: editing.id } : {}),
      name: form.name,
      specialty: form.specialty,
      fee: Number(form.fee),
      experience: Number(form.experience),
      hospital: form.hospital || null,
      bmdcNumber: form.bmdcNumber || null,
      phone: form.phone || null,
      email: form.email || null,
      languages: form.languages,
      bio: form.bio || null,
      image: form.image || undefined,
      platformCutPct: Number(form.platformCutPct),
      isOnline: form.isOnline,
      isActive: form.isActive,
    };
    const res = await adminFetch("/admin/doctors", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setModal(false);
      void load();
    } else {
      const d = await res.json();
      alert(d.error || "Save failed");
    }
  }

  async function saveSchedules() {
    if (!scheduleModal) return;
    setSaving(true);
    const res = await adminFetch("/admin/doctors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: scheduleModal.id,
        schedules: schedules.filter((s) => s.isActive || true), // save all days with isActive flag
      }),
    });
    setSaving(false);
    if (res.ok) {
      setScheduleModal(null);
      void load();
    } else {
      alert("Failed to save schedule");
    }
  }

  async function patch(id: string, data: Record<string, unknown>) {
    await adminFetch("/admin/doctors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    void load();
  }

  async function remove(id: string) {
    if (!confirm("Deactivate this doctor?")) return;
    await adminFetch(`/admin/doctors?id=${id}`, { method: "DELETE" });
    void load();
  }

  return (
    <div>
      <PageHeader
        title="Doctors"
        subtitle="Create · edit · availability · consult earnings"
        actions={
          <>
            <Link href="/admin/earnings">
              <Btn variant="secondary">
                <Wallet className="h-3.5 w-3.5" /> All earnings
              </Btn>
            </Link>
            <Input
              placeholder="Search doctor…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-40"
            />
            <Btn onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" /> Add doctor
            </Btn>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Doctors" value={doctors.length} hint={`${onlineCount} online`} />
        <StatCard
          label="Consult gross"
          value={formatPrice(totalGross)}
          hint="Completed fees"
          accent="bg-[var(--gold)]"
        />
        <StatCard
          label="Platform cut"
          value={formatPrice(totalPlatform)}
          hint="From doctor consults"
        />
        <StatCard
          label="Doctor payouts"
          value={formatPrice(totalGross - totalPlatform)}
          hint="Owed to doctors"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--forest)]" />
        </div>
      ) : filtered.length === 0 ? (
        <Empty text="No doctors found" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <AdminCard key={d.id}>
              <div className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--brand-soft)]">
                  <Image
                    src={d.image}
                    alt=""
                    fill
                    className="object-cover object-top"
                    sizes="64px"
                    unoptimized={d.image?.startsWith("/uploads/")}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <p className="font-bold">{d.name}</p>
                    {d.isOnline && d.isActive && (
                      <Badge tone="green">Online</Badge>
                    )}
                    {!d.isActive && <Badge tone="gray">Hidden</Badge>}
                  </div>
                  <p className="text-xs text-[var(--forest)]">{d.specialty}</p>
                  <p className="text-[10px] text-[var(--ink-muted)]">
                    {formatPrice(d.fee)} · cut {d.platformCutPct}% ·{" "}
                    {d._count.consultations} consults
                  </p>
                  {d.hospital && (
                    <p className="truncate text-[10px] text-[var(--ink-muted)]">
                      {d.hospital}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-[var(--ivory)] p-2 text-center text-[10px]">
                <div>
                  <p className="font-bold text-sm">{formatPrice(d.earnings?.gross || 0)}</p>
                  <p className="text-[var(--ink-muted)]">Gross</p>
                </div>
                <div>
                  <p className="font-bold text-sm text-[var(--forest)]">
                    {formatPrice(d.earnings?.platform || 0)}
                  </p>
                  <p className="text-[var(--ink-muted)]">Platform</p>
                </div>
                <div>
                  <p className="font-bold text-sm text-emerald-700">
                    {formatPrice(d.earnings?.doctorShare || 0)}
                  </p>
                  <p className="text-[var(--ink-muted)]">Doctor</p>
                </div>
              </div>

              <p className="mt-2 text-[10px] text-[var(--ink-muted)]">
                Hours:{" "}
                {d.schedules
                  .filter((s) => s.isActive)
                  .map((s) => `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}-${s.endTime}`)
                  .slice(0, 3)
                  .join(" · ") || "—"}
                {d.schedules.filter((s) => s.isActive).length > 3 ? "…" : ""}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Btn variant="secondary" onClick={() => openEdit(d)}>
                  <Pencil className="h-3 w-3" /> Edit
                </Btn>
                <Btn variant="secondary" onClick={() => openSchedule(d)}>
                  <Calendar className="h-3 w-3" /> Hours
                </Btn>
                <Btn
                  variant="ghost"
                  onClick={() => patch(d.id, { isOnline: !d.isOnline })}
                >
                  {d.isOnline ? "Offline" : "Online"}
                </Btn>
                <Btn
                  variant="ghost"
                  onClick={() => patch(d.id, { isActive: !d.isActive })}
                >
                  {d.isActive ? "Hide" : "Show"}
                </Btn>
                <Link href={`/admin/doctors/${d.id}`}>
                  <Btn variant="primary">Details</Btn>
                </Link>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* Create / Edit */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Edit doctor" : "Add doctor"}
        wide
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Full name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Select
            label="Specialty"
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          >
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Input
            label="Consult fee (৳)"
            type="number"
            value={form.fee}
            onChange={(e) => setForm({ ...form, fee: e.target.value })}
          />
          <Input
            label="Platform cut %"
            type="number"
            value={form.platformCutPct}
            onChange={(e) =>
              setForm({ ...form, platformCutPct: e.target.value })
            }
          />
          <Input
            label="Experience (years)"
            type="number"
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
          />
          <Input
            label="BMDC number"
            value={form.bmdcNumber}
            onChange={(e) => setForm({ ...form, bmdcNumber: e.target.value })}
          />
          <Input
            label="Hospital"
            value={form.hospital}
            onChange={(e) => setForm({ ...form, hospital: e.target.value })}
          />
          <Input
            label="Languages"
            value={form.languages}
            onChange={(e) => setForm({ ...form, languages: e.target.value })}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <div className="sm:col-span-2 max-w-xs">
            <ImageUpload
              label="Doctor photo *"
              folder="doctors"
              aspect="portrait"
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Bio"
              rows={2}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={form.isOnline}
              onChange={(e) =>
                setForm({ ...form, isOnline: e.target.checked })
              }
            />
            Available online (instant consults)
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
            />
            Active on storefront
          </label>
        </div>
        <div className="mt-4 flex justify-between">
          {editing ? (
            <Btn variant="danger" onClick={() => remove(editing.id)}>
              Deactivate
            </Btn>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={saveDoctor} disabled={saving || !form.name}>
              {saving ? "Saving…" : "Save doctor"}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Availability */}
      <Modal
        open={!!scheduleModal}
        onClose={() => setScheduleModal(null)}
        title={`Availability — ${scheduleModal?.name || ""}`}
        wide
      >
        <p className="mb-3 text-xs text-[var(--ink-muted)]">
          Set weekly hours. Uncheck a day to mark unavailable. Patients book
          slots inside these windows.
        </p>
        <div className="space-y-2">
          {schedules.map((s, idx) => (
            <div
              key={s.dayOfWeek}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--ivory)] px-3 py-2"
            >
              <label className="flex w-16 items-center gap-1.5 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={s.isActive}
                  onChange={(e) => {
                    const next = [...schedules];
                    next[idx] = { ...s, isActive: e.target.checked };
                    setSchedules(next);
                  }}
                />
                {DAY_NAMES[s.dayOfWeek]}
              </label>
              <input
                type="time"
                disabled={!s.isActive}
                value={s.startTime}
                onChange={(e) => {
                  const next = [...schedules];
                  next[idx] = { ...s, startTime: e.target.value };
                  setSchedules(next);
                }}
                className="rounded-lg border border-[var(--line)] px-2 py-1 text-xs disabled:opacity-40"
              />
              <span className="text-xs text-[var(--ink-muted)]">to</span>
              <input
                type="time"
                disabled={!s.isActive}
                value={s.endTime}
                onChange={(e) => {
                  const next = [...schedules];
                  next[idx] = { ...s, endTime: e.target.value };
                  setSchedules(next);
                }}
                className="rounded-lg border border-[var(--line)] px-2 py-1 text-xs disabled:opacity-40"
              />
              <select
                disabled={!s.isActive}
                value={s.slotMins}
                onChange={(e) => {
                  const next = [...schedules];
                  next[idx] = { ...s, slotMins: Number(e.target.value) };
                  setSchedules(next);
                }}
                className="rounded-lg border border-[var(--line)] px-2 py-1 text-xs disabled:opacity-40"
              >
                <option value={15}>15 min slots</option>
                <option value={20}>20 min slots</option>
                <option value={30}>30 min slots</option>
                <option value={45}>45 min slots</option>
                <option value={60}>60 min slots</option>
              </select>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setScheduleModal(null)}>
            Cancel
          </Btn>
          <Btn onClick={saveSchedules} disabled={saving}>
            {saving ? "Saving…" : "Save availability"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
