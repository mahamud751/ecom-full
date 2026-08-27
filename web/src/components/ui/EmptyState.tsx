import Link from "next/link";
import { type LucideIcon, PackageOpen } from "lucide-react";

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-[var(--line)] bg-white px-6 py-16 text-center shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--ivory)] text-[var(--forest)]">
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h3 className="font-serif text-xl font-semibold text-[var(--ink)]">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[var(--ink-muted)]">
          {description}
        </p>
      )}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-6 rounded-full bg-[var(--forest-deep)] px-6 py-2.5 text-sm font-bold text-white hover:bg-[var(--forest)]"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
