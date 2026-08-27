"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import Link from "next/link";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { toast } from "@/components/ui/Toast";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    subject: "Order help",
    message: "",
  });
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await apiFetch("/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSent(true);
      toast(
        `Ticket ${data.ticket.ticketNo} created — we'll call you back`,
        "success"
      );
      setForm({ name: "", phone: "", subject: "Order help", message: "" });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "info");
    }
  }

  return (
    <div className="container-main py-10 pb-20">
      <Link href="/" className="text-sm font-semibold text-[var(--forest)]">
        ← Home
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">Contact & support</h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">
        Orders, lab, doctors, refunds — we&apos;re here to help
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {[
            {
              icon: Phone,
              label: "Hotline",
              value: "16778",
              href: "tel:16778",
            },
            {
              icon: Mail,
              label: "Email",
              value: "support@ahona.store",
              href: "mailto:support@ahona.store",
            },
            {
              icon: MapPin,
              label: "Office",
              value: "Dhaka, Bangladesh",
              href: "#",
            },
            {
              icon: MessageCircle,
              label: "Hours",
              value: "9:00 AM – 10:00 PM (everyday)",
              href: "#",
            },
          ].map((c) => (
            <a
              key={c.label}
              href={c.href}
              className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--forest)]">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-[var(--ink-muted)]">
                  {c.label}
                </p>
                <p className="font-semibold">{c.value}</p>
              </div>
            </a>
          ))}
          <div className="flex flex-wrap gap-2 pt-2 text-xs">
            <Link href="/track-order" className="font-semibold text-[var(--forest)]">
              Track order →
            </Link>
            <Link href="/refund" className="font-semibold text-[var(--forest)]">
              Refunds →
            </Link>
            <Link href="/privacy" className="font-semibold text-[var(--forest)]">
              Privacy →
            </Link>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm space-y-3"
        >
          <h2 className="font-bold">Send a message</h2>
          {sent && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              Thanks — our team will contact you shortly.
            </p>
          )}
          <input
            required
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--forest)]"
          />
          <input
            required
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--forest)]"
          />
          <select
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--forest)]"
          >
            <option>Order help</option>
            <option>Doctor / consult</option>
            <option>Lab booking</option>
            <option>Refund</option>
            <option>Other</option>
          </select>
          <textarea
            required
            rows={4}
            placeholder="How can we help?"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--forest)]"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--forest)] py-3 text-sm font-bold text-white"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
