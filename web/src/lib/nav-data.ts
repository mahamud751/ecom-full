/**
 * Top hub tabs + mega-menu content
 * All → home overview | Store → products | Lab → tests | Doctor → consult
 */

import { premiumImg as premiumImages } from "./premium-images";

export type MegaItem = {
  name: string;
  href: string;
  desc?: string;
  image?: string;
  badge?: string;
};

export type MegaColumn = {
  title: string;
  items: MegaItem[];
};

export type HubTab = {
  id: "all" | "store" | "lab" | "doctor";
  label: string;
  href: string;
  match: string[];
  tagline: string;
  columns: MegaColumn[];
  featured?: {
    title: string;
    desc: string;
    href: string;
    image: string;
    cta: string;
  };
};

/** Re-export premium images (q=95 high-res) */
export const premiumImg = premiumImages;

export const hubTabs: HubTab[] = [
  {
    id: "all",
    label: "Home",
    href: "/",
    match: ["/"],
    tagline: "Everything in one place",
    columns: [
      {
        title: "Explore",
        items: [
          { name: "Store — All Products", href: "/store", desc: "Medicines & beauty" },
          { name: "Flash Deals", href: "/store?flash=1", desc: "Limited offers", badge: "Hot" },
          { name: "Lab Tests", href: "/lab-test", desc: "Home collection" },
          { name: "Doctors", href: "/doctors", desc: "Video consult" },
        ],
      },
      {
        title: "Popular categories",
        items: [
          { name: "Medicine", href: "/category/medicine", image: premiumImg.medicine },
          { name: "Skincare", href: "/category/skincare", image: premiumImg.skincare },
          { name: "Supplements", href: "/category/supplement", image: premiumImg.vitamin },
          { name: "Baby & Mom", href: "/category/baby-mom", image: premiumImg.baby },
        ],
      },
      {
        title: "Quick services",
        items: [
          { name: "Upload Prescription", href: "/store", desc: "Get medicines fast" },
          { name: "Full Body Checkup", href: "/lab-test", desc: "Health packages" },
          { name: "General Physician", href: "/doctors", desc: "From ৳199" },
          { name: "Express Delivery", href: "/store", desc: "12–24 hours" },
        ],
      },
    ],
    featured: {
      title: "Complete Health Hub",
      desc: "Shop, test & consult — premium care under one roof",
      href: "/store",
      image: premiumImg.heroAll,
      cta: "Start shopping",
    },
  },
  {
    id: "store",
    label: "Pharmacy",
    href: "/store",
    match: ["/store", "/products", "/category", "/search", "/cart", "/checkout"],
    tagline: "Shop all products",
    columns: [
      {
        title: "Health & medicine",
        items: [
          { name: "Medicine", href: "/category/medicine", image: premiumImg.medicine },
          { name: "Healthcare", href: "/category/healthcare", image: premiumImg.device },
          { name: "Medical Devices", href: "/category/medical-devices", image: premiumImg.device },
          { name: "Herbal", href: "/category/herbal", image: premiumImg.herbal },
          { name: "Homeopathy", href: "/category/homeopathy", image: premiumImg.herbal },
          { name: "Supplement", href: "/category/supplement", image: premiumImg.vitamin },
        ],
      },
      {
        title: "Beauty & personal care",
        items: [
          { name: "Beauty", href: "/category/beauty", image: premiumImg.beauty },
          { name: "Skincare", href: "/category/skincare", image: premiumImg.skincare },
          { name: "Haircare", href: "/category/haircare", image: premiumImg.hair },
          { name: "Feminine Care", href: "/category/feminine-care", image: premiumImg.beauty },
          { name: "Sexual Wellness", href: "/category/sexual-wellness", image: premiumImg.wellness },
        ],
      },
      {
        title: "Lifestyle",
        items: [
          { name: "Baby & Mom Care", href: "/category/baby-mom", image: premiumImg.baby },
          { name: "Food & Nutrition", href: "/category/food-nutrition", image: premiumImg.food },
          { name: "Homecare", href: "/category/homecare", image: premiumImg.home },
          { name: "Pet Care", href: "/category/pet-care", image: premiumImg.pet },
          { name: "All Products", href: "/store", badge: "Shop" },
          { name: "Flash Sale", href: "/store?flash=1", badge: "Sale" },
        ],
      },
    ],
    featured: {
      title: "Ahona Pharmacy",
      desc: "Genuine medicines, beauty & wellness with express delivery",
      href: "/store",
      image: premiumImg.heroStore,
      cta: "Shop now",
    },
  },
  {
    id: "lab",
    label: "Tests",
    href: "/lab-test",
    match: ["/lab-test"],
    tagline: "Tests & packages",
    columns: [
      {
        title: "Popular tests",
        items: [
          { name: "CBC", href: "/lab-test", desc: "Complete blood count" },
          { name: "TSH (Thyroid)", href: "/lab-test", desc: "Thyroid function" },
          { name: "HbA1c", href: "/lab-test", desc: "Diabetes monitoring" },
          { name: "Lipid Profile", href: "/lab-test", desc: "Heart health" },
          { name: "Vitamin D", href: "/lab-test", desc: "Deficiency check" },
          { name: "Urine R/E", href: "/lab-test", desc: "Routine exam" },
        ],
      },
      {
        title: "Health packages",
        items: [
          { name: "Full Body Checkup", href: "/lab-test", badge: "Best" },
          { name: "Dengue Package", href: "/lab-test" },
          { name: "Diabetes Package", href: "/lab-test" },
          { name: "Cardiac Screening", href: "/lab-test" },
          { name: "Women's Health", href: "/lab-test" },
          { name: "Men's Executive", href: "/lab-test" },
        ],
      },
      {
        title: "By concern",
        items: [
          { name: "Heart Health", href: "/lab-test" },
          { name: "Thyroid", href: "/lab-test" },
          { name: "Fever & Infection", href: "/lab-test" },
          { name: "Liver & Kidney", href: "/lab-test" },
          { name: "Home Collection", href: "/lab-test", desc: "Sample at doorstep" },
          { name: "Digital Reports", href: "/lab-test", desc: "On your phone" },
        ],
      },
    ],
    featured: {
      title: "Lab at Home",
      desc: "Trusted partners · Home sample · Digital reports",
      href: "/lab-test",
      image: premiumImg.heroLab,
      cta: "Book a test",
    },
  },
  {
    id: "doctor",
    label: "Consult",
    href: "/doctors",
    match: [
      "/doctors",
      "/consultations",
      "/my-consultations",
      "/prescriptions",
      "/doctor-portal",
    ],
    tagline: "Online consultation",
    columns: [
      {
        title: "Specialties",
        items: [
          { name: "General Physician", href: "/doctors?specialty=General+Physician" },
          { name: "Cardiologist", href: "/doctors?specialty=Cardiologist" },
          { name: "Dermatologist", href: "/doctors?specialty=Dermatologist" },
          { name: "Pediatrician", href: "/doctors?specialty=Pediatrician" },
          { name: "Gynecologist", href: "/doctors?specialty=Gynecologist" },
          { name: "Orthopedic", href: "/doctors?specialty=Orthopedic" },
        ],
      },
      {
        title: "Services",
        items: [
          { name: "Available now", href: "/doctors?available=1", badge: "Live" },
          { name: "Video Consult", href: "/doctors" },
          { name: "Audio Consult", href: "/doctors" },
          { name: "My consultations", href: "/my-consultations" },
          { name: "E-prescriptions", href: "/my-consultations" },
          { name: "Doctor portal", href: "/doctor-portal" },
        ],
      },
      {
        title: "Why Ahona",
        items: [
          { name: "Verified doctors", href: "/doctors", desc: "BMDC registered" },
          { name: "From ৳199", href: "/doctors", desc: "Transparent fees" },
          { name: "Agora HD calls", href: "/doctors", desc: "Audio + video" },
          { name: "PDF prescription", href: "/doctors", desc: "Download & print" },
        ],
      },
    ],
    featured: {
      title: "Talk to a Doctor",
      desc: "Video or audio with specialists — from home",
      href: "/doctors",
      image: premiumImg.heroDoctor,
      cta: "Find a doctor",
    },
  },
];

export function getActiveTabId(pathname: string): HubTab["id"] {
  // More specific routes first
  if (
    pathname.startsWith("/doctors") ||
    pathname.startsWith("/consultations") ||
    pathname.startsWith("/my-consultations") ||
    pathname.startsWith("/prescriptions") ||
    pathname.startsWith("/doctor-portal")
  ) {
    return "doctor";
  }
  if (pathname.startsWith("/lab-test")) return "lab";
  if (
    pathname.startsWith("/store") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/category") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout")
  ) {
    return "store";
  }
  return "all";
}
