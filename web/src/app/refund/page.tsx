import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund & Return Policy",
};

export default function RefundPage() {
  return (
    <div className="container-main max-w-3xl py-10 pb-20">
      <Link href="/" className="text-sm font-semibold text-[var(--forest)]">
        ← Home
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">
        Refund & return policy
      </h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed">
        <p>
          We want you to be satisfied with every Ahona order. Contact support
          within <strong>48 hours</strong> of delivery for damaged, wrong or
          missing items.
        </p>
        <h2 className="text-lg font-bold">Eligible returns</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Wrong item delivered</li>
          <li>Damaged packaging / broken product on arrival</li>
          <li>Expired product (with photo proof)</li>
        </ul>
        <h2 className="text-lg font-bold">Non-returnable</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Opened medicines (hygiene & safety)</li>
          <li>Used personal care items</li>
          <li>Lab tests or completed doctor consultations</li>
        </ul>
        <h2 className="text-lg font-bold">Refunds</h2>
        <p>
          Approved refunds are processed to the original payment method or as
          store credit within 7–10 business days. COD refunds may require bank
          details.
        </p>
        <p>
          <Link href="/contact" className="font-semibold text-[var(--forest)]">
            Contact support
          </Link>{" "}
          with your order number to start a claim.
        </p>
      </div>
    </div>
  );
}
