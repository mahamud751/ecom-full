"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function AdminCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm md:p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <AdminCard className="relative overflow-hidden">
      <div
        className={cn(
          "absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full opacity-20",
          accent || "bg-[var(--forest)]"
        )}
      />
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--ink-muted)]">{hint}</p>}
    </AdminCard>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[var(--ink-muted)]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Btn({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-50",
        variant === "primary" &&
          "bg-[var(--forest)] text-white hover:bg-[var(--forest-deep)]",
        variant === "secondary" &&
          "border border-[var(--line)] bg-white hover:border-[var(--forest)]",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-500",
        variant === "ghost" && "hover:bg-gray-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { label, className, ...rest } = props;
  return (
    <label className="block text-xs">
      {label && (
        <span className="mb-1 block font-semibold text-[var(--ink-muted)]">
          {label}
        </span>
      )}
      <input
        className={cn(
          "w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--forest)]",
          className
        )}
        {...rest}
      />
    </label>
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }
) {
  const { label, className, children, ...rest } = props;
  return (
    <label className="block text-xs">
      {label && (
        <span className="mb-1 block font-semibold text-[var(--ink-muted)]">
          {label}
        </span>
      )}
      <select
        className={cn(
          "w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--forest)]",
          className
        )}
        {...rest}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
) {
  const { label, className, ...rest } = props;
  return (
    <label className="block text-xs">
      {label && (
        <span className="mb-1 block font-semibold text-[var(--ink-muted)]">
          {label}
        </span>
      )}
      <textarea
        className={cn(
          "w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--forest)]",
          className
        )}
        {...rest}
      />
    </label>
  );
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "amber" | "red" | "blue";
}) {
  const map = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    blue: "bg-sky-100 text-sky-800",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold",
        map[tone]
      )}
    >
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--line)] bg-white px-5 py-3">
          <h2 className="font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--line)] py-12 text-center text-sm text-[var(--ink-muted)]">
      {text}
    </div>
  );
}

/** Page info returned by paginated admin list endpoints. */
export type Pagination = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

/** Prev / next pager for admin lists; hidden while everything fits one page. */
export function Pager({
  pagination,
  onPage,
  disabled,
}: {
  pagination?: Pagination | null;
  onPage: (page: number) => void;
  disabled?: boolean;
}) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total, perPage } = pagination;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[var(--ink-muted)]">
      <span>
        {from.toLocaleString()}–{to.toLocaleString()} of{" "}
        {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-2">
        <Btn
          variant="secondary"
          disabled={disabled || page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Prev
        </Btn>
        <span className="font-bold text-[var(--ink)]">
          {page} / {totalPages.toLocaleString()}
        </span>
        <Btn
          variant="secondary"
          disabled={disabled || page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Btn>
      </div>
    </div>
  );
}

/**
 * Current page for a filtered list. Changing `filterKey` (e.g. status or
 * search) snaps back to page 1 in the same render, so there's no extra fetch
 * of the old page under the new filter.
 */
export function useListPage(filterKey: string) {
  const [state, setState] = useState({ key: filterKey, page: 1 });
  const page = state.key === filterKey ? state.page : 1;
  const setPage = (next: number) => setState({ key: filterKey, page: next });
  return [page, setPage] as const;
}
