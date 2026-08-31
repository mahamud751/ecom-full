/**
 * Upsert a full lab-test catalog with sample type, fasting, prep, overview.
 * Does not wipe the store catalog.
 * From server/: npx tsx scripts/enrich-lab.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BLOOD = "/uploads/forms/injection.jpg";
const URINE = "/uploads/forms/drops.jpg";
const PANEL = "/uploads/forms/medicine-hero.jpg";

type TestSeed = {
  name: string;
  slug: string;
  price: number;
  comparePrice: number;
  reportHours: number;
  bookedCount: number;
  category: string;
  image: string;
  sortOrder: number;
  alsoKnownAs?: string;
  sampleType: string;
  fastingRequired: boolean;
  preparation: string;
  description: string;
};

const TESTS: TestSeed[] = [
  {
    name: "CBC",
    slug: "cbc",
    price: 450,
    comparePrice: 600,
    reportHours: 20,
    bookedCount: 7486,
    category: "Blood",
    image: BLOOD,
    sortOrder: 1,
    alsoKnownAs: "Complete Blood Count · Full blood count",
    sampleType: "Blood",
    fastingRequired: false,
    preparation:
      "No fasting needed. Stay hydrated. Tell the collector about recent fever, chemotherapy, or blood-thinning medicines.",
    description:
      "A Complete Blood Count measures red cells, white cells, hemoglobin, hematocrit, and platelets.\n\nDoctors use it to screen for anemia, infection, inflammation, and some blood disorders. It is often the first test in a fever, weakness, or pre-surgery workup.\n\nResults are interpreted with your symptoms — a single abnormal value is not a diagnosis.",
  },
  {
    name: "Serum Creatinine",
    slug: "serum-creatinine",
    price: 350,
    comparePrice: 450,
    reportHours: 12,
    bookedCount: 4798,
    category: "Kidney",
    image: BLOOD,
    sortOrder: 2,
    alsoKnownAs: "Creatinine · Kidney function",
    sampleType: "Blood",
    fastingRequired: false,
    preparation:
      "Usually no fasting. Avoid heavy meat meals just before the test if your doctor asked. List all medicines, especially painkillers.",
    description:
      "Serum creatinine reflects how well the kidneys filter waste from blood.\n\nIt is used to estimate GFR, monitor chronic kidney disease, and check kidney safety before some medicines (e.g. contrast scans, certain antibiotics).\n\nHydration, muscle mass, and some drugs can change the number. Follow up with your physician.",
  },
  {
    name: "Serum Electrolytes",
    slug: "serum-electrolytes",
    price: 500,
    comparePrice: 650,
    reportHours: 12,
    bookedCount: 2943,
    category: "Blood",
    image: BLOOD,
    sortOrder: 3,
    alsoKnownAs: "Na / K / Cl panel",
    sampleType: "Blood",
    fastingRequired: false,
    preparation:
      "No fasting. Mention vomiting, diarrhea, diuretics, or heart/kidney disease to the collector.",
    description:
      "This panel measures sodium, potassium, and chloride — salts that keep nerves, muscles, and fluid balance working.\n\nIt is ordered in dehydration, weakness, heart rhythm issues, kidney disease, and while on diuretics.\n\nAbnormal potassium needs prompt medical review.",
  },
  {
    name: "Urine R/E",
    slug: "urine-re",
    price: 250,
    comparePrice: 350,
    reportHours: 12,
    bookedCount: 2624,
    category: "Urine",
    image: URINE,
    sortOrder: 4,
    alsoKnownAs: "Urine routine examination · Urinalysis",
    sampleType: "Urine",
    fastingRequired: false,
    preparation:
      "Collect a mid-stream sample in a sterile container, preferably first morning urine. Wash the area before collecting. Do not mix with stool.",
    description:
      "Urine R/E looks at color, pH, protein, sugar, blood, and microscopy for cells or crystals.\n\nIt helps screen UTI, kidney disease, diabetes spill-over, and unexplained fever.\n\nA culture may be added if infection is suspected.",
  },
  {
    name: "ESR",
    slug: "esr",
    price: 200,
    comparePrice: 300,
    reportHours: 12,
    bookedCount: 2010,
    category: "Blood",
    image: BLOOD,
    sortOrder: 5,
    alsoKnownAs: "Erythrocyte sedimentation rate · Westergren",
    sampleType: "Blood",
    fastingRequired: false,
    preparation: "No fasting. Inform if you are pregnant or have a recent infection.",
    description:
      "ESR is a non-specific marker of inflammation. Red cells settle faster when proteins of inflammation are high.\n\nIt is used with other tests (often CRP and CBC) for fever, arthritis, and follow-up of inflammatory disease.\n\nIt does not name the cause by itself.",
  },
  {
    name: "TSH (Thyroid)",
    slug: "tsh-thyroid",
    price: 600,
    comparePrice: 800,
    reportHours: 12,
    bookedCount: 1975,
    category: "Thyroid",
    image: BLOOD,
    sortOrder: 6,
    alsoKnownAs: "Thyroid stimulating hormone",
    sampleType: "Blood",
    fastingRequired: false,
    preparation:
      "No fasting. Take thyroid tablets after the sample unless your doctor said otherwise. Morning collection is preferred.",
    description:
      "TSH is the pituitary signal that drives the thyroid. High TSH often means underactive thyroid; low TSH can mean overactive thyroid or excess thyroxine.\n\nUsed for fatigue, weight change, palpitations, infertility workup, and monitoring thyroxine dose.\n\nFree T4 / T3 may be added if TSH is abnormal.",
  },
  {
    name: "HbA1c",
    slug: "hba1c",
    price: 700,
    comparePrice: 900,
    reportHours: 24,
    bookedCount: 3200,
    category: "Diabetes",
    image: BLOOD,
    sortOrder: 7,
    alsoKnownAs: "Glycated hemoglobin · A1c",
    sampleType: "Blood",
    fastingRequired: false,
    preparation:
      "No fasting. You can take regular diabetes medicines unless told otherwise.",
    description:
      "HbA1c shows average blood sugar over about 8–12 weeks.\n\nIt diagnoses and monitors diabetes and is less affected by a single meal than a random sugar.\n\nAnemia, kidney disease, and some hemoglobin variants can shift the result — your doctor will read it in context.",
  },
  {
    name: "Lipid Profile",
    slug: "lipid-profile",
    price: 800,
    comparePrice: 1100,
    reportHours: 24,
    bookedCount: 2800,
    category: "Heart",
    image: BLOOD,
    sortOrder: 8,
    alsoKnownAs: "Cholesterol panel · Lipid panel",
    sampleType: "Blood",
    fastingRequired: true,
    preparation:
      "Fast 9–12 hours (water is allowed). Do not eat or drink tea, coffee, or juice. Take usual morning medicines with water unless your doctor changed the plan.",
    description:
      "A lipid profile measures total cholesterol, HDL, LDL, and triglycerides.\n\nIt estimates heart and stroke risk and guides diet or statin treatment.\n\nRepeat yearly or as advised if you have diabetes, high blood pressure, or a family history of heart disease.",
  },
  {
    name: "Fasting Blood Sugar",
    slug: "fasting-blood-sugar",
    price: 180,
    comparePrice: 250,
    reportHours: 8,
    bookedCount: 4100,
    category: "Diabetes",
    image: BLOOD,
    sortOrder: 9,
    alsoKnownAs: "FBS · Fasting plasma glucose",
    sampleType: "Blood",
    fastingRequired: true,
    preparation:
      "Fast 8–10 hours. Water only. Do not take morning diabetes tablets until after the sample unless your doctor instructed otherwise.",
    description:
      "Fasting blood sugar is a snapshot of glucose after an overnight fast.\n\nUsed to screen and monitor diabetes and pre-diabetes, often together with HbA1c.\n\nOne high value should be confirmed; illness and steroids can raise sugar.",
  },
  {
    name: "SGPT (ALT)",
    slug: "sgpt-alt",
    price: 400,
    comparePrice: 520,
    reportHours: 12,
    bookedCount: 1880,
    category: "Liver",
    image: BLOOD,
    sortOrder: 10,
    alsoKnownAs: "ALT · Alanine aminotransferase",
    sampleType: "Blood",
    fastingRequired: false,
    preparation:
      "No fasting. Avoid alcohol for 24 hours. List all medicines and herbal products.",
    description:
      "SGPT (ALT) is a liver enzyme that rises when liver cells are irritated.\n\nOrdered for hepatitis screening, fatty liver, medicine monitoring, and unexplained fatigue or jaundice.\n\nSGOT, bilirubin, and ultrasound may be added.",
  },
  {
    name: "Vitamin D (25-OH)",
    slug: "vitamin-d",
    price: 1800,
    comparePrice: 2400,
    reportHours: 48,
    bookedCount: 1650,
    category: "Vitamin",
    image: BLOOD,
    sortOrder: 11,
    alsoKnownAs: "25-hydroxy vitamin D",
    sampleType: "Blood",
    fastingRequired: false,
    preparation: "No fasting. Mention vitamin D or calcium supplements.",
    description:
      "25-OH vitamin D is the storage form used to check deficiency.\n\nLow levels are common with indoor lifestyle, bone pain, and some autoimmune conditions.\n\nYour doctor decides replacement dose; do not self-megadose.",
  },
  {
    name: "Vitamin B12",
    slug: "vitamin-b12",
    price: 1200,
    comparePrice: 1600,
    reportHours: 48,
    bookedCount: 980,
    category: "Vitamin",
    image: BLOOD,
    sortOrder: 12,
    alsoKnownAs: "Cobalamin",
    sampleType: "Blood",
    fastingRequired: false,
    preparation: "No fasting. Tell us if you take B12 injections or multivitamins.",
    description:
      "Vitamin B12 supports nerves and red-cell production.\n\nTested for anemia, tingling, vegetarian diet, long-term antacid use, or gastric surgery.\n\nLow values are treated with diet or injections as prescribed.",
  },
  {
    name: "Dengue NS1",
    slug: "dengue-ns1",
    price: 900,
    comparePrice: 1200,
    reportHours: 12,
    bookedCount: 2210,
    category: "Fever",
    image: BLOOD,
    sortOrder: 13,
    alsoKnownAs: "NS1 antigen",
    sampleType: "Blood",
    fastingRequired: false,
    preparation:
      "No fasting. Best in the first 5 days of fever. Bring any previous dengue reports.",
    description:
      "NS1 antigen detects dengue virus protein early in illness, often before antibodies appear.\n\nA CBC (platelets, hematocrit) is usually done the same day.\n\nA negative NS1 does not fully rule out dengue — IgM/IgG may be needed later. Seek care for warning signs (bleeding, severe pain, vomiting).",
  },
  {
    name: "CRP",
    slug: "crp",
    price: 650,
    comparePrice: 850,
    reportHours: 12,
    bookedCount: 1420,
    category: "Blood",
    image: BLOOD,
    sortOrder: 14,
    alsoKnownAs: "C-reactive protein",
    sampleType: "Blood",
    fastingRequired: false,
    preparation: "No fasting.",
    description:
      "CRP rises quickly with infection or inflammation and falls as it settles.\n\nUsed with CBC for fever, post-operative follow-up, and some autoimmune diseases.\n\nHigh-sensitivity CRP (hs-CRP) for heart risk is a different order — this is the standard CRP.",
  },
  {
    name: "Blood Grouping & Rh",
    slug: "blood-grouping",
    price: 300,
    comparePrice: 400,
    reportHours: 8,
    bookedCount: 3100,
    category: "Blood",
    image: BLOOD,
    sortOrder: 15,
    alsoKnownAs: "ABO & Rh typing",
    sampleType: "Blood",
    fastingRequired: false,
    preparation: "No fasting.",
    description:
      "Determines ABO group and Rh factor.\n\nNeeded before transfusion, in pregnancy, and for personal records.\n\nKeep a copy with you; grouping is not a substitute for cross-match at the hospital.",
  },
  {
    name: "HBsAg",
    slug: "hbsag",
    price: 550,
    comparePrice: 750,
    reportHours: 24,
    bookedCount: 890,
    category: "Infection",
    image: BLOOD,
    sortOrder: 16,
    alsoKnownAs: "Hepatitis B surface antigen",
    sampleType: "Blood",
    fastingRequired: false,
    preparation: "No fasting.",
    description:
      "HBsAg screens for hepatitis B infection.\n\nOrdered in jaundice, pre-surgery, pregnancy, and high-risk exposure.\n\nA positive result needs confirmatory and liver tests; vaccination is the best prevention if negative and unvaccinated.",
  },
  {
    name: "Serum Uric Acid",
    slug: "uric-acid",
    price: 380,
    comparePrice: 500,
    reportHours: 12,
    bookedCount: 1340,
    category: "Kidney",
    image: BLOOD,
    sortOrder: 17,
    alsoKnownAs: "UA",
    sampleType: "Blood",
    fastingRequired: false,
    preparation: "No fasting. Avoid a heavy meat meal the night before if possible.",
    description:
      "Uric acid is the end product of purine metabolism. High levels relate to gout and some kidney stones.\n\nUsed for joint pain, swelling of the big toe, and monitoring gout treatment.\n\nDiet and some medicines (e.g. diuretics) affect the value.",
  },
  {
    name: "Stool R/E",
    slug: "stool-re",
    price: 280,
    comparePrice: 380,
    reportHours: 12,
    bookedCount: 760,
    category: "Stool",
    image: URINE,
    sortOrder: 18,
    alsoKnownAs: "Stool routine examination",
    sampleType: "Stool",
    fastingRequired: false,
    preparation:
      "Collect a fresh sample in a clean dry container. Do not mix with urine. Return to the collector the same morning.",
    description:
      "Stool R/E looks for blood, mucus, fat, ova, and parasites.\n\nOrdered for diarrhea, abdominal pain, and worm suspicion.\n\nCulture or occult-blood tests may be added.",
  },
];

const PACKAGES: {
  name: string;
  slug: string;
  price: number;
  comparePrice: number;
  reportHours: number;
  description: string;
  sortOrder: number;
  image: string;
  testSlugs: string[];
}[] = [
  {
    name: "Dengue Package",
    slug: "dengue-package",
    price: 1200,
    comparePrice: 1800,
    reportHours: 24,
    description:
      "Early fever workup: CBC (platelets & hematocrit) plus ESR. Pair with Dengue NS1 in the first 5 days of fever as advised by your doctor.",
    sortOrder: 1,
    image: PANEL,
    testSlugs: ["cbc", "esr"],
  },
  {
    name: "Full Body Checkup",
    slug: "full-body-checkup",
    price: 3999,
    comparePrice: 6500,
    reportHours: 48,
    description:
      "A broad screening panel covering blood, kidney, electrolytes, urine, thyroid, and sugar control. Fast 9–12 hours for the best lipid and sugar readings included in follow-on tests.",
    sortOrder: 2,
    image: PANEL,
    testSlugs: ["cbc", "serum-creatinine", "serum-electrolytes", "urine-re", "esr", "tsh-thyroid"],
  },
  {
    name: "Diabetes Package",
    slug: "diabetes-package",
    price: 1499,
    comparePrice: 2200,
    reportHours: 24,
    description:
      "HbA1c plus kidney creatinine for people living with diabetes or with a family history. Fasting sugar can be added the same morning.",
    sortOrder: 3,
    image: BLOOD,
    testSlugs: ["hba1c", "serum-creatinine", "fasting-blood-sugar"],
  },
  {
    name: "Heart Risk Package",
    slug: "heart-risk-package",
    price: 1899,
    comparePrice: 2600,
    reportHours: 24,
    description:
      "Lipid profile, fasting sugar, and creatinine — a practical yearly heart-kidney screen. Fast 9–12 hours.",
    sortOrder: 4,
    image: BLOOD,
    testSlugs: ["lipid-profile", "fasting-blood-sugar", "serum-creatinine"],
  },
  {
    name: "Fever Panel",
    slug: "fever-panel",
    price: 1599,
    comparePrice: 2200,
    reportHours: 24,
    description:
      "CBC, ESR, CRP, and Dengue NS1 for acute fever. Home collection the same day in Dhaka coverage areas.",
    sortOrder: 5,
    image: BLOOD,
    testSlugs: ["cbc", "esr", "crp", "dengue-ns1"],
  },
];

async function main() {
  for (const t of TESTS) {
    await prisma.labTest.upsert({
      where: { slug: t.slug },
      create: t,
      update: {
        name: t.name,
        description: t.description,
        alsoKnownAs: t.alsoKnownAs,
        sampleType: t.sampleType,
        fastingRequired: t.fastingRequired,
        preparation: t.preparation,
        image: t.image,
        price: t.price,
        comparePrice: t.comparePrice,
        reportHours: t.reportHours,
        category: t.category,
        sortOrder: t.sortOrder,
        isActive: true,
      },
    });
  }

  const all = await prisma.labTest.findMany({ select: { id: true, slug: true } });
  const idBySlug = Object.fromEntries(all.map((t) => [t.slug, t.id]));

  for (const p of PACKAGES) {
    const testIds = p.testSlugs.map((s) => idBySlug[s]).filter(Boolean);
    const { testSlugs: _s, ...data } = p;
    await prisma.labPackage.upsert({
      where: { slug: p.slug },
      create: {
        ...data,
        items: { create: testIds.map((testId) => ({ testId })) },
      },
      update: {
        name: p.name,
        description: p.description,
        image: p.image,
        price: p.price,
        comparePrice: p.comparePrice,
        reportHours: p.reportHours,
        sortOrder: p.sortOrder,
        isActive: true,
        items: {
          deleteMany: {},
          create: testIds.map((testId) => ({ testId })),
        },
      },
    });
  }

  const [tests, packages] = await Promise.all([
    prisma.labTest.count(),
    prisma.labPackage.count(),
  ]);
  console.log(`Done. tests=${tests} packages=${packages}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
