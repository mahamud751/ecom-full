import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Ahona collects and uses your data",
};

export default function PrivacyPage() {
  return (
    <div className="container-main max-w-3xl py-10 pb-20">
      <Link href="/" className="text-sm font-semibold text-[var(--forest)]">
        ← Home
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        Last updated: {new Date().toLocaleDateString("en-BD")}
      </p>
      <div className="prose prose-sm mt-8 space-y-4 text-[var(--ink)]">
        <p>
          Ahona (&quot;we&quot;) operates an online pharmacy, lab booking and
          doctor consultation platform. This policy explains what data we
          collect and how we use it.
        </p>
        <h2 className="text-lg font-bold">Information we collect</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Name, phone, email, delivery address for orders</li>
          <li>Consultation details and prescriptions from doctor visits</li>
          <li>Lab booking information and sample collection address</li>
          <li>Wishlist, cart and product alert preferences (device storage)</li>
          <li>Technical logs (IP, device) for security and performance</li>
        </ul>
        <h2 className="text-lg font-bold">How we use data</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Fulfill orders, lab bookings and teleconsultations</li>
          <li>Send stock / price alerts you requested</li>
          <li>Improve product recommendations and support</li>
          <li>Comply with pharmacy and healthcare regulations</li>
        </ul>
        <h2 className="text-lg font-bold">Sharing</h2>
        <p className="text-sm">
          We share data only with delivery partners, licensed pharmacies, lab
          partners and payment providers as needed to serve you. We do not sell
          personal data.
        </p>
        <h2 className="text-lg font-bold">Contact</h2>
        <p className="text-sm">
          Questions:{" "}
          <Link href="/contact" className="font-semibold text-[var(--forest)]">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
