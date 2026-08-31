import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, FlaskConical } from "lucide-react";
import { apiServer, ApiClientError } from "@/lib/api-client";
import { formatPrice } from "@/lib/utils";
import { CatalogImage } from "@/components/product/CatalogImage";
import { LabBookButton } from "@/components/lab/LabBookButton";

export const dynamic = "force-dynamic";

type TestLite = {
  id: string;
  name: string;
  slug: string;
  price: number;
  sampleType: string | null;
  reportHours: number;
};

type Pkg = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  price: number;
  comparePrice: number | null;
  reportHours: number;
  items: { test: TestLite }[];
};

type Payload = { package: Pkg; related: Pkg[] };
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const { package: pkg } = await apiServer<Payload>(
      `/lab/packages/${encodeURIComponent(slug)}`,
    );
    return {
      title: `${pkg.name} — Lab package`,
      description: pkg.description?.slice(0, 160) || `Book ${pkg.name}.`,
    };
  } catch {
    return { title: "Lab package" };
  }
}

export default async function LabPackageDetailPage({ params }: Props) {
  const { slug } = await params;
  let data: Payload;
  try {
    data = await apiServer<Payload>(
      `/lab/packages/${encodeURIComponent(slug)}`,
    );
  } catch (e) {
    if (e instanceof ApiClientError && e.status === 404) notFound();
    throw e;
  }
  const pkg = data.package;
  const related = data.related || [];

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
          <span className="font-semibold text-[var(--ink)]">{pkg.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-[var(--line)] bg-white">
            {pkg.image ? (
              <CatalogImage
                src={pkg.image}
                alt={pkg.name}
                fill
                className="object-cover"
                sizes="50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <FlaskConical className="h-16 w-16 text-[var(--forest)]/30" />
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--forest)]">
              Health package
            </p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">{pkg.name}</h1>
            <p className="mt-2 flex items-center gap-1 text-sm text-[var(--ink-muted)]">
              <Clock className="h-4 w-4" />
              {pkg.items.length} tests · Report in {pkg.reportHours}h
            </p>
            {pkg.description && (
              <p className="mt-4 whitespace-pre-wrap text-[var(--ink-muted)]">
                {pkg.description}
              </p>
            )}
            <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--brand-soft)]/50 p-5">
              <div className="flex flex-wrap items-end gap-3">
                <span className="text-3xl font-black">{formatPrice(pkg.price)}</span>
                {pkg.comparePrice && pkg.comparePrice > pkg.price && (
                  <span className="text-lg text-[var(--ink-muted)] line-through">
                    {formatPrice(pkg.comparePrice)}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <LabBookButton
                  kind="package"
                  id={pkg.id}
                  name={pkg.name}
                  price={pkg.price}
                />
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">Tests included</h2>
          <div className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            {pkg.items.map(({ test }) => (
              <Link
                key={test.id}
                href={`/lab-test/${test.slug}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-[var(--ivory)]"
              >
                <div>
                  <p className="font-semibold">{test.name}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {test.sampleType || "Sample as advised"} · report {test.reportHours}h
                  </p>
                </div>
                <span className="text-sm font-bold">{formatPrice(test.price)}</span>
              </Link>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold">Other packages</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/lab-test/package/${r.slug}`}
                  className="rounded-2xl border border-[var(--line)] bg-white p-4 hover:border-[var(--forest)]"
                >
                  <p className="font-bold">{r.name}</p>
                  <p className="text-sm text-[var(--forest)]">{formatPrice(r.price)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
