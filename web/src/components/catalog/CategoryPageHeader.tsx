"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type Props = {
  slug: string;
  name: string;
  color: string | null;
  image: string | null;
  productCount: number;
};

export function CategoryPageHeader({
  slug,
  name,
  color,
  image,
  productCount,
}: Props) {
  const { t, cat } = useI18n();
  const label = cat(slug, name);

  return (
    <div
      className="relative overflow-hidden border-b border-border"
      style={{ backgroundColor: color || "#E6F9F1" }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-10">
        {image && (
          <div className="relative hidden h-28 w-28 overflow-hidden rounded-3xl shadow-lg sm:block">
            <Image
              src={image}
              alt={label}
              fill
              className="object-cover"
              sizes="112px"
            />
          </div>
        )}
        <div>
          <nav className="mb-2 text-sm text-muted">
            <Link href="/" className="hover:text-brand">
              {t("common.home")}
            </Link>
            <span className="mx-2">/</span>
            <span>{label}</span>
          </nav>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {label}
          </h1>
          <p className="mt-1 text-muted">
            {productCount} {t("category.productsAvailable")}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CategoryEmpty() {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-border bg-white py-20 text-center">
      <p className="text-lg font-semibold">{t("category.empty")}</p>
      <Link
        href="/products"
        className="mt-3 inline-block text-brand hover:underline"
      >
        {t("category.browseAll")}
      </Link>
    </div>
  );
}
