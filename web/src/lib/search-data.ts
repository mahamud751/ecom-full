import { doctorImg, labImg } from "./premium-images";

export type LabSearchItem = {
  id: string;
  name: string;
  type: "test" | "package";
  price: number;
  comparePrice: number;
  report: string;
  includes: number;
  image: string;
  keywords: string[];
};

export type DoctorSearchItem = {
  id: string;
  name: string;
  specialty: string;
  fee: number;
  rating: number;
  experience: number;
  image: string;
  keywords: string[];
};

export const LAB_CATALOG: LabSearchItem[] = [
  {
    id: "lab-cbc",
    name: "CBC — Complete Blood Count",
    type: "test",
    price: 450,
    comparePrice: 600,
    report: "20 hours",
    includes: 1,
    image: labImg.cbc,
    keywords: ["cbc", "blood", "count", "lab", "test"],
  },
  {
    id: "lab-creatinine",
    name: "Serum Creatinine",
    type: "test",
    price: 350,
    comparePrice: 450,
    report: "12 hours",
    includes: 1,
    image: labImg.creatinine,
    keywords: ["creatinine", "kidney", "serum", "lab"],
  },
  {
    id: "lab-electrolytes",
    name: "Serum Electrolytes",
    type: "test",
    price: 500,
    comparePrice: 650,
    report: "12 hours",
    includes: 1,
    image: labImg.electrolytes,
    keywords: ["electrolytes", "serum", "sodium", "potassium"],
  },
  {
    id: "lab-urine",
    name: "Urine Routine Examination (R/E)",
    type: "test",
    price: 250,
    comparePrice: 350,
    report: "12 hours",
    includes: 1,
    image: labImg.urine,
    keywords: ["urine", "re", "routine"],
  },
  {
    id: "lab-tsh",
    name: "TSH — Thyroid Stimulating Hormone",
    type: "test",
    price: 600,
    comparePrice: 800,
    report: "12 hours",
    includes: 1,
    image: labImg.tsh,
    keywords: ["tsh", "thyroid", "hormone"],
  },
  {
    id: "lab-esr",
    name: "CBC + ESR",
    type: "test",
    price: 550,
    comparePrice: 750,
    report: "24 hours",
    includes: 2,
    image: labImg.esr,
    keywords: ["esr", "cbc", "inflammation"],
  },
  {
    id: "pkg-fullbody",
    name: "Full Body Checkup Package",
    type: "package",
    price: 3500,
    comparePrice: 5200,
    report: "12 hours",
    includes: 12,
    image: labImg.package,
    keywords: ["full body", "package", "checkup", "health"],
  },
  {
    id: "pkg-dengue",
    name: "Dengue Package",
    type: "package",
    price: 1200,
    comparePrice: 1800,
    report: "24 hours",
    includes: 3,
    image: labImg.dengue,
    keywords: ["dengue", "fever", "package"],
  },
  {
    id: "pkg-diabetes",
    name: "Diabetes Package",
    type: "package",
    price: 1500,
    comparePrice: 2200,
    report: "24 hours",
    includes: 5,
    image: labImg.package,
    keywords: ["diabetes", "hba1c", "sugar", "package"],
  },
  {
    id: "pkg-cardiac",
    name: "Cardiac Screening Package",
    type: "package",
    price: 2800,
    comparePrice: 4000,
    report: "12 hours",
    includes: 5,
    image: labImg.package,
    keywords: ["cardiac", "heart", "lipid", "package"],
  },
];

export const DOCTOR_CATALOG: DoctorSearchItem[] = [
  {
    id: "1",
    name: "Dr. Sadia Rahman",
    specialty: "General Physician",
    fee: 299,
    rating: 4.9,
    experience: 12,
    image: doctorImg.d1,
    keywords: ["sadia", "general", "physician", "gp", "fever"],
  },
  {
    id: "2",
    name: "Dr. Karim Hossain",
    specialty: "Cardiologist",
    fee: 599,
    rating: 4.8,
    experience: 18,
    image: doctorImg.d2,
    keywords: ["karim", "cardio", "heart", "chest"],
  },
  {
    id: "3",
    name: "Dr. Nusrat Jahan",
    specialty: "Dermatologist",
    fee: 499,
    rating: 4.9,
    experience: 10,
    image: doctorImg.d3,
    keywords: ["nusrat", "skin", "derma", "acne"],
  },
  {
    id: "4",
    name: "Dr. Imran Chowdhury",
    specialty: "Pediatrician",
    fee: 399,
    rating: 4.7,
    experience: 14,
    image: doctorImg.d4,
    keywords: ["imran", "child", "pediatric", "baby"],
  },
  {
    id: "5",
    name: "Dr. Farhana Akter",
    specialty: "Gynecologist",
    fee: 549,
    rating: 4.9,
    experience: 15,
    image: doctorImg.d5,
    keywords: ["farhana", "gynae", "women", "pregnancy"],
  },
  {
    id: "6",
    name: "Dr. Rafiqul Islam",
    specialty: "Orthopedic",
    fee: 699,
    rating: 4.8,
    experience: 20,
    image: doctorImg.d6,
    keywords: ["rafiq", "bone", "ortho", "joint"],
  },
  {
    id: "7",
    name: "Dr. Mahbub Alam",
    specialty: "ENT",
    fee: 399,
    rating: 4.6,
    experience: 11,
    image: doctorImg.d7,
    keywords: ["mahbub", "ent", "ear", "nose", "throat"],
  },
  {
    id: "8",
    name: "Dr. Tahmina Begum",
    specialty: "Psychiatrist",
    fee: 799,
    rating: 4.9,
    experience: 13,
    image: doctorImg.d8,
    keywords: ["tahmina", "mental", "psychiatry", "anxiety"],
  },
];

export function searchLabs(q: string) {
  const s = q.toLowerCase().trim();
  if (!s) return LAB_CATALOG;
  return LAB_CATALOG.filter(
    (l) =>
      l.name.toLowerCase().includes(s) ||
      l.keywords.some((k) => k.includes(s) || s.includes(k))
  );
}

export function searchDoctors(q: string) {
  const s = q.toLowerCase().trim();
  if (!s) return DOCTOR_CATALOG;
  return DOCTOR_CATALOG.filter(
    (d) =>
      d.name.toLowerCase().includes(s) ||
      d.specialty.toLowerCase().includes(s) ||
      d.keywords.some((k) => k.includes(s) || s.includes(k))
  );
}
