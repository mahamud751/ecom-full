"use client";

import Link from "next/link";
import { useId } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  /** header | footer | compact */
  variant?: "header" | "footer" | "compact";
  className?: string;
  href?: string;
  /** Show the Ahona wordmark next to the A mark */
  showWordmark?: boolean;
};

/** Ahona dawn-A: letter A of the name, with a rising sun (Ahona = dawn). */
function AhonaMark({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const g = `ahona-g-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a5c56" />
          <stop offset="100%" stopColor="#0c2a28" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${g})`} />
      <path
        fill="#c9a227"
        fillRule="evenodd"
        d="M32 9.8 52.4 54h-8.6l-3.45-8.4H23.65L20.2 54H11.6L32 9.8Zm0 14.4 4.35 10.6h-8.7L32 24.2Z"
      />
      <path fill="#e8c547" d="M27.2 34.8a4.8 4.8 0 0 1 9.6 0H27.2Z" />
      <path
        fill="none"
        stroke="#e8c547"
        strokeWidth="1.15"
        strokeLinecap="round"
        d="M32 26.6v2.3M27.7 28.2l1.5 1.7M36.3 28.2l-1.5 1.7"
      />
    </svg>
  );
}

export function BrandLogo({
  variant = "header",
  className,
  href = "/",
  showWordmark = true,
}: Props) {
  const { t } = useI18n();
  const size = variant === "footer" ? 44 : variant === "compact" ? 32 : 36;

  const mark = (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-[var(--forest)]/20 ring-1 ring-black/5",
        variant === "footer" && "shadow-none ring-white/20"
      )}
      style={{ width: size, height: size }}
    >
      <AhonaMark size={size} className="h-full w-full" />
    </span>
  );

  const wordmark =
    showWordmark && variant !== "compact" ? (
      <span className="min-w-0 leading-none">
        <span
          className={cn(
            "font-serif font-semibold tracking-tight",
            variant === "footer"
              ? "text-2xl text-white"
              : "text-[20px] text-[var(--forest-deep)] sm:text-[24px]"
          )}
        >
          Ahona
        </span>
        <span
          className={cn(
            "mt-0.5 hidden text-[9px] font-semibold uppercase tracking-[0.2em] sm:block",
            variant === "footer"
              ? "block text-[var(--gold)]"
              : "text-[var(--gold-deep)]"
          )}
        >
          {t("brand.tagline")}
        </span>
      </span>
    ) : null;

  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2.5", className)}
      aria-label="Ahona Home"
    >
      {mark}
      {wordmark}
    </Link>
  );
}
