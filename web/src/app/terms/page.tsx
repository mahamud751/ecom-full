import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using Ahona store, lab and doctor services",
};

export default function TermsPage() {
  return (
    <div className="container-main max-w-3xl py-10 pb-20">
      <Link href="/" className="text-sm font-semibold text-[var(--forest)]">
        ← Home
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">Terms of Service</h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-[var(--ink)]">
        <p>
          By using Ahona you agree to these terms. Services include e-commerce
          pharmacy products, lab test booking and online doctor consultation.
        </p>
        <h2 className="text-lg font-bold">Orders & delivery</h2>
        <p>
          Product availability and prices may change. Delivery times are
          estimates. Prescription medicines may require a valid prescription.
        </p>
        <h2 className="text-lg font-bold">Doctor consultation</h2>
        <p>
          Online consults are not a substitute for emergency care. In an
          emergency call local emergency services. E-prescriptions are issued at
          the doctor&apos;s professional discretion.
        </p>
        <h2 className="text-lg font-bold">Lab tests</h2>
        <p>
          Home collection depends on area coverage. Reports are provided by
          partner labs; Ahona is not a diagnostic laboratory.
        </p>
        <h2 className="text-lg font-bold">Reviews</h2>
        <p>
          Customer reviews are moderated. Only approved reviews appear on the
          site. We may reject abusive or fake content.
        </p>
        <h2 className="text-lg font-bold">Liability</h2>
        <p>
          To the fullest extent permitted by law, Ahona is not liable for
          indirect damages arising from use of the platform. Product liability
          follows applicable consumer law.
        </p>
        <p>
          See also{" "}
          <Link href="/refund" className="font-semibold text-[var(--forest)]">
            Refund policy
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-[var(--forest)]">
            Privacy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
