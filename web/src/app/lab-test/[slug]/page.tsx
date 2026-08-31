import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FlaskConical,
  Clock,
  Droplets,
  UtensilsCrossed,
  ChevronRight,
  Home,
  FileText,
} from "lucide-react";
import { apiServer, ApiClientError } from "@/lib/api-client";
import { formatPrice } from "@/lib/utils";
import { CatalogImage } from "@/components/product/CatalogImage";
import { LabBookButton } from "@/components/lab/LabBookButton";

export const dynamic = "force-dynamic";

type LabTest = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  alsoKnownAs: string | null;
  sampleType: string | null;
  fastingRequired: boolean;
  preparation: string | null;
  image: string | null;
  price: number;
  comparePrice: number | null;
  reportHours: number;
  bookedCount: number;
  category: string | null;
};

type Payload = { test: LabTest; related: LabTest[] };

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const { test } = await apiServer<Payload>(
      `/lab/tests/${encodeURIComponent(slug)}`,
    );
    return {
      title: `${test.name} — Lab test`,
      description:
        test.description?.slice(0, 160) ||
        `Book ${test.name} with home sample collection.`,
    };
  } catch {
    return { title: "Lab test" };
  }
}

export default async function LabTestDetailPage({ params }: Props) {
  const { slug } = await params;
  let data: Payload;
  try {
    data = await apiServer<Payload>(`/lab/tests/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e instanceof ApiClientError && e.status === 404) notFound();
    throw e;
  }
  const { test, related } = data;

  return (
    <div className="pb-16">
      <div className="container-main py-6">
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
          <Link href="/" className="font-medium text-[var(--forest)] hover:underline">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href="/lab-test"
            className="font-medium text-[var(--forest)] hover:underline"
          >
            Lab tests
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate font-semibold text-[var(--ink)]">{test.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-[var(--line)] bg-white">
            {test.image ? (
              <CatalogImage
                src={test.image}
                alt={test.name}
                fill
                className="object-contain p-8"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--forest)]">
                <FlaskConical className="h-16 w-16 opacity-30" />
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
              {test.category || "Lab test"}
            </p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">{test.name}</h1>
            {test.alsoKnownAs && (
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{test.alsoKnownAs}</p>
            )}
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              {test.bookedCount.toLocaleString()}+ booked on Ahona
            </p>

            <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--brand-soft)]/50 p-5">
              <div className="flex flex-wrap items-end gap-3">
                <span className="text-3xl font-black text-[var(--forest-deep)]">
                  {formatPrice(test.price)}
                </span>
                {test.comparePrice && test.comparePrice > test.price && (
                  <span className="text-lg text-[var(--ink-muted)] line-through">
                    {formatPrice(test.comparePrice)}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">
                Home sample collection · Digital report
              </p>
              <div className="mt-4">
                <LabBookButton
                  kind="test"
                  id={test.id}
                  name={test.name}
                  price={test.price}
                />
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-[var(--line)] bg-white p-3">
                <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase text-[var(--ink-muted)]">
                  <Droplets className="h-3.5 w-3.5" /> Sample
                </dt>
                <dd className="mt-1 font-bold">{test.sampleType || "As advised"}</dd>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-white p-3">
                <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase text-[var(--ink-muted)]">
                  <Clock className="h-3.5 w-3.5" /> Report
                </dt>
                <dd className="mt-1 font-bold">{test.reportHours} hours</dd>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-white p-3">
                <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase text-[var(--ink-muted)]">
                  <UtensilsCrossed className="h-3.5 w-3.5" /> Fasting
                </dt>
                <dd className="mt-1 font-bold">
                  {test.fastingRequired ? "Required" : "Not required"}
                </dd>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-white p-3">
                <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase text-[var(--ink-muted)]">
                  <Home className="h-3.5 w-3.5" /> Collection
                </dt>
                <dd className="mt-1 font-bold">At home</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-10 space-y-6">
          <section className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
              <FileText className="h-5 w-5 text-[var(--forest)]" /> About this test
            </h2>
            <p className="whitespace-pre-wrap leading-relaxed text-[var(--ink-muted)]">
              {test.description || "Details will be confirmed by our lab partner."}
            </p>
          </section>
          {test.preparation && (
            <section className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-3 text-xl font-bold">How to prepare</h2>
              <p className="whitespace-pre-wrap leading-relaxed text-[var(--ink-muted)]">
                {test.preparation}
              </p>
            </section>
          )}
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold">Related tests</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/lab-test/${r.slug}`}
                  className="flex gap-3 rounded-2xl border border-[var(--line)] bg-white p-3 shadow-sm transition hover:border-[var(--forest)]"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--brand-soft)]">
                    {r.image ? (
                      <CatalogImage
                        src={r.image}
                        alt=""
                        fill
                        className="object-contain p-1"
                        sizes="56px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{r.name}</p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {r.category} · {formatPrice(r.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
