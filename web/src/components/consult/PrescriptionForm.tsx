"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Plus, Trash2, Loader2, FileText, Check } from "lucide-react";

export type RxItemDraft = {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

const emptyItem = (): RxItemDraft => ({
  medicineName: "",
  dosage: "1 tablet",
  frequency: "2 times daily",
  duration: "5 days",
  instructions: "After meal",
});

type Props = {
  consultationId: string;
  onSaved?: (prescriptionId: string) => void;
};

export function PrescriptionForm({ consultationId, onSaved }: Props) {
  const [diagnosis, setDiagnosis] = useState("");
  const [advice, setAdvice] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [items, setItems] = useState<RxItemDraft[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  function updateItem(idx: number, patch: Partial<RxItemDraft>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  }

  function removeItem(idx: number) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch("/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationId,
          diagnosis,
          advice,
          followUp,
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSavedId(data.prescription.id);
      onSaved?.(data.prescription.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (savedId) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-6 w-6" />
        </div>
        <p className="font-bold text-emerald-900">Prescription saved</p>
        <p className="mt-1 text-sm text-emerald-800/80">
          Patient can download and print the e-prescription.
        </p>
        <a
          href={`/prescriptions/${consultationId}`}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--forest)] px-4 py-2 text-sm font-bold text-white"
        >
          <FileText className="h-4 w-4" />
          View / Print PDF
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
        <FileText className="h-5 w-5 text-[var(--forest)]" />
        <div>
          <h3 className="font-bold text-[var(--ink)]">Write prescription</h3>
          <p className="text-xs text-[var(--ink-muted)]">
            Medicines, dosage & advice for the patient
          </p>
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[var(--ink-muted)]">
          Diagnosis
        </span>
        <input
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="e.g. Acute viral upper respiratory infection"
          className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--forest)]"
        />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            Medicines
          </span>
          <button
            type="button"
            onClick={() => setItems((p) => [...p, emptyItem()])}
            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--forest)]"
          >
            <Plus className="h-3.5 w-3.5" /> Add medicine
          </button>
        </div>

        {items.map((item, idx) => (
          <div
            key={idx}
            className="relative grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--ivory)] p-3 sm:grid-cols-2"
          >
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="absolute right-2 top-2 rounded p-1 text-red-500 hover:bg-red-50"
              title="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <label className="sm:col-span-2">
              <span className="mb-0.5 block text-[10px] font-semibold text-[var(--ink-muted)]">
                Medicine name
              </span>
              <input
                required
                value={item.medicineName}
                onChange={(e) =>
                  updateItem(idx, { medicineName: e.target.value })
                }
                placeholder="e.g. Paracetamol 500mg"
                className="w-full rounded-md border border-[var(--line)] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[var(--forest)]"
              />
            </label>
            <label>
              <span className="mb-0.5 block text-[10px] font-semibold text-[var(--ink-muted)]">
                Dosage
              </span>
              <input
                value={item.dosage}
                onChange={(e) => updateItem(idx, { dosage: e.target.value })}
                className="w-full rounded-md border border-[var(--line)] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[var(--forest)]"
              />
            </label>
            <label>
              <span className="mb-0.5 block text-[10px] font-semibold text-[var(--ink-muted)]">
                Frequency
              </span>
              <input
                value={item.frequency}
                onChange={(e) => updateItem(idx, { frequency: e.target.value })}
                className="w-full rounded-md border border-[var(--line)] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[var(--forest)]"
              />
            </label>
            <label>
              <span className="mb-0.5 block text-[10px] font-semibold text-[var(--ink-muted)]">
                Duration
              </span>
              <input
                value={item.duration}
                onChange={(e) => updateItem(idx, { duration: e.target.value })}
                className="w-full rounded-md border border-[var(--line)] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[var(--forest)]"
              />
            </label>
            <label>
              <span className="mb-0.5 block text-[10px] font-semibold text-[var(--ink-muted)]">
                Instructions
              </span>
              <input
                value={item.instructions}
                onChange={(e) =>
                  updateItem(idx, { instructions: e.target.value })
                }
                className="w-full rounded-md border border-[var(--line)] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-[var(--forest)]"
              />
            </label>
          </div>
        ))}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[var(--ink-muted)]">
          Advice / notes
        </span>
        <textarea
          value={advice}
          onChange={(e) => setAdvice(e.target.value)}
          rows={2}
          placeholder="Rest, hydration, warning signs…"
          className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--forest)]"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[var(--ink-muted)]">
          Follow-up
        </span>
        <input
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          placeholder="e.g. After 5 days if symptoms persist"
          className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--forest)]"
        />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--forest)] py-3 text-sm font-bold text-white hover:bg-[var(--forest-deep)] disabled:opacity-60"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving…
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" /> Save & issue prescription
          </>
        )}
      </button>
    </form>
  );
}
