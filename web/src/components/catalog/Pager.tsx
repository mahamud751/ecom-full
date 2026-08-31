import Link from "next/link";

export function pagerPages(current: number, total: number): (number | "gap")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const keep = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) {
    keep.add(2);
    keep.add(3);
    keep.add(4);
  }
  if (current >= total - 2) {
    keep.add(total - 3);
    keep.add(total - 2);
    keep.add(total - 1);
  }
  const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p > prev + 1) out.push("gap");
    out.push(p);
    prev = p;
  }
  return out;
}

export function CatalogPager({
  page,
  totalPages,
  hrefFor,
  prevLabel = "Prev",
  nextLabel = "Next",
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  prevLabel?: string;
  nextLabel?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link
          href={hrefFor(page - 1)}
          className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold hover:border-[var(--forest)]"
        >
          {prevLabel}
        </Link>
      )}
      {pagerPages(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`g-${i}`} className="px-1 text-sm text-[var(--ink-muted)]">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
              p === page
                ? "bg-[var(--forest-deep)] text-white"
                : "border border-[var(--line)] bg-white hover:border-[var(--forest)]"
            }`}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link
          href={hrefFor(page + 1)}
          className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold hover:border-[var(--forest)]"
        >
          {nextLabel}
        </Link>
      )}
    </div>
  );
}
