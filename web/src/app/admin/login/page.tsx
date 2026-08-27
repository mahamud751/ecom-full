"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { setAccessToken } from "@/lib/api-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ahona.store");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          kind: "admin",
          action: "login",
          payload: { email, password },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setAccessToken("admin", data.accessToken || null);
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--forest-deep)] via-[var(--forest)] to-[#0a3d38] p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <BrandLogo variant="compact" showWordmark={false} href="/" />
          <div>
            <h1 className="font-serif text-xl font-semibold text-[var(--ink)]">
              Ahona Admin
            </h1>
            <p className="text-xs text-[var(--ink-muted)]">
              Commerce · Lab · Ops · Doctors
            </p>
          </div>
        </div>

        <label className="mb-3 block text-xs font-semibold text-[var(--ink-muted)]">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--forest)]"
          />
        </label>
        <label className="mb-4 block text-xs font-semibold text-[var(--ink-muted)]">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--forest)]"
          />
        </label>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--forest)] py-3 text-sm font-bold text-white hover:bg-[var(--forest-deep)] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </button>
        <p className="mt-4 text-center text-[11px] text-[var(--ink-muted)]">
          Demo: admin@ahona.store / admin123
        </p>
      </form>
    </div>
  );
}
