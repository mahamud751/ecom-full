"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Printer, Loader2 } from "lucide-react";

export type PrescriptionViewData = {
  id: string;
  diagnosis: string | null;
  advice: string | null;
  followUp: string | null;
  createdAt: string;
  items: {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string | null;
  }[];
  consultation: {
    consultNumber: string;
    patientName: string;
    patientPhone: string;
    patientAge: number | null;
    patientGender: string | null;
    type: string;
    fee: number;
    createdAt: string;
    doctor: {
      name: string;
      specialty: string;
      hospital: string | null;
      bmdcNumber: string | null;
      image: string;
    };
  };
};

export function PrescriptionViewer({ data }: { data: PrescriptionViewData }) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 48;
      let y = margin;

      const line = (text: string, opts?: { bold?: boolean; size?: number; color?: [number, number, number] }) => {
        doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
        doc.setFontSize(opts?.size ?? 11);
        if (opts?.color) doc.setTextColor(...opts.color);
        else doc.setTextColor(20, 32, 31);
        const lines = doc.splitTextToSize(text, pageW - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * ((opts?.size ?? 11) + 4);
      };

      // Header bar
      doc.setFillColor(12, 42, 40);
      doc.rect(0, 0, pageW, 72, "F");
      doc.setTextColor(201, 162, 39);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("CHOLBE", margin, 32);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text("E-Prescription", margin, 50);
      doc.setFontSize(9);
      doc.text(data.consultation.consultNumber, pageW - margin, 32, {
        align: "right",
      });
      doc.text(
        new Date(data.createdAt).toLocaleString("en-BD"),
        pageW - margin,
        48,
        { align: "right" }
      );

      y = 96;
      line(data.consultation.doctor.name, { bold: true, size: 14 });
      line(
        `${data.consultation.doctor.specialty}${
          data.consultation.doctor.bmdcNumber
            ? ` · BMDC ${data.consultation.doctor.bmdcNumber}`
            : ""
        }`
      );
      if (data.consultation.doctor.hospital) {
        line(data.consultation.doctor.hospital, {
          size: 10,
          color: [92, 107, 105],
        });
      }

      y += 8;
      doc.setDrawColor(232, 228, 219);
      doc.line(margin, y, pageW - margin, y);
      y += 18;

      line("Patient", { bold: true, size: 10, color: [92, 107, 105] });
      line(
        `${data.consultation.patientName}${
          data.consultation.patientAge
            ? `, ${data.consultation.patientAge} yrs`
            : ""
        }${
          data.consultation.patientGender
            ? ` · ${data.consultation.patientGender}`
            : ""
        }`,
        { bold: true, size: 12 }
      );
      line(`Phone: ${data.consultation.patientPhone}`, { size: 10 });

      if (data.diagnosis) {
        y += 10;
        line("Diagnosis", { bold: true, size: 10, color: [92, 107, 105] });
        line(data.diagnosis, { size: 12 });
      }

      y += 12;
      line("Rx", { bold: true, size: 14, color: [22, 79, 74] });
      y += 4;

      data.items.forEach((item, i) => {
        if (y > 720) {
          doc.addPage();
          y = margin;
        }
        line(`${i + 1}. ${item.medicineName}`, { bold: true, size: 12 });
        line(
          `   ${item.dosage} · ${item.frequency} · ${item.duration}${
            item.instructions ? ` · ${item.instructions}` : ""
          }`,
          { size: 10, color: [60, 70, 68] }
        );
        y += 6;
      });

      if (data.advice) {
        y += 8;
        line("Advice", { bold: true, size: 10, color: [92, 107, 105] });
        line(data.advice);
      }
      if (data.followUp) {
        y += 6;
        line("Follow-up", { bold: true, size: 10, color: [92, 107, 105] });
        line(data.followUp);
      }

      y = Math.max(y + 30, 700);
      doc.setDrawColor(201, 162, 39);
      doc.line(pageW - margin - 140, y, pageW - margin, y);
      y += 14;
      doc.setFontSize(10);
      doc.setTextColor(20, 32, 31);
      doc.text(data.consultation.doctor.name, pageW - margin, y, {
        align: "right",
      });
      y += 12;
      doc.setTextColor(92, 107, 105);
      doc.text("Digital signature", pageW - margin, y, { align: "right" });

      y = 800;
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(
        "Generated by Ahona Health · For medical use only · Verify with doctor if unclear",
        pageW / 2,
        y,
        { align: "center" }
      );

      doc.save(`Ahona-Rx-${data.consultation.consultNumber}.pdf`);
    } catch (e) {
      console.error(e);
      // Fallback to print dialog
      window.print();
    } finally {
      setDownloading(false);
    }
  }, [data]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--forest)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--forest-deep)] disabled:opacity-60"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download PDF
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--ink)] hover:border-[var(--forest)]"
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
      </div>

      <div
        ref={printRef}
        className="rx-sheet mx-auto max-w-2xl rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8 print:max-w-none print:rounded-none print:border-0 print:shadow-none"
      >
        <div className="flex items-start justify-between gap-4 border-b-2 border-[var(--forest)] pb-4">
          <div>
            <p className="font-serif text-2xl font-bold tracking-tight text-[var(--forest-deep)]">
              Ahona
            </p>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold-deep)]">
              E-Prescription
            </p>
          </div>
          <div className="text-right text-xs text-[var(--ink-muted)]">
            <p className="font-mono font-bold text-[var(--ink)]">
              {data.consultation.consultNumber}
            </p>
            <p>{new Date(data.createdAt).toLocaleString("en-BD")}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-muted)]">
              Doctor
            </p>
            <p className="text-base font-bold text-[var(--ink)]">
              {data.consultation.doctor.name}
            </p>
            <p className="text-sm text-[var(--forest)]">
              {data.consultation.doctor.specialty}
            </p>
            {data.consultation.doctor.bmdcNumber && (
              <p className="text-xs text-[var(--ink-muted)]">
                BMDC: {data.consultation.doctor.bmdcNumber}
              </p>
            )}
            {data.consultation.doctor.hospital && (
              <p className="text-xs text-[var(--ink-muted)]">
                {data.consultation.doctor.hospital}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-muted)]">
              Patient
            </p>
            <p className="text-base font-bold text-[var(--ink)]">
              {data.consultation.patientName}
            </p>
            <p className="text-sm text-[var(--ink-muted)]">
              {[
                data.consultation.patientAge
                  ? `${data.consultation.patientAge} yrs`
                  : null,
                data.consultation.patientGender,
                data.consultation.patientPhone,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        {data.diagnosis && (
          <div className="mt-5 rounded-xl bg-[var(--brand-soft)] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--forest)]">
              Diagnosis
            </p>
            <p className="mt-0.5 text-sm font-medium text-[var(--ink)]">
              {data.diagnosis}
            </p>
          </div>
        )}

        <div className="mt-6">
          <p className="mb-2 font-serif text-xl font-bold text-[var(--forest)]">
            ℞
          </p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">Medicine</th>
                <th className="py-2 pr-2">Dose</th>
                <th className="py-2 pr-2">Frequency</th>
                <th className="py-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="border-b border-[var(--line)]/70">
                  <td className="py-2.5 pr-2 align-top text-[var(--ink-muted)]">
                    {i + 1}
                  </td>
                  <td className="py-2.5 pr-2 align-top">
                    <p className="font-semibold">{item.medicineName}</p>
                    {item.instructions && (
                      <p className="text-xs text-[var(--ink-muted)]">
                        {item.instructions}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 pr-2 align-top">{item.dosage}</td>
                  <td className="py-2.5 pr-2 align-top">{item.frequency}</td>
                  <td className="py-2.5 align-top">{item.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.items.length === 0 && (
            <p className="text-sm text-[var(--ink-muted)]">
              No medicines listed — see advice below.
            </p>
          )}
        </div>

        {data.advice && (
          <div className="mt-5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-muted)]">
              Advice
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{data.advice}</p>
          </div>
        )}

        {data.followUp && (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-muted)]">
              Follow-up
            </p>
            <p className="mt-1 text-sm">{data.followUp}</p>
          </div>
        )}

        <div className="mt-10 flex justify-end border-t border-[var(--line)] pt-6">
          <div className="text-right">
            <div className="mb-1 h-px w-40 bg-[var(--gold)]" />
            <p className="text-sm font-bold">{data.consultation.doctor.name}</p>
            <p className="text-[10px] text-[var(--ink-muted)]">
              Digitally issued via Ahona
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-[var(--ink-muted)]">
          This e-prescription is valid for medical use. Contact your doctor if
          anything is unclear. Ahona Health.
        </p>
      </div>
    </div>
  );
}
