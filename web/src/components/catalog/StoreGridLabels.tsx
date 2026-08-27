"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function StoreShowing({
  shown,
  total,
}: {
  shown: number;
  total: number;
}) {
  const { t } = useI18n();
  return (
    <div className="mb-3 flex items-center justify-between text-sm">
      <p className="text-[var(--ink-muted)]">
        <strong className="text-[var(--ink)]">{shown}</strong> /{" "}
        <strong className="text-[var(--ink)]">{total}</strong>{" "}
        {t("store.productsCount")}
      </p>
    </div>
  );
}

export function StoreEmptyState() {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white py-20 text-center">
      <p className="font-semibold">{t("store.noProducts")}</p>
      <Link
        href="/store"
        className="mt-3 inline-block text-sm font-semibold text-[var(--forest)]"
      >
        {t("store.clearAll")}
      </Link>
    </div>
  );
}

export function StorePageLabel({
  kind,
}: {
  kind: "prev" | "next";
}) {
  const { t } = useI18n();
  return <>{kind === "prev" ? t("store.prev") : t("store.next")}</>;
}
