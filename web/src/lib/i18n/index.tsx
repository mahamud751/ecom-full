"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type Locale,
  type MessageKey,
  messages,
  translate,
} from "./messages";
import {
  localizeCategory,
  localizePhrase,
  localizeSpecialty,
} from "./catalog";

const STORAGE_KEY = "htp_locale";

type I18nCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey) => string;
  /** SpeechRecognition BCP-47 tag for voice search */
  speechLang: string;
  /** Category slug → localized name */
  cat: (slug: string, fallbackName: string) => string;
  /** Doctor specialty */
  specialty: (name: string) => string;
  /** Free-form chrome phrase (mega menu etc.) */
  phrase: (text: string) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

function applyDocumentLang(l: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = l === "bn" ? "bn" : "en";
  document.documentElement.dataset.locale = l;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "en" || saved === "bn") {
        setLocaleState(saved);
        applyDocumentLang(saved);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      applyDocumentLang(l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: MessageKey) => translate(locale, key),
    [locale]
  );

  const speechLang = locale === "bn" ? "bn-BD" : "en-US";

  const cat = useCallback(
    (slug: string, fallbackName: string) =>
      localizeCategory(locale, slug, fallbackName),
    [locale]
  );
  const specialty = useCallback(
    (name: string) => localizeSpecialty(locale, name),
    [locale]
  );
  const phrase = useCallback(
    (text: string) => localizePhrase(locale, text),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, speechLang, cat, specialty, phrase }),
    [locale, setLocale, t, speechLang, cat, specialty, phrase]
  );

  // Avoid flash of wrong language labels after hydrate when user chose BN
  if (!ready) {
    return (
      <Ctx.Provider value={value}>
        <div className="contents" suppressHydrationWarning>
          {children}
        </div>
      </Ctx.Provider>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      locale: "en" as Locale,
      setLocale: (_l: Locale) => {},
      t: (key: MessageKey) => messages.en[key] || key,
      speechLang: "en-US",
      cat: (slug: string, fallbackName: string) => fallbackName,
      specialty: (name: string) => name,
      phrase: (text: string) => text,
    };
  }
  return ctx;
}

export {
  localizeCategory,
  localizePhrase,
  localizeSpecialty,
} from "./catalog";

/**
 * Daraz-style language switcher: EN | বাংলা
 * Active locale is bold + gold underline.
 */
export function LanguageToggle({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-[var(--line)] bg-white p-0.5 text-[11px] font-bold ${className}`}
      role="group"
      aria-label={t("header.language")}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-md px-2 py-1 transition ${
          locale === "en"
            ? "bg-[var(--forest-deep)] text-white shadow-sm"
            : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
        }`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("bn")}
        className={`rounded-md px-2 py-1 transition ${
          locale === "bn"
            ? "bg-[var(--forest-deep)] text-white shadow-sm"
            : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
        } ${compact ? "" : "min-w-[3.25rem]"}`}
        aria-pressed={locale === "bn"}
      >
        বাংলা
      </button>
    </div>
  );
}

export type { Locale, MessageKey };
export { messages, translate };
