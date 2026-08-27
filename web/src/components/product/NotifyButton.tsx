"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Bell, BellRing, Loader2, Check } from "lucide-react";
import { useNotifyStore } from "@/lib/notify-store";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  price: number;
  stock: number;
  /** STOCK when OOS, PRICE always available */
  mode?: "STOCK" | "PRICE" | "auto";
  className?: string;
  compact?: boolean;
  /** Open form immediately (for card request flow) */
  autoOpen?: boolean;
  /** Hide the trigger button when autoOpen (form only) */
  hideTrigger?: boolean;
  onDone?: () => void;
};

export function NotifyButton({
  productId,
  productName,
  productSlug,
  productImage,
  price,
  stock,
  mode = "auto",
  className,
  compact,
  autoOpen,
  hideTrigger,
  onDone,
}: Props) {
  const type: "STOCK" | "PRICE" =
    mode === "auto" ? (stock <= 0 ? "STOCK" : "PRICE") : mode;
  const { has, add, removeByProduct } = useNotifyStore();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(Boolean(autoOpen));
  const [contact, setContact] = useState("");
  const [targetPrice, setTargetPrice] = useState(
    String(Math.max(1, Math.floor(price * 0.9)))
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);
  useEffect(() => {
    try {
      const saved =
        localStorage.getItem("htp_notify_contact") ||
        localStorage.getItem("htp_patient_phone") ||
        "";
      if (saved) setContact(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const active = mounted && has(productId, type);

  // Don't show stock notify if in stock (unless forced PRICE)
  if (type === "STOCK" && stock > 0 && mode === "auto") return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.trim()) return;
    setLoading(true);
    try {
      const res = await apiFetch("/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          contact: contact.trim(),
          type,
          targetPrice: type === "PRICE" ? Number(targetPrice) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      try {
        localStorage.setItem("htp_notify_contact", contact.trim());
      } catch {
        /* ignore */
      }

      add({
        id: data.notify.id,
        productId,
        productName,
        productSlug,
        productImage,
        type,
        contact: contact.trim(),
        contactType: contact.includes("@") ? "email" : "phone",
        targetPrice: type === "PRICE" ? Number(targetPrice) : null,
        priceWhenSet: price,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      });

      toast(
        type === "STOCK"
          ? "Request sent — we'll notify when stock is available"
          : "Price-drop alert set",
        "notify"
      );
      setOpen(false);
      onDone?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "info");
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    removeByProduct(productId, type);
    toast("Alert removed", "info");
  }

  function closeForm() {
    setOpen(false);
    onDone?.();
  }

  if (active) {
    return (
      <button
        type="button"
        onClick={cancel}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border border-amber-300 bg-amber-50 font-bold text-amber-800 transition hover:bg-amber-100",
          compact ? "px-3 py-2 text-xs" : "px-5 py-3 text-sm",
          className
        )}
      >
        <BellRing className="h-4 w-4" />
        Request active · Tap to cancel
      </button>
    );
  }

  const formUi = open && (
    <div
      className={cn(
        !hideTrigger && !autoOpen
          ? "fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          : ""
      )}
    >
      {!hideTrigger && !autoOpen && (
        <div className="absolute inset-0" onClick={closeForm} />
      )}
      <form
        onSubmit={submit}
        className={cn(
          !hideTrigger && !autoOpen
            ? "relative z-10 w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
            : "w-full space-y-0"
        )}
      >
        {(!hideTrigger && !autoOpen) && (
          <div className="mb-3 flex items-start gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--ink)]">
                {type === "STOCK"
                  ? "Request when back in stock"
                  : "Price-drop alert"}
              </h3>
              <p className="text-xs text-[var(--ink-muted)] line-clamp-2">
                {productName}
              </p>
              {type === "STOCK" && (
                <p className="mt-0.5 text-[11px] font-bold text-red-600">
                  Current stock: 0
                </p>
              )}
            </div>
          </div>
        )}

        {(hideTrigger || autoOpen) && (
          <div className="mb-3">
            <h3 className="text-sm font-bold text-[var(--ink)]">
              {type === "STOCK"
                ? "Request stock alert"
                : "Set price-drop alert"}
            </h3>
            {type === "STOCK" && (
              <p className="text-[11px] font-semibold text-red-600">
                Stock is 0 — leave phone/email to get notified
              </p>
            )}
          </div>
        )}

        <label className="mb-3 block text-xs font-semibold text-[var(--ink-muted)]">
          Phone or email *
          <input
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="01XXXXXXXXX or you@email.com"
            className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--forest)]"
          />
        </label>

        {type === "PRICE" && (
          <label className="mb-3 block text-xs font-semibold text-[var(--ink-muted)]">
            Notify when price ≤ ৳
            <input
              type="number"
              required
              min={1}
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--forest)]"
            />
            <span className="mt-0.5 block font-normal">
              Current price ৳{price}
            </span>
          </label>
        )}

        <div className="flex gap-2">
          {!autoOpen && (
            <button
              type="button"
              onClick={closeForm}
              className="flex-1 rounded-xl border border-[var(--line)] py-2.5 text-xs font-bold"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[var(--forest)] py-2.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {type === "STOCK" ? "Send request" : "Set alert"}
          </button>
        </div>
      </form>
    </div>
  );

  if (autoOpen || hideTrigger) {
    return formUi;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--forest)] font-bold text-[var(--forest)] transition hover:bg-[var(--brand-soft)]",
          compact
            ? "px-3 py-2 text-xs"
            : "w-full px-5 py-3.5 text-sm sm:w-auto",
          type === "STOCK" &&
            "border-amber-500 bg-amber-500 text-white hover:bg-amber-600 hover:border-amber-600",
          className
        )}
      >
        <Bell className="h-4 w-4" />
        {type === "STOCK" ? "Request when available" : "Notify on price drop"}
      </button>

      {formUi}
    </>
  );
}
