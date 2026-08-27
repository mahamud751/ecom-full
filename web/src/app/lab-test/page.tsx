import Link from "next/link";
import Image from "next/image";
import { heroImg } from "@/lib/premium-images";
import { apiServer } from "@/lib/api-client";
import { FlaskConical, Home, FileText, Clock, BadgeCheck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { LabBookButton } from "@/components/lab/LabBookButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lab Tests",
  description: "Book lab tests and health packages with home sample collection",
};

export default async function LabTestPage() {
  const { tests, packages } = await apiServer<{
    tests: {
      id: string;
      name: string;
      image: string | null;
      category: string | null;
      reportHours: number;
      bookedCount: number;
      price: number;
      comparePrice: number | null;
    }[];
    packages: {
      id: string;
      name: string;
      reportHours: number;
      price: number;
      comparePrice: number | null;
      items: { test: { name: string } }[];
    }[];
  }>("/lab");

  return (
    <div className="pb-16">
      <div className="relative overflow-hidden bg-[var(--forest-deep)] text-white">
        <div className="absolute inset-0 opacity-30">
          <Image
            src={heroImg.lab}
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="container-main relative py-12 sm:py-16">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              <FlaskConical className="h-3.5 w-3.5 text-[var(--gold)]" />
              Lab at home
            </div>
            <h1 className="font-serif text-3xl font-bold sm:text-4xl">
              Book lab tests & packages
            </h1>
            <p className="mt-3 text-sm text-white/80">
              Home sample collection · Digital reports · Trusted partners
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5">
                <Home className="h-3.5 w-3.5" /> Home collection
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5">
                <Clock className="h-3.5 w-3.5" /> Fast reports
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5">
                <FileText className="h-3.5 w-3.5" /> Digital PDF
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5">
                <BadgeCheck className="h-3.5 w-3.5" /> Quality labs
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-main py-8">
        <h2 className="mb-4 text-lg font-bold">Popular tests</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((t) => (
            <article
              key={t.id}
              className="flex flex-col rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm"
            >
              <div className="flex gap-3">
                {t.image && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--brand-soft)]">
                    <Image
                      src={t.image}
                      alt={t.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-bold">{t.name}</h3>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {t.category || "Lab"} · Report in {t.reportHours}h
                  </p>
                  <p className="text-[10px] text-[var(--ink-muted)]">
                    {t.bookedCount.toLocaleString()}+ booked
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between border-t border-[var(--line)] pt-3">
                <div>
                  <p className="text-lg font-bold">{formatPrice(t.price)}</p>
                  {t.comparePrice && (
                    <p className="text-xs text-gray-400 line-through">
                      {formatPrice(t.comparePrice)}
                    </p>
                  )}
                </div>
                <LabBookButton
                  kind="test"
                  id={t.id}
                  name={t.name}
                  price={t.price}
                />
              </div>
            </article>
          ))}
        </div>

        {tests.length === 0 && (
          <p className="rounded-xl border border-dashed border-[var(--line)] py-10 text-center text-sm text-[var(--ink-muted)]">
            No tests listed yet. Add them from Admin → Lab.
          </p>
        )}

        <h2 className="mb-4 mt-10 text-lg font-bold">Health packages</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm"
            >
              <h3 className="font-bold text-[var(--ink)]">{p.name}</h3>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                {p.items.length} tests · Report in {p.reportHours}h
              </p>
              <p className="mt-2 line-clamp-2 text-xs text-[var(--ink-muted)]">
                {p.items.map((i) => i.test.name).join(", ")}
              </p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xl font-bold text-[var(--forest)]">
                    {formatPrice(p.price)}
                  </p>
                  {p.comparePrice && (
                    <p className="text-xs text-gray-400 line-through">
                      {formatPrice(p.comparePrice)}
                    </p>
                  )}
                </div>
                <LabBookButton
                  kind="package"
                  id={p.id}
                  name={p.name}
                  price={p.price}
                />
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--ink-muted)]">
          Manage lab catalog in{" "}
          <Link
            href="/admin/lab"
            className="font-semibold text-[var(--forest)]"
          >
            Admin portal
          </Link>
        </p>
      </div>
    </div>
  );
}
