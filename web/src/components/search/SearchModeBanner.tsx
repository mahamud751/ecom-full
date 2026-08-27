"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Mic, Search } from "lucide-react";
import { IMAGE_CATEGORY_HINTS } from "@/lib/image-search";

export function SearchModeBanner({
  mode,
  query,
  img,
  weak,
  matchCount,
}: {
  mode: string;
  query: string;
  img?: string;
  weak?: boolean;
  matchCount?: number;
}) {
  const [tip, setTip] = useState<string | null>(null);
  const [tokens, setTokens] = useState<string[]>([]);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
    if (mode !== "image") return;
    try {
      const raw = sessionStorage.getItem("htp_image_search");
      if (!raw) return;
      const data = JSON.parse(raw) as {
        tip?: string;
        matchedTokens?: string[];
        at?: number;
      };
      if (data.at && Date.now() - data.at > 10 * 60 * 1000) return;
      if (data.tip) setTip(data.tip);
      if (data.matchedTokens?.length) setTokens(data.matchedTokens.slice(0, 8));
    } catch {
      /* ignore */
    }
  }, [mode, img]);

  if (!query && mode === "text") return null;

  if (mode === "image") {
    const preview = img && !broken ? img : "";
    return (
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 sm:flex-row sm:items-center">
          {preview ? (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm">
              {/* Native img: uploaded JPEG must render even if next/image rejects it */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Your search image"
                className="h-full w-full object-cover"
                onError={() => setBroken(true)}
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Camera className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
              Image search · visual match
            </p>
            <p className="text-sm font-semibold text-[var(--ink)]">
              {typeof matchCount === "number"
                ? `${matchCount} product${matchCount === 1 ? "" : "s"} that look like your photo`
                : query
                  ? <>Matched: <span className="text-[var(--forest)]">&ldquo;{query}&rdquo;</span></>
                  : "Upload a product photo to find the same item"}
            </p>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              {tip ||
                "We compare your photo to catalog product images — not a generic popular list."}
            </p>
            {tokens.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tokens.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-sky-800 ring-1 ring-sky-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {weak && (
          <div className="rounded-xl border border-dashed border-sky-200 bg-white p-3">
            <p className="mb-2 text-[11px] font-bold text-[var(--ink-muted)]">
              No close photo match — try a category
            </p>
            <div className="flex flex-wrap gap-2">
              {IMAGE_CATEGORY_HINTS.map((c) => (
                <Link
                  key={c.id}
                  href={`/search?q=${encodeURIComponent(c.q)}${img ? `&img=${encodeURIComponent(img)}` : ""}`}
                  className="rounded-full bg-sky-50 px-3 py-1.5 text-[11px] font-semibold text-sky-900 ring-1 ring-sky-100 hover:bg-sky-100"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === "voice") {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <Mic className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-red-700">
            Voice search
          </p>
          <p className="text-sm font-semibold">
            You said:{" "}
            <span className="text-[var(--forest)]">&ldquo;{query}&rdquo;</span>
          </p>
        </div>
      </div>
    );
  }

  if (query) {
    return (
      <div className="mb-4 flex items-center gap-2 text-sm text-[var(--ink-muted)]">
        <Search className="h-4 w-4" />
        Results for{" "}
        <strong className="text-[var(--ink)]">&ldquo;{query}&rdquo;</strong>
      </div>
    );
  }

  return null;
}
