/**
 * Catalog / content labels for EN→BN (Daraz-style).
 * Product titles stay as DB; categories, specialties, UI phrases translate.
 */

import type { Locale } from "./messages";

/** Category slug → Bangla display name */
export const CATEGORY_BN: Record<string, string> = {
  medicine: "মেডিসিন",
  beauty: "বিউটি",
  "home-lab": "হোম ল্যাব",
  "food-nutrition": "খাদ্য ও পুষ্টি",
  "baby-mom": "বেবি ও মা",
  homecare: "হোমকেয়ার",
  "pet-care": "পেট কেয়ার",
  healthcare: "হেলথকেয়ার",
  herbal: "হার্বাল",
  haircare: "হেয়ারকেয়ার",
  skincare: "স্কিনকেয়ার",
  supplement: "সাপ্লিমেন্ট",
  "medical-devices": "মেডিকেল ডিভাইস",
  "sexual-wellness": "সেক্সুয়াল ওয়েলনেস",
  "feminine-care": "ফেমিনাইন কেয়ার",
  homeopathy: "হোমিওপ্যাথি",
  veterinary: "ভেটেরিনারি",
  dermatological: "ডার্মাটোলজিক্যাল",
};

/** Doctor specialty EN → BN */
export const SPECIALTY_BN: Record<string, string> = {
  "General Physician": "জেনারেল ফিজিশিয়ান",
  Cardiologist: "হৃদরোগ বিশেষজ্ঞ",
  Dermatologist: "চর্মরোগ বিশেষজ্ঞ",
  Pediatrician: "শিশু বিশেষজ্ঞ",
  Gynecologist: "স্ত্রীরোগ বিশেষজ্ঞ",
  Orthopedic: "অর্থোপেডিক",
  Neurologist: "স্নায়ুরোগ বিশেষজ্ঞ",
  "ENT Specialist": "নাক-কান-গলা",
  Psychiatrist: "মানসিক রোগ বিশেষজ্ঞ",
  "Eye Specialist": "চক্ষু বিশেষজ্ঞ",
  Dentist: "দন্তচিকিৎসক",
  Urologist: "ইউরোলজিস্ট",
  Endocrinologist: "এন্ডোক্রিনোলজিস্ট",
  Gastroenterologist: "গ্যাস্ট্রোএন্টেরোলজিস্ট",
};

/**
 * Free-form chrome phrases used in mega-menu / home / store.
 * Key is English source string.
 */
export const PHRASE_BN: Record<string, string> = {
  // Mega / nav
  Explore: "এক্সপ্লোর",
  "Popular categories": "জনপ্রিয় ক্যাটাগরি",
  "Quick services": "দ্রুত সার্ভিস",
  "Store — All Products": "স্টোর — সব পণ্য",
  "Flash Deals": "ফ্ল্যাশ ডিল",
  "Lab Tests": "ল্যাব টেস্ট",
  Doctors: "ডাক্তার",
  "Medicines & beauty": "মেডিসিন ও বিউটি",
  "Limited offers": "সীমিত অফার",
  "Home collection": "হোম কালেকশন",
  "Video consult": "ভিডিও পরামর্শ",
  "Upload Prescription": "প্রেসক্রিপশন আপলোড",
  "Get medicines fast": "দ্রুত মেডিসিন",
  "Full Body Checkup": "ফুল বডি চেকআপ",
  "Health packages": "হেলথ প্যাকেজ",
  "General Physician": "জেনারেল ফিজিশিয়ান",
  "From ৳199": "৳১৯৯ থেকে",
  "Express Delivery": "এক্সপ্রেস ডেলিভারি",
  "12–24 hours": "১২–২৪ ঘণ্টা",
  "Complete Health Hub": "সম্পূর্ণ হেলথ হাব",
  "Shop, test & consult — premium care under one roof":
    "কেনাকাটা, টেস্ট ও পরামর্শ — এক ছাদের নিচে",
  "Start shopping": "কেনাকাটা শুরু",
  "Health & medicine": "স্বাস্থ্য ও মেডিসিন",
  "Beauty & personal care": "বিউটি ও পার্সোনাল কেয়ার",
  Lifestyle: "লাইফস্টাইল",
  "Baby & Mom Care": "বেবি ও মা কেয়ার",
  "Food & Nutrition": "খাদ্য ও পুষ্টি",
  Homecare: "হোমকেয়ার",
  "Pet Care": "পেট কেয়ার",
  "All Products": "সব পণ্য",
  "Flash Sale": "ফ্ল্যাশ সেল",
  Shop: "শপ",
  Sale: "সেল",
  Hot: "হট",
  "Premium Store": "প্রিমিয়াম স্টোর",
  "Genuine medicines, beauty & wellness with express delivery":
    "অরিজিনাল মেডিসিন, বিউটি ও ওয়েলনেস — এক্সপ্রেস ডেলিভারি",
  "Browse store": "স্টোর দেখুন",
  "Popular tests": "জনপ্রিয় টেস্ট",
  "By concern": "সমস্যা অনুযায়ী",
  "Complete blood count": "সম্পূর্ণ রক্ত পরীক্ষা",
  "Thyroid function": "থাইরয়েড পরীক্ষা",
  "Diabetes monitoring": "ডায়াবেটিস মনিটরিং",
  "Heart health": "হার্ট হেলথ",
  "Deficiency check": "অভাব পরীক্ষা",
  "Routine exam": "রুটিন পরীক্ষা",
  Best: "বেস্ট",
  "Dengue Package": "ডেঙ্গু প্যাকেজ",
  "Diabetes Package": "ডায়াবেটিস প্যাকেজ",
  "Cardiac Screening": "কার্ডিয়াক স্ক্রিনিং",
  "Women's Health": "নারী স্বাস্থ্য",
  "Men's Executive": "পুরুষ এক্সিকিউটিভ",
  "Heart Health": "হার্ট হেলথ",
  Thyroid: "থাইরয়েড",
  "Fever & Infection": "জ্বর ও সংক্রমণ",
  "Liver & Kidney": "লিভার ও কিডনি",
  "Home Collection": "হোম কালেকশন",
  "Sample at doorstep": "দোরগোড়ায় স্যাম্পল",
  "Digital Reports": "ডিজিটাল রিপোর্ট",
  "On your phone": "মোবাইলে",
  "Lab at Home": "বাড়িতে ল্যাব",
  "Trusted partners · Home sample · Digital reports":
    "বিশ্বস্ত পার্টনার · হোম স্যাম্পল · ডিজিটাল রিপোর্ট",
  "Book a test": "টেস্ট বুক করুন",
  Specialties: "বিশেষত্ব",
  Services: "সার্ভিস",
  "Why Ahona": "কেন Ahona",
  "Available now": "এখন উপলব্ধ",
  Live: "লাইভ",
  "Video Consult": "ভিডিও পরামর্শ",
  "Audio Consult": "অডিও পরামর্শ",
  "My consultations": "আমার পরামর্শ",
  "E-prescriptions": "ই-প্রেসক্রিপশন",
  "Doctor portal": "ডাক্তার পোর্টাল",
  "Verified doctors": "যাচাইকৃত ডাক্তার",
  "BMDC registered": "বিএমডিসি নিবন্ধিত",
  "Transparent fees": "স্বচ্ছ ফি",
  "Agora HD calls": "এইচডি কল",
  "Audio + video": "অডিও + ভিডিও",
  "PDF prescription": "পিডিএফ প্রেসক্রিপশন",
  "Download & print": "ডাউনলোড ও প্রিন্ট",
  "Talk to a Doctor": "ডাক্তারের সাথে কথা বলুন",
  "Video or audio with specialists — from home":
    "বাড়ি থেকে বিশেষজ্ঞের সাথে ভিডিও/অডিও",
  "Find a doctor": "ডাক্তার খুঁজুন",
  "Everything in one place": "সব এক জায়গায়",
  "Shop all products": "সব পণ্য কিনুন",
  "Tests & packages": "টেস্ট ও প্যাকেজ",
  "Online consultation": "অনলাইন পরামর্শ",
  // Common UI
  Medicine: "মেডিসিন",
  Beauty: "বিউটি",
  Skincare: "স্কিনকেয়ার",
  Haircare: "হেয়ারকেয়ার",
  Healthcare: "হেলথকেয়ার",
  Herbal: "হার্বাল",
  Supplement: "সাপ্লিমেন্ট",
  Homeopathy: "হোমিওপ্যাথি",
  "Medical Devices": "মেডিকেল ডিভাইস",
  "Feminine Care": "ফেমিনাইন কেয়ার",
  "Sexual Wellness": "সেক্সুয়াল ওয়েলনেস",
  "Baby & Mom": "বেবি ও মা",
  CBC: "সিবিসি",
  "TSH (Thyroid)": "টিএসএইচ (থাইরয়েড)",
  HbA1c: "এইচবিএ১সি",
  "Lipid Profile": "লিপিড প্রোফাইল",
  "Vitamin D": "ভিটামিন ডি",
  "Urine R/E": "ইউরিন আর/ই",
  Cardiologist: "হৃদরোগ বিশেষজ্ঞ",
  Dermatologist: "চর্মরোগ বিশেষজ্ঞ",
  Pediatrician: "শিশু বিশেষজ্ঞ",
  Gynecologist: "স্ত্রীরোগ বিশেষজ্ঞ",
  Orthopedic: "অর্থোপেডিক",
};

export function localizeCategory(
  locale: Locale,
  slug: string,
  fallbackName: string
): string {
  if (locale !== "bn") return fallbackName;
  return CATEGORY_BN[slug] || PHRASE_BN[fallbackName] || fallbackName;
}

export function localizeSpecialty(locale: Locale, specialty: string): string {
  if (locale !== "bn") return specialty;
  return SPECIALTY_BN[specialty] || PHRASE_BN[specialty] || specialty;
}

export function localizePhrase(locale: Locale, text: string): string {
  if (locale !== "bn" || !text) return text;
  return PHRASE_BN[text] || text;
}
