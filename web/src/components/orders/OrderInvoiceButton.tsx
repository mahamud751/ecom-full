"use client";

import { useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";

type InvoiceData = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  area?: string | null;
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  paymentStatus?: string;
  status: string;
  couponCode?: string | null;
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
};

export function OrderInvoiceButton({
  order,
  className,
}: {
  order: InvoiceData;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function downloadPdf() {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 48;
      let y = margin;

      doc.setFillColor(12, 42, 40);
      doc.rect(0, 0, pageW, 70, "F");
      doc.setTextColor(201, 162, 39);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("CHOLBE", margin, 32);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text("Tax Invoice / Order receipt", margin, 50);
      doc.setFontSize(9);
      doc.text(order.orderNumber, pageW - margin, 32, { align: "right" });
      doc.text(new Date(order.createdAt).toLocaleString("en-BD"), pageW - margin, 48, {
        align: "right",
      });

      y = 100;
      doc.setTextColor(20, 32, 31);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Bill to", margin, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(order.customerName, margin, y);
      y += 14;
      doc.text(order.customerPhone, margin, y);
      y += 14;
      const addr = [order.address, order.area, order.city].filter(Boolean).join(", ");
      const lines = doc.splitTextToSize(addr, pageW - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 14 + 16;

      doc.setFont("helvetica", "bold");
      doc.text("Items", margin, y);
      y += 12;
      doc.setDrawColor(232, 228, 219);
      doc.line(margin, y, pageW - margin, y);
      y += 16;

      doc.setFontSize(10);
      for (const item of order.items) {
        doc.setFont("helvetica", "normal");
        const line = `${item.name}  ×${item.quantity}`;
        const wrapped = doc.splitTextToSize(line, pageW - margin * 2 - 80);
        doc.text(wrapped, margin, y);
        doc.setFont("helvetica", "bold");
        doc.text(`৳${(item.price * item.quantity).toFixed(0)}`, pageW - margin, y, {
          align: "right",
        });
        y += Math.max(16, wrapped.length * 12 + 6);
        if (y > 720) {
          doc.addPage();
          y = margin;
        }
      }

      y += 8;
      doc.line(margin, y, pageW - margin, y);
      y += 18;
      const row = (label: string, value: string, bold = false) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.text(label, margin, y);
        doc.text(value, pageW - margin, y, { align: "right" });
        y += 16;
      };
      row("Subtotal", `৳${order.subtotal.toFixed(0)}`);
      row("Delivery", order.deliveryFee === 0 ? "FREE" : `৳${order.deliveryFee.toFixed(0)}`);
      if (order.discount && order.discount > 0) {
        row(
          `Discount${order.couponCode ? ` (${order.couponCode})` : ""}`,
          `-৳${order.discount.toFixed(0)}`
        );
      }
      row("Total", `৳${order.total.toFixed(0)}`, true);
      y += 8;
      row("Payment", `${order.paymentMethod} · ${order.paymentStatus || order.status}`);

      y = Math.max(y + 30, 760);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "Ahona Health · Licensed pharmacy partner · For support see ahona.store contact page",
        pageW / 2,
        y,
        { align: "center" }
      );

      doc.save(`Ahona-Invoice-${order.orderNumber}.pdf`);
    } catch (e) {
      console.error(e);
      window.print();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={downloadPdf}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--forest)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--forest-deep)] disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Download invoice PDF
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="ml-2 inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-bold"
      >
        <Printer className="h-4 w-4" /> Print
      </button>
    </div>
  );
}
