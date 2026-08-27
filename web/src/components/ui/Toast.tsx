"use client";

import { useEffect, useState } from "react";
import { Check, Heart, Bell, ShoppingCart, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastKind = "success" | "wishlist" | "notify" | "cart" | "info";

type ToastState = {
  open: boolean;
  message: string;
  kind: ToastKind;
};

let pushToast: ((message: string, kind?: ToastKind) => void) | null = null;

export function toast(message: string, kind: ToastKind = "success") {
  pushToast?.(message, kind);
}

export function ToastHost() {
  const [state, setState] = useState<ToastState>({
    open: false,
    message: "",
    kind: "success",
  });

  useEffect(() => {
    pushToast = (message, kind = "success") => {
      setState({ open: true, message, kind });
    };
    return () => {
      pushToast = null;
    };
  }, []);

  useEffect(() => {
    if (!state.open) return;
    const t = setTimeout(() => setState((s) => ({ ...s, open: false })), 2800);
    return () => clearTimeout(t);
  }, [state.open, state.message]);

  if (!state.open) return null;

  const Icon =
    state.kind === "wishlist"
      ? Heart
      : state.kind === "notify"
        ? Bell
        : state.kind === "cart"
          ? ShoppingCart
          : Check;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[200] flex justify-center px-4 lg:bottom-8">
      <div
        className={cn(
          "pointer-events-auto flex max-w-md items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm font-semibold shadow-2xl animate-fade-in",
          state.kind === "wishlist" && "border-red-100",
          state.kind === "notify" && "border-amber-100",
          state.kind === "cart" && "border-emerald-100"
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            state.kind === "wishlist" && "bg-red-50 text-red-500",
            state.kind === "notify" && "bg-amber-50 text-amber-600",
            state.kind === "cart" && "bg-emerald-50 text-emerald-600",
            state.kind === "success" && "bg-[var(--brand-soft)] text-[var(--forest)]",
            state.kind === "info" && "bg-sky-50 text-sky-600"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              state.kind === "wishlist" && "fill-red-500"
            )}
          />
        </span>
        <span className="flex-1 text-[var(--ink)]">{state.message}</span>
        <button
          type="button"
          className="rounded-lg p-1 text-[var(--ink-muted)] hover:bg-gray-100"
          onClick={() => setState((s) => ({ ...s, open: false }))}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
