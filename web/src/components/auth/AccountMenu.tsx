"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  User,
  LogOut,
  Package,
  Settings,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AccountMenu() {
  const { t } = useI18n();
  const { user, loading, setAuthOpen, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (loading) {
    return (
      <div className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] bg-white sm:flex">
        <User className="h-5 w-5 text-[var(--ink-muted)]" strokeWidth={1.5} />
      </div>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => setAuthOpen(true, "login")}
        className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] bg-white text-[var(--ink)] transition hover:bg-[var(--ivory)] sm:flex"
        title={t("header.signIn")}
        aria-label={t("header.signIn")}
      >
        <User className="h-5 w-5 text-[var(--ink)]" strokeWidth={1.5} />
      </button>
    );
  }

  const initial = (user.name || user.email || "U").charAt(0).toUpperCase();

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-2xl px-2 py-1.5 transition hover:bg-[var(--ivory)]"
      >
        <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--forest-deep)] text-sm font-bold text-[var(--gold)] ring-2 ring-[var(--gold-soft)]">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.name}
              fill
              className="object-cover"
              sizes="36px"
            />
          ) : (
            initial
          )}
        </span>
        <div className="hidden leading-tight xl:block text-left">
          <p className="text-[11px] text-[var(--ink-muted)]">Hi,</p>
          <p className="max-w-[100px] truncate text-sm font-semibold text-[var(--ink)]">
            {user.name.split(" ")[0]}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "hidden h-4 w-4 text-[var(--ink-muted)] transition xl:block",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--line)] bg-white py-2 shadow-xl">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <p className="truncate text-sm font-bold text-[var(--ink)]">
              {user.name}
            </p>
            <p className="truncate text-xs text-[var(--ink-muted)]">
              {user.email}
            </p>
          </div>
          <nav className="py-1">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-[var(--ivory)]"
            >
              <LayoutDashboard className="h-4 w-4 text-[var(--forest)]" />
              Dashboard
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-[var(--ivory)]"
            >
              <Package className="h-4 w-4 text-[var(--forest)]" />
              My orders
            </Link>
            <Link
              href="/account/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-[var(--ivory)]"
            >
              <Settings className="h-4 w-4 text-[var(--forest)]" />
              Edit profile
            </Link>
          </nav>
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await logout();
            }}
            className="flex w-full items-center gap-2.5 border-t border-[var(--line)] px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/** Compact mobile trigger for account */
export function AccountMobileButton() {
  const { user, setAuthOpen } = useAuthStore();
  if (user) {
    return (
      <Link
        href="/account"
        className="rounded-xl border border-[var(--line)] bg-[var(--ivory)] px-3 py-3 text-sm font-semibold text-[var(--ink)]"
      >
        My account
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setAuthOpen(true, "login")}
      className="rounded-xl border border-[var(--line)] bg-[var(--ivory)] px-3 py-3 text-left text-sm font-semibold text-[var(--ink)]"
    >
      Sign in / Sign up
    </button>
  );
}
