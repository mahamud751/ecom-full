"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { setAccessToken } from "@/lib/api-client";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function AuthModal() {
  const { authOpen, authTab, setAuthOpen, setUser, refresh } = useAuthStore();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });

  useEffect(() => {
    if (authOpen) {
      setTab(authTab);
      setError("");
    }
  }, [authOpen, authTab]);

  useEffect(() => {
    if (authOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [authOpen]);

  if (!authOpen) return null;

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "register") {
        if (form.password !== form.confirm) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        const res = await fetch("/api/auth-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            kind: "customer",
            action: "register",
            payload: {
              name: form.name,
              email: form.email,
              phone: form.phone,
              password: form.password,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sign up failed");
        setAccessToken("customer", data.accessToken || null);
        setUser(data.user);
        analytics.lead("signup");
        setAuthOpen(false);
      } else {
        const res = await fetch("/api/auth-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            kind: "customer",
            action: "login",
            payload: {
              email: form.email,
              password: form.password,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sign in failed");
        setAccessToken("customer", data.accessToken || null);
        setUser(data.user);
        setAuthOpen(false);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--forest-deep)]/55 backdrop-blur-sm animate-fade-in"
        onClick={() => setAuthOpen(false)}
      />
      <div className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 animate-fade-in">
        {/* Premium header */}
        <div className="relative bg-gradient-to-br from-[var(--forest-deep)] via-[var(--forest)] to-[var(--forest-mid)] px-6 pb-8 pt-6 text-white">
          <button
            type="button"
            onClick={() => setAuthOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <BrandLogo variant="compact" showWordmark={false} href="/" />
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
                <Sparkles className="h-3 w-3" />
                Ahona Account
              </p>
              <h2 className="font-serif text-2xl font-semibold">
                {tab === "login" ? "Welcome back" : "Create account"}
              </h2>
            </div>
          </div>
          <p className="mt-2 text-sm text-white/70">
            {tab === "login"
              ? "Sign in to track orders, manage profile & checkout faster."
              : "Join Ahona — save addresses, track orders, exclusive deals."}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--line)] bg-[var(--ivory)]/60 px-2 pt-2">
          {(
            [
              ["login", "Sign in"],
              ["register", "Sign up"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setError("");
              }}
              className={cn(
                "relative flex-1 py-3 text-sm font-bold transition",
                tab === id
                  ? "text-[var(--forest-deep)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
              )}
            >
              {label}
              {tab === id && (
                <span className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-[var(--gold)]" />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 px-6 py-5">
          {tab === "register" && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[var(--ink-muted)]">
                Full name
              </span>
              <span className="relative flex items-center">
                <User className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--ink-muted)]" />
                <input
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--ivory)]/50 py-3 pl-10 pr-3 text-sm outline-none focus:border-[var(--forest)] focus:bg-white focus:ring-4 focus:ring-[var(--forest)]/10"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </span>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[var(--ink-muted)]">
              Email
            </span>
            <span className="relative flex items-center">
              <Mail className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--ink-muted)]" />
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--ivory)]/50 py-3 pl-10 pr-3 text-sm outline-none focus:border-[var(--forest)] focus:bg-white focus:ring-4 focus:ring-[var(--forest)]/10"
                placeholder="you@email.com"
                autoComplete="email"
              />
            </span>
          </label>

          {tab === "register" && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[var(--ink-muted)]">
                Phone <span className="font-normal opacity-70">(optional)</span>
              </span>
              <span className="relative flex items-center">
                <Phone className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--ink-muted)]" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--ivory)]/50 py-3 pl-10 pr-3 text-sm outline-none focus:border-[var(--forest)] focus:bg-white focus:ring-4 focus:ring-[var(--forest)]/10"
                  placeholder="01XXXXXXXXX"
                  autoComplete="tel"
                />
              </span>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[var(--ink-muted)]">
              Password
            </span>
            <span className="relative flex items-center">
              <Lock className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--ink-muted)]" />
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--ivory)]/50 py-3 pl-10 pr-3 text-sm outline-none focus:border-[var(--forest)] focus:bg-white focus:ring-4 focus:ring-[var(--forest)]/10"
                placeholder={
                  tab === "register" ? "Min 6 characters" : "Your password"
                }
                autoComplete={
                  tab === "register" ? "new-password" : "current-password"
                }
                minLength={6}
              />
            </span>
          </label>

          {tab === "register" && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[var(--ink-muted)]">
                Confirm password
              </span>
              <span className="relative flex items-center">
                <Lock className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--ink-muted)]" />
                <input
                  required
                  type="password"
                  value={form.confirm}
                  onChange={(e) => update("confirm", e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--ivory)]/50 py-3 pl-10 pr-3 text-sm outline-none focus:border-[var(--forest)] focus:bg-white focus:ring-4 focus:ring-[var(--forest)]/10"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  minLength={6}
                />
              </span>
            </label>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--forest-deep)] py-3.5 text-sm font-bold text-white shadow-lg shadow-[var(--forest)]/25 transition hover:bg-[var(--forest)] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Please wait…
              </>
            ) : tab === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--ink-muted)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--forest)]" />
            Secure · Your data stays private
          </p>
        </form>
      </div>
    </div>
  );
}
