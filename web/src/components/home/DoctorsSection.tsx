"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Video, Clock, Star, BadgeCheck } from "lucide-react";
import { doctorImg } from "@/lib/premium-images";
import { useI18n } from "@/lib/i18n";

export type DoctorPreview = {
  id: string;
  slug?: string;
  name: string;
  specialty: string;
  image: string;
  experience: number;
  fee: number;
  rating: number;
  patients: string;
  availableNow?: boolean;
};

const defaultDoctors: DoctorPreview[] = [
  {
    id: "1",
    slug: "dr-sadia-rahman",
    name: "Dr. Sadia Rahman",
    specialty: "General Physician",
    image: doctorImg.d1,
    experience: 12,
    fee: 299,
    rating: 4.9,
    patients: "5.2k+",
    availableNow: true,
  },
  {
    id: "2",
    slug: "dr-karim-hossain",
    name: "Dr. Karim Hossain",
    specialty: "Cardiologist",
    image: doctorImg.d2,
    experience: 18,
    fee: 599,
    rating: 4.8,
    patients: "8.1k+",
    availableNow: true,
  },
  {
    id: "3",
    slug: "dr-nusrat-jahan",
    name: "Dr. Nusrat Jahan",
    specialty: "Dermatologist",
    image: doctorImg.d3,
    experience: 10,
    fee: 499,
    rating: 4.9,
    patients: "4.6k+",
    availableNow: true,
  },
  {
    id: "4",
    slug: "dr-imran-chowdhury",
    name: "Dr. Imran Chowdhury",
    specialty: "Pediatrician",
    image: doctorImg.d4,
    experience: 14,
    fee: 399,
    rating: 4.7,
    patients: "6.3k+",
  },
  {
    id: "5",
    slug: "dr-farhana-akter",
    name: "Dr. Farhana Akter",
    specialty: "Gynecologist",
    image: doctorImg.d5,
    experience: 15,
    fee: 549,
    rating: 4.9,
    patients: "7.0k+",
    availableNow: true,
  },
];

export function DoctorsSection({
  doctors = defaultDoctors,
  compact = false,
}: {
  doctors?: DoctorPreview[];
  compact?: boolean;
}) {
  const { t, specialty } = useI18n();

  const badges = [
    { icon: Video, label: t("home.videoConsult") },
    { icon: Clock, label: t("home.instantOrScheduled") },
    { icon: BadgeCheck, label: t("home.verifiedDoctors") },
    { icon: Star, label: t("home.eprescription") },
  ];

  return (
    <section className="home-section">
      <div className="container-main">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-brand">
              {t("home.doctorsTag")}
            </p>
            <h2 className="section-title">{t("home.doctorsTitle")}</h2>
            {!compact && (
              <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 sm:line-clamp-none sm:text-sm">
                {t("home.doctorsDesc")}
              </p>
            )}
          </div>
          <Link
            href="/doctors"
            className="see-all-link flex items-center gap-0.5 capitalize"
          >
            {t("common.seeAll")}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {!compact && (
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {badges.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2.5"
              >
                <b.icon className="h-4 w-4 text-brand" />
                <span className="text-xs font-semibold text-gray-700">
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="product-track no-scrollbar">
          {doctors.map((doc) => (
            <Link
              key={doc.id}
              href={doc.slug ? `/doctors/${doc.slug}` : `/doctors`}
              className="doctor-card flex w-[168px] shrink-0 flex-col overflow-hidden sm:w-[196px]"
            >
              <div className="relative aspect-[4/3] w-full bg-brand-soft">
                <Image
                  src={doc.image}
                  alt={doc.name}
                  fill
                  className="object-cover object-top"
                  sizes="220px"
                />
                <span
                  className={`absolute bottom-2 left-2 rounded px-2 py-0.5 text-[10px] font-bold text-white ${
                    doc.availableNow ? "bg-emerald-600" : "bg-brand"
                  }`}
                >
                  {doc.availableNow
                    ? t("home.availableNow")
                    : t("home.bookSlot")}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-3">
                <h3 className="text-sm font-bold text-gray-900">{doc.name}</h3>
                <p className="text-xs text-brand">
                  {specialty(doc.specialty)}
                </p>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500">
                  <Star className="h-3 w-3 fill-[#F7C948] text-[#F7C948]" />
                  {doc.rating} · {doc.experience} {t("doctors.yrs")} ·{" "}
                  {doc.patients}
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-sm font-bold text-gray-900">
                    ৳{doc.fee}
                  </span>
                  <span className="rounded-md bg-brand px-2.5 py-1 text-[11px] font-bold text-white">
                    {t("doctors.consult")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
