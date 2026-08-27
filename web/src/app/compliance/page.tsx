import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, FileText, Building2, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Pharmacy Compliance",
  description: "Licensed pharmacy operations, prescription medicines & disclaimers",
};

export default function CompliancePage() {
  return (
    <div className="container-main max-w-3xl py-10 pb-20">
      <Link href="/" className="text-sm font-semibold text-[var(--forest)]">
        ← Home
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">
        Pharmacy & healthcare compliance
      </h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        Ahona partners with licensed pharmacies and registered practitioners in
        Bangladesh.
      </p>

      <div className="mt-8 space-y-4">
        {[
          {
            icon: Building2,
            title: "Drug license",
            body: "Retail pharmacy operations are conducted under partner licenses. License numbers are available on request for verification by DGDA authorities.",
          },
          {
            icon: FileText,
            title: "Prescription medicines",
            body: "Products marked Rx require a valid prescription. Upload a clear photo at checkout. Our pharmacy team verifies before dispatch.",
          },
          {
            icon: ShieldCheck,
            title: "Genuine products",
            body: "We source from authorized distributors. Report suspected counterfeit items to support within 48 hours of delivery.",
          },
          {
            icon: AlertTriangle,
            title: "Medical disclaimer",
            body: "Online doctor consults and product information are not a substitute for emergency care. In an emergency, call local emergency services immediately.",
          },
        ].map((c) => (
          <div
            key={c.title}
            className="flex gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--forest)]">
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold">{c.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
                {c.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm">
        Questions?{" "}
        <Link href="/contact" className="font-semibold text-[var(--forest)]">
          Contact support
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="font-semibold text-[var(--forest)]">
          Terms
        </Link>
      </p>
    </div>
  );
}
