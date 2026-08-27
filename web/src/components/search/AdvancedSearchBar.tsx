"use client";

import { useCallback, useEffect, useRef, useState, FormEvent } from "react";
import { apiFetch } from "@/lib/api-client";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Mic,
  MicOff,
  Camera,
  Loader2,
  X,
  Package,
  Stethoscope,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getActiveTabId } from "@/lib/nav-data";
import { useI18n } from "@/lib/i18n";

function localeListeningPlaceholder(speechLang: string) {
  return speechLang.startsWith("bn")
    ? "শুনছি… পণ্য, ডাক্তার বা টেস্ট বলুন"
    : "Listening… say product, doctor or test";
}

type SuggestItem = {
  type: "product" | "doctor" | "lab";
  label: string;
  href: string;
  image: string | null;
  meta?: string;
};

type Props = {
  className?: string;
  size?: "header" | "hero";
  defaultQuery?: string;
  defaultHub?: "all" | "store" | "lab" | "doctor";
  autoFocus?: boolean;
};

export function AdvancedSearchBar({
  className,
  size = "header",
  defaultQuery = "",
  defaultHub,
  autoFocus,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, speechLang } = useI18n();
  const activeId = getActiveTabId(pathname);
  const hub: "all" | "store" | "lab" | "doctor" =
    defaultHub ||
    (activeId === "lab"
      ? "lab"
      : activeId === "doctor"
        ? "doctor"
        : activeId === "store"
          ? "store"
          : "all");

  const [query, setQuery] = useState(defaultQuery);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [openSug, setOpenSug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SR =
      typeof window !== "undefined"
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).SpeechRecognition ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).webkitSpeechRecognition
        : null;
    setVoiceSupported(Boolean(SR));
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpenSug(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Live suggestions from your data
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await apiFetch(
          `/search/suggest?q=${encodeURIComponent(q)}`,
        );
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setOpenSug(true);
      } catch {
        /* ignore */
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  function goSearch(q: string, extra?: { mode?: string }) {
    const text = q.trim();
    if (!text && !extra?.mode) return;
    const params = new URLSearchParams();
    if (text) params.set("q", text);
    if (hub !== "all") params.set("hub", hub);
    if (extra?.mode) params.set("mode", extra.mode);
    router.push(`/search?${params.toString()}`);
    setOpenSug(false);
    setListening(false);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    goSearch(query);
  }

  const stopVoice = useCallback(() => {
    try {
      recogRef.current?.stop?.();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  function toggleVoice() {
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError(t("search.voiceUnsupported"));
      return;
    }

    if (listening) {
      stopVoice();
      return;
    }

    const recog = new SR();
    recogRef.current = recog;
    recog.lang = speechLang;
    recog.interimResults = true;
    recog.continuous = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recog.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setQuery(transcript);
      if (event.results[event.results.length - 1].isFinal) {
        const finalText = transcript.trim();
        setListening(false);
        if (finalText) goSearch(finalText, { mode: "voice" });
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recog.onerror = (ev: any) => {
      setListening(false);
      if (ev.error !== "aborted") {
        setError(t("search.micBlocked"));
      }
    };
    recog.onend = () => setListening(false);

    setListening(true);
    try {
      recog.start();
    } catch {
      setListening(false);
      setError(t("search.micFail"));
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function onImageFile(file?: File | null) {
    if (!file) return;
    const looksLikeImage =
      file.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(file.name);
    if (!looksLikeImage) {
      setError(t("search.imageHint"));
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("hub", hub);
      if (query.trim()) fd.append("hint", query.trim());
      const res = await apiFetch("/search/image", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image search failed");

      try {
        sessionStorage.setItem(
          "htp_image_search",
          JSON.stringify({
            imageUrl: data.imageUrl,
            derivedQuery: data.derivedQuery,
            matchedTokens: data.matchedTokens || [],
            weakMatch: data.weakMatch,
            tip: data.tip,
            total: data.total,
            productIds: data.productIds || [],
            at: Date.now(),
          }),
        );
      } catch {
        /* ignore */
      }

      const params = new URLSearchParams();
      params.set("mode", "image");
      if (data.derivedQuery) params.set("q", data.derivedQuery);
      if (hub !== "all") params.set("hub", hub);
      if (data.imageUrl) params.set("img", data.imageUrl);
      if (Array.isArray(data.productIds) && data.productIds.length) {
        params.set("ids", data.productIds.join(","));
      }
      if (data.weakMatch) params.set("weak", "1");
      router.push(`/search?${params.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image search failed");
    } finally {
      setUploading(false);
    }
  }

  const isHero = size === "hero";

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={onSubmit}
        className={cn(
          "flex items-center gap-1 rounded-2xl border bg-white shadow-sm transition focus-within:border-[var(--forest)] focus-within:ring-2 focus-within:ring-[var(--forest)]/15",
          isHero
            ? "border-[var(--line)] px-2 py-2"
            : "border-[var(--line)] px-1.5 py-1",
        )}
      >
        <Search
          className={cn(
            "ml-2 shrink-0 text-[var(--ink-muted)]",
            isHero ? "h-5 w-5" : "h-4 w-4",
          )}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length && setOpenSug(true)}
          autoFocus={autoFocus}
          placeholder={
            listening
              ? localeListeningPlaceholder(speechLang)
              : hub === "lab"
                ? t("search.placeholderLab")
                : hub === "doctor"
                  ? t("search.placeholderDoctor")
                  : hub === "store"
                    ? t("search.placeholderStore")
                    : t("search.placeholder")
          }
          className={cn(
            "min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--ink-muted)]",
            isHero ? "px-2 py-2 text-base" : "px-2 py-2 text-sm",
          )}
        />

        {/* Voice */}
        <button
          type="button"
          onClick={toggleVoice}
          disabled={!voiceSupported && false}
          title={
            voiceSupported
              ? listening
                ? t("search.voiceStop")
                : t("search.voice")
              : t("search.voice")
          }
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition",
            listening
              ? "bg-red-500 text-white animate-pulse"
              : "text-[var(--ink-muted)] hover:bg-[var(--ivory)] hover:text-[var(--forest)]",
          )}
        >
          {listening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>

        {/* Image */}
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg border border-[var(--line)] object-cover"
          />
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Search by image"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--ink-muted)] hover:bg-[var(--ivory)] hover:text-[var(--forest)] disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif,.avif"
          className="hidden"
          onChange={(e) => {
            void onImageFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <button
          type="submit"
          className={cn(
            "shrink-0 rounded-xl bg-[var(--forest)] font-bold text-white hover:bg-[var(--forest-deep)]",
            isHero ? "px-5 py-2.5 text-sm" : "px-3.5 py-2 text-xs",
          )}
        >
          Search
        </button>
      </form>

      {listening && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          Listening — mention product, doctor specialty, or lab test
        </p>
      )}
      {uploading && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-sky-700">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Searching catalog from your image…
        </p>
      )}
      {error && (
        <p className="mt-1.5 text-[11px] font-medium text-red-600">{error}</p>
      )}

      {/* Live suggestions from DB */}
      {openSug && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto rounded-2xl border border-[var(--line)] bg-white py-2 shadow-xl">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--ink-muted)]">
            From your catalog
          </p>
          {suggestions.map((s, i) => {
            const Icon =
              s.type === "doctor"
                ? Stethoscope
                : s.type === "lab"
                  ? FlaskConical
                  : Package;
            return (
              <button
                key={`${s.href}-${i}`}
                type="button"
                onClick={() => {
                  setOpenSug(false);
                  router.push(s.href);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--ivory)]"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--brand-soft)]">
                  {s.image ? (
                    <Image
                      src={s.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                      unoptimized={
                        s.image.startsWith("/uploads/") ||
                        s.image.startsWith("/brand/")
                      }
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Icon className="h-4 w-4 text-[var(--forest)]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.label}</p>
                  <p className="text-[10px] text-[var(--ink-muted)]">
                    {s.type} {s.meta ? `· ${s.meta}` : ""}
                  </p>
                </div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => goSearch(query)}
            className="mt-1 flex w-full items-center justify-center gap-1 border-t border-[var(--line)] px-3 py-2.5 text-xs font-bold text-[var(--forest)]"
          >
            <Search className="h-3.5 w-3.5" /> See all results for “{query}”
          </button>
        </div>
      )}
    </div>
  );
}

export function ImageSearchClearButton() {
  return (
    <button
      type="button"
      onClick={() => {
        try {
          sessionStorage.removeItem("htp_image_search");
        } catch {
          /* ignore */
        }
      }}
      className="inline-flex items-center gap-1 text-xs text-[var(--ink-muted)]"
    >
      <X className="h-3 w-3" /> Clear image
    </button>
  );
}
