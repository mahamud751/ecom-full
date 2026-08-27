"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { setAccessToken } from "@/lib/api-client";

type AdminSession = { name: string; email: string; role: string };

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth-proxy", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "admin", action: "bootstrap" }),
        });
        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setAccessToken("admin", data.accessToken || null);
        setAdmin(data.admin as AdminSession);
      } catch {
        if (!cancelled) router.replace("/admin/login");
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f1]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--forest)]" />
      </div>
    );
  }

  return <AdminShell admin={admin}>{children}</AdminShell>;
}
