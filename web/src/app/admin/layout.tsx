import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Ahona",
  description: "Ahona operations & commerce control center",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Store chrome hidden via Header/Footer pathname checks
  return (
    <div
      data-admin-root
      className="min-h-screen bg-[#f0f2f1] font-sans text-sm text-[var(--ink)]"
    >
      {children}
    </div>
  );
}
