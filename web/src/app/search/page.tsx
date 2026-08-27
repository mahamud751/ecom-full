import { smartSearch } from "@/lib/smart-search";
import { IMAGE_CATEGORY_HINTS } from "@/lib/image-search";
import { readImageSearchMeta } from "@/lib/image-search-meta";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Store,
  FlaskConical,
  Stethoscope,
  Star,
  Mic,
  Camera,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, formatPrice, isLocalMedia } from "@/lib/utils";
import { AdvancedSearchBar } from "@/components/search/AdvancedSearchBar";
import { apiServer } from "@/lib/api-client";
import type { ProductCardData } from "@/components/product/ProductCard";
import { SearchModeBanner } from "@/components/search/SearchModeBanner";

export const dynamic = "force-dynamic";

type Hub = "all" | "store" | "lab" | "doctor";

type Props = {
  searchParams: Promise<{
    q?: string;
    hub?: string;
    mode?: string;
    img?: string;
    weak?: string;
    ids?: string;
  }>;
};

export async function generateMetadata({ searchParams }: Props) {
  const { q, mode } = await searchParams;
  if (mode === "voice") return { title: q ? `Voice: ${q}` : "Voice search" };
  if (mode === "image") return { title: q ? `Image: ${q}` : "Image search" };
  return { title: q ? `Search: ${q}` : "Search" };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (params.q || "").trim();
  const mode = params.mode || "text";
  const img = params.img || "";
  const weak = params.weak === "1";
  const hub = (
    ["all", "store", "lab", "doctor"].includes(params.hub || "")
      ? params.hub
      : "all"
  ) as Hub;

  const imageMeta =
    mode === "image" && img ? await readImageSearchMeta(img) : null;
  const imageIds = (
    params.ids
      ? params.ids
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : imageMeta?.productIds || []
  ).slice(0, 40);

  const isVisualImageSearch =
    mode === "image" && (Boolean(img) || imageIds.length > 0);

  const { hits, suggestions } = isVisualImageSearch
    ? { hits: [], suggestions: imageMeta?.labels || ([] as string[]) }
    : query
      ? await smartSearch(query, { hub, limit: 48 })
      : { hits: [], suggestions: [] as string[] };

  const productsHits = hits.filter((h) => h.type === "product");
  const doctorsHits = hits.filter((h) => h.type === "doctor");
  const labsHits = hits.filter(
    (h) => h.type === "lab_test" || h.type === "lab_package",
  );

  // Hydrate product cards with full product for ProductCard
  const productIds = isVisualImageSearch
    ? imageIds
    : productsHits.map((h) => h.id);
  const products =
    productIds.length > 0
      ? (
          await apiServer<{ products: ProductCardData[] }>(
            `/products/by-ids?ids=${encodeURIComponent(productIds.join(","))}`,
          )
        ).products
      : [];

  const totalHits = isVisualImageSearch ? products.length : hits.length;

  const hubs: { id: Hub; label: string; icon: typeof Store; count?: number }[] =
    [
      {
        id: "all",
        label: "Home",
        icon: Search,
        count: query || isVisualImageSearch ? totalHits : undefined,
      },
      {
        id: "store",
        label: "Pharmacy",
        icon: Store,
        count:
          (isVisualImageSearch ? products.length : productsHits.length) ||
          undefined,
      },
      {
        id: "lab",
        label: "Tests",
        icon: FlaskConical,
        count: labsHits.length || undefined,
      },
      {
        id: "doctor",
        label: "Consult",
        icon: Stethoscope,
        count: doctorsHits.length || undefined,
      },
    ];

  function hubHref(h: Hub) {
    const q = new URLSearchParams();
    if (query) q.set("q", query);
    if (h !== "all") q.set("hub", h);
    if (mode && mode !== "text") q.set("mode", mode);
    if (img) q.set("img", img);
    if (imageIds.length) q.set("ids", imageIds.join(","));
    const s = q.toString();
    return s ? `/search?${s}` : "/search";
  }

  return (
    <div className="container-main pb-20 pt-6 lg:pb-12">
      <div className="mb-6 max-w-3xl">
        <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
          {mode === "voice"
            ? "Voice search"
            : mode === "image"
              ? "Image search"
              : query
                ? "Search results"
                : "Smart search"}
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Text, voice & image — products, doctors & lab from your Ahona data
          {query ? ` · ${totalHits} matches` : ""}
        </p>
        <div className="mt-4">
          <AdvancedSearchBar
            size="hero"
            defaultQuery={query}
            defaultHub={hub}
          />
        </div>
      </div>

      <SearchModeBanner
        mode={mode}
        query={query || imageMeta?.query || ""}
        img={img}
        weak={weak || Boolean(imageMeta?.weak)}
        matchCount={isVisualImageSearch ? products.length : undefined}
      />

      {/* Hub tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar">
        {hubs.map((h) => {
          const Icon = h.icon;
          const active = hub === h.id;
          return (
            <Link
              key={h.id}
              href={hubHref(h.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-[var(--forest-deep)] text-white"
                  : "border border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--forest)]",
              )}
            >
              <Icon className="h-4 w-4" />
              {h.label}
              {typeof h.count === "number" && query && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    active ? "bg-white/20" : "bg-[var(--ivory)]",
                  )}
                >
                  {h.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {!query && !isVisualImageSearch && (
        <div className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm md:p-10">
          <div className="mx-auto max-w-xl text-center">
            <div className="mb-4 flex justify-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--forest)]">
                <Search className="h-5 w-5" />
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <Mic className="h-5 w-5" />
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <Camera className="h-5 w-5" />
              </span>
            </div>
            <p className="font-serif text-xl font-semibold">Search your way</p>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Type a keyword, speak (mic), or upload a product photo — we match
              against medicines, beauty, doctors & lab tests in your catalog.
            </p>
          </div>

          <div className="mt-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">
              Image search shortcuts
            </p>
            <div className="flex flex-wrap gap-2">
              {IMAGE_CATEGORY_HINTS.map((c) => (
                <Link
                  key={c.id}
                  href={`/search?q=${encodeURIComponent(c.q)}&mode=image`}
                  className="rounded-full border border-[var(--line)] bg-[var(--ivory)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--forest)]"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                hub: "store" as Hub,
                title: "Pharmacy",
                tips: ["serum", "vitamin", "paracetamol", "shampoo"],
              },
              {
                hub: "lab" as Hub,
                title: "Tests",
                tips: ["cbc", "thyroid", "diabetes", "lipid"],
              },
              {
                hub: "doctor" as Hub,
                title: "Consult",
                tips: ["skin", "heart", "child", "gynae"],
              },
            ].map((col) => (
              <div
                key={col.hub}
                className="rounded-2xl border border-[var(--line)] bg-[var(--ivory)] p-4"
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--gold-deep)]">
                  {col.title}
                </p>
                <div className="flex flex-wrap gap-2">
                  {col.tips.map((term) => (
                    <Link
                      key={term}
                      href={`/search?q=${encodeURIComponent(term)}&hub=${col.hub}`}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold capitalize text-[var(--ink)] ring-1 ring-[var(--line)] hover:ring-[var(--forest)]"
                    >
                      {term}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(query || isVisualImageSearch) && suggestions.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[var(--ink-muted)]">
            Related:
          </span>
          {suggestions.slice(0, 8).map((s) => (
            <Link
              key={s}
              href={`/search?q=${encodeURIComponent(s)}${hub !== "all" ? `&hub=${hub}` : ""}`}
              className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold ring-1 ring-[var(--line)] hover:ring-[var(--forest)]"
            >
              {s}
            </Link>
          ))}
        </div>
      )}

      {/* Products — image-first for image mode */}
      {(hub === "all" || hub === "store") && (query || isVisualImageSearch) && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold">
              Products
              <span className="ml-2 text-sm font-normal text-[var(--ink-muted)]">
                ({products.length})
              </span>
            </h2>
            <Link
              href="/store"
              className="text-sm font-semibold text-[var(--forest)] hover:underline"
            >
              Browse store
            </Link>
          </div>
          {products.length === 0 ? (
            <EmptyState
              title={
                isVisualImageSearch
                  ? "No matching product photos"
                  : "No products found"
              }
              description={
                isVisualImageSearch
                  ? "Upload a clearer catalog-style product photo, or type the product name."
                  : "Try voice search or another keyword."
              }
              actionHref="/store"
              actionLabel="Open store"
            />
          ) : (
            <div className="product-grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} variant="grid" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Lab */}
      {(hub === "all" || hub === "lab") && query && !isVisualImageSearch && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold">
              Lab tests & packages
              <span className="ml-2 text-sm font-normal text-[var(--ink-muted)]">
                ({labsHits.length})
              </span>
            </h2>
            <Link
              href="/lab-test"
              className="text-sm font-semibold text-[var(--forest)] hover:underline"
            >
              All lab tests
            </Link>
          </div>
          {labsHits.length === 0 ? (
            hub === "lab" ? (
              <EmptyState
                title="No lab tests found"
                description="Try cbc, thyroid, dengue, or diabetes."
                actionHref="/lab-test"
                actionLabel="Browse lab"
              />
            ) : null
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {labsHits.map((t) => (
                <Link
                  key={t.id}
                  href={t.href}
                  className="flex gap-3 rounded-2xl border border-[var(--line)] bg-white p-3 shadow-sm transition hover:border-[var(--forest)] hover:shadow-md"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--ivory)]">
                    {t.image ? (
                      <Image
                        src={t.image}
                        alt={t.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized={isLocalMedia(t.image)}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FlaskConical className="h-6 w-6 text-[var(--forest)]/40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--gold-deep)]">
                      {t.badges?.[0] || "Lab"}
                    </span>
                    <h3 className="line-clamp-2 text-sm font-bold text-[var(--ink)]">
                      {t.title}
                    </h3>
                    <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                      {t.subtitle}
                    </p>
                    {t.price != null && (
                      <p className="mt-1 text-sm font-bold">
                        {formatPrice(t.price)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Doctors */}
      {(hub === "all" || hub === "doctor") && query && !isVisualImageSearch && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold">
              Doctors
              <span className="ml-2 text-sm font-normal text-[var(--ink-muted)]">
                ({doctorsHits.length})
              </span>
            </h2>
            <Link
              href="/doctors"
              className="text-sm font-semibold text-[var(--forest)] hover:underline"
            >
              All doctors
            </Link>
          </div>
          {doctorsHits.length === 0 ? (
            hub === "doctor" ? (
              <EmptyState
                title="No doctors found"
                description="Try skin, heart, child, or general physician."
                actionHref="/doctors"
                actionLabel="Browse doctors"
              />
            ) : null
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {doctorsHits.map((d) => (
                <Link
                  key={d.id}
                  href={d.href}
                  className="flex gap-3 rounded-2xl border border-[var(--line)] bg-white p-3 shadow-sm transition hover:border-[var(--forest)] hover:shadow-md"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--ivory)]">
                    {d.image ? (
                      <Image
                        src={d.image}
                        alt={d.title}
                        fill
                        className="object-cover object-top"
                        sizes="80px"
                        unoptimized={isLocalMedia(d.image)}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[var(--ink)]">{d.title}</h3>
                    <p className="text-sm text-[var(--forest)]">{d.subtitle}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {d.badges?.map((b) => (
                        <span
                          key={b}
                          className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                    {d.price != null && (
                      <p className="mt-1 flex items-center gap-1 text-sm font-bold">
                        <Star className="h-3 w-3 fill-[var(--gold)] text-[var(--gold)]" />
                        {formatPrice(d.price)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {(query || isVisualImageSearch) && totalHits === 0 && (
        <EmptyState
          title="Nothing matched"
          description="Try voice search, another photo, or browse Store / Lab / Doctors."
          actionHref="/store"
          actionLabel="Browse store"
        />
      )}
    </div>
  );
}
