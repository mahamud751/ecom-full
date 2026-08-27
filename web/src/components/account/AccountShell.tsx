"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  UserRound,
  LogOut,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/account/profile", label: "Profile", icon: UserRound },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, setAuthOpen, logout, refresh } = useAuthStore();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!loading && !user) {
      setAuthOpen(true, "login");
    }
  }, [loading, user, setAuthOpen]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--forest)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-main max-w-lg py-20 text-center">
        <h1 className="font-serif text-2xl font-bold">Sign in required</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Please sign in to view your account dashboard.
        </p>
        <button
          type="button"
          onClick={() => setAuthOpen(true, "login")}
          className="mt-6 rounded-full bg-[var(--forest-deep)] px-8 py-3 text-sm font-bold text-white"
        >
          Sign in
        </button>
      </div>
    );
  }

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="container-main py-8 pb-24">
      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--forest-deep)] via-[var(--forest)] to-[var(--forest-mid)] p-6 text-white shadow-lg md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10 text-2xl font-bold text-[var(--gold)] ring-2 ring-[var(--gold)]/40">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                initial
              )}
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--gold)]">
                My Ahona
              </p>
              <h1 className="font-serif text-2xl font-semibold md:text-3xl">
                {user.name}
              </h1>
              <p className="text-sm text-white/70">{user.email}</p>
            </div>
          </div>
          <Link
            href="/account/profile"
            className="inline-flex items-center justify-center rounded-full bg-[var(--gold)] px-5 py-2.5 text-sm font-bold text-[var(--forest-deep)]"
          >
            Edit profile
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-2xl border border-[var(--line)] bg-white p-2 shadow-sm lg:sticky lg:top-36">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  active
                    ? "bg-[var(--forest-deep)] text-white"
                    : "text-[var(--ink)] hover:bg-[var(--ivory)]"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push("/");
            }}
            className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
