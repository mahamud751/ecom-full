"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { AuthModal } from "./AuthModal";

/** Hydrates session + hosts premium auth modal globally */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const refresh = useAuthStore((s) => s.refresh);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <>
      {children}
      <AuthModal />
    </>
  );
}
