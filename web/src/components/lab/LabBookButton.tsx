"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export function LabBookButton({
  kind,
  id,
  name,
  price,
}: {
  kind: "test" | "package";
  id: string;
  name: string;
  price: number;
}) {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          address,
          ...(kind === "test" ? { labTestId: id } : { labPackageId: id }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDone(data.booking.bookingNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[var(--forest)] px-3 py-2 text-xs font-bold text-white hover:bg-[var(--forest-deep)]"
      >
        Book
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            {done ? (
              <div className="text-center">
                <p className="font-bold text-emerald-700">Booking confirmed</p>
                <p className="mt-1 font-mono text-sm">{done}</p>
                <p className="mt-2 text-xs text-[var(--ink-muted)]">
                  {name} · {formatPrice(price)} — our team will call for sample
                  collection.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setDone(null);
                  }}
                  className="mt-4 rounded-lg bg-[var(--forest)] px-4 py-2 text-xs font-bold text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-[var(--forest)]">
                    Book lab
                  </p>
                  <h3 className="font-bold">{name}</h3>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {formatPrice(price)}
                  </p>
                </div>
                <input
                  required
                  placeholder="Full name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--forest)]"
                />
                <input
                  required
                  placeholder="Phone *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--forest)]"
                />
                <input
                  placeholder="Collection address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--forest)]"
                />
                {error && (
                  <p className="rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-700">
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg border border-[var(--line)] py-2.5 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[var(--forest)] py-2.5 text-xs font-bold text-white"
                  >
                    {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirm
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
