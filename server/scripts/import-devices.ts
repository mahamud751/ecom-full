/**
 * Original medical-device SKUs with generated pack art.
 * Not copied from Arogga / Daraz listings.
 *
 * From server/: npx tsx scripts/import-devices.ts
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { devicePackSvg } from "../src/catalog/pack-art";

const prisma = new PrismaClient();

const DEVICES = [
  {
    sku: "DEV-THERM-01",
    name: "Digital Thermometer",
    kind: "thermometer",
    price: 250,
    compare: 320,
    unit: "1 pc",
    shortDesc: "60-second oral / underarm reading",
    description:
      "Compact digital thermometer for home use. Displays temperature in °C, auto shut-off, and a beep when the reading is ready. Suitable for oral or underarm measurement. Follow the included hygiene instructions; replace the probe cover after each use.",
  },
  {
    sku: "DEV-BP-01",
    name: "Automatic Blood Pressure Monitor",
    kind: "bp",
    price: 2190,
    compare: 2650,
    unit: "1 set",
    shortDesc: "Upper-arm cuff · memory recall",
    description:
      "Upper-arm automatic blood pressure monitor with an adult cuff, large LCD, and memory for recent readings. Sit still for 5 minutes before measuring. This device is for home tracking and does not replace a clinician's diagnosis.",
  },
  {
    sku: "DEV-OXI-01",
    name: "Fingertip Pulse Oximeter",
    kind: "oximeter",
    price: 890,
    compare: 1150,
    unit: "1 pc",
    shortDesc: "SpO2 and pulse rate",
    description:
      "Clip-on fingertip pulse oximeter that estimates oxygen saturation (SpO2) and pulse rate. Use on a clean, warm finger. Readings are for wellness tracking only — seek medical care if you feel unwell.",
  },
  {
    sku: "DEV-NEB-01",
    name: "Compressor Nebulizer",
    kind: "nebulizer",
    price: 1850,
    compare: 2290,
    unit: "1 set",
    shortDesc: "Adult and child masks included",
    description:
      "Home compressor nebulizer kit with adult and child masks plus a mouthpiece. Use only with medicines prescribed for nebulization. Clean the chamber and masks after each session as described in the manual.",
  },
  {
    sku: "DEV-GLU-01",
    name: "Blood Glucose Meter Kit",
    kind: "glucometer",
    price: 1490,
    compare: 1890,
    unit: "1 kit",
    shortDesc: "Meter + 10 lancets",
    description:
      "Blood glucose monitoring kit with meter, lancing device, and a starter pack of lancets. Compatible strips sold separately. Calibrate and store strips as the insert directs. Discuss target ranges with your doctor.",
  },
  {
    sku: "DEV-SCALE-01",
    name: "Digital Body Weight Scale",
    kind: "scale",
    price: 980,
    compare: 1250,
    unit: "1 pc",
    shortDesc: "Tempered glass · kg display",
    description:
      "Household digital weighing scale with a tempered-glass platform and kilogram readout. Place on a hard, level floor. Not a medical diagnostic device.",
  },
  {
    sku: "DEV-HWB-01",
    name: "Hot Water Bag",
    kind: "bag",
    price: 180,
    compare: 240,
    unit: "1 pc",
    shortDesc: "Rubber bag for heat therapy",
    description:
      "Reusable rubber hot water bag for local heat therapy. Fill with hot — not boiling — water, expel air, and seal firmly. Wrap in a cloth before placing on skin. Do not use on broken skin or while sleeping.",
  },
  {
    sku: "DEV-ICE-01",
    name: "Reusable Ice Pack",
    kind: "bag",
    price: 160,
    compare: 210,
    unit: "1 pc",
    shortDesc: "Cold compress gel pack",
    description:
      "Flexible gel ice pack for cold compresses after minor bumps or muscle strain. Keep in the freezer and wrap in a thin cloth before use. Limit each session to 15–20 minutes.",
  },
  {
    sku: "DEV-KIT-01",
    name: "Home First Aid Kit",
    kind: "kit",
    price: 690,
    compare: 850,
    unit: "1 box",
    shortDesc: "Bandages, gauze, antiseptic",
    description:
      "Compact first-aid box with adhesive bandages, sterile gauze, antiseptic wipes, medical tape, and scissors. Check expiry dates and restock after use. Not a substitute for emergency care.",
  },
  {
    sku: "DEV-MASK-01",
    name: "3-Ply Surgical Face Mask (50 pcs)",
    kind: "mask",
    price: 220,
    compare: 280,
    unit: "50 pcs",
    shortDesc: "Ear-loop disposable masks",
    description:
      "Box of 50 disposable 3-ply ear-loop face masks. Change when damp or soiled. Single use — do not wash or share.",
  },
  {
    sku: "DEV-GLOVE-01",
    name: "Disposable Examination Gloves (100 pcs)",
    kind: "kit",
    price: 380,
    compare: 460,
    unit: "100 pcs",
    shortDesc: "Powder-free · medium",
    description:
      "Powder-free disposable examination gloves, medium size, box of 100. For single-use hygiene. Check for latex if you have an allergy.",
  },
  {
    sku: "DEV-STEAM-01",
    name: "Steam Vaporizer",
    kind: "nebulizer",
    price: 720,
    compare: 890,
    unit: "1 pc",
    shortDesc: "Personal steam inhaler",
    description:
      "Electric steam vaporizer for personal inhalation. Use with water only unless a clinician advises otherwise. Keep out of reach of children and never leave the unit unattended while on.",
  },
  {
    sku: "DEV-NEBMSK-01",
    name: "Nebulizer Mask Set (Adult + Child)",
    kind: "mask",
    price: 240,
    compare: 310,
    unit: "1 set",
    shortDesc: "Replacement masks + tubing",
    description:
      "Replacement adult and child nebulizer masks with connecting tube. Compatible with standard compressor nebulizers. Wash after each use and replace when cloudy or cracked.",
  },
  {
    sku: "DEV-STRIP-01",
    name: "Glucose Test Strips (50 pcs)",
    kind: "glucometer",
    price: 780,
    compare: 950,
    unit: "50 pcs",
    shortDesc: "For DEV-GLU-01 meter",
    description:
      "Pack of 50 blood glucose test strips for the Ahona glucose meter kit. Keep the vial closed and dry. Do not use expired strips. Follow the meter insert for coding and sample size.",
  },
  {
    sku: "DEV-LANC-01",
    name: "Sterile Lancets (100 pcs)",
    kind: "glucometer",
    price: 160,
    compare: 210,
    unit: "100 pcs",
    shortDesc: "Universal fit · 30G",
    description:
      "Box of 100 sterile 30G lancets for lancing devices. Single use. Dispose of in a puncture-safe container.",
  },
  {
    sku: "DEV-WHEEL-01",
    name: "Manual Wheelchair (Foldable)",
    kind: "other",
    price: 8900,
    compare: 10500,
    unit: "1 pc",
    shortDesc: "Steel frame · desk-arm",
    description:
      "Foldable steel-frame manual wheelchair with desk-style armrests and swing-away footrests. Check tyre pressure and brakes before each use. Have a caregiver assist on slopes.",
  },
  {
    sku: "DEV-STICK-01",
    name: "Adjustable Walking Stick",
    kind: "other",
    price: 450,
    compare: 560,
    unit: "1 pc",
    shortDesc: "Height-adjustable · rubber tip",
    description:
      "Height-adjustable walking stick with a rubber tip and wrist strap. Set the height so the elbow is slightly bent. Replace the tip when worn.",
  },
  {
    sku: "DEV-BAND-01",
    name: "Elastic Compression Bandage",
    kind: "kit",
    price: 90,
    compare: 120,
    unit: "1 pc",
    shortDesc: "Crepe bandage 6 cm × 4 m",
    description:
      "Reusable crepe compression bandage (6 cm × 4 m) for support wrapping. Do not wrap so tightly that fingers or toes tingle or lose colour. Seek care for suspected fractures.",
  },
];

async function main() {
  const cat =
    (await prisma.category.findUnique({ where: { slug: "medical-devices" } })) ||
    (await prisma.category.create({
      data: { name: "Medical Devices", slug: "medical-devices", isActive: true, sortOrder: 13 },
    }));

  let brand = await prisma.brand.findUnique({ where: { slug: "ahona-care" } });
  if (!brand) {
    brand = await prisma.brand.create({ data: { name: "Ahona Care", slug: "ahona-care" } });
  }

  const out = path.join(process.cwd(), "uploads", "packs");
  fs.mkdirSync(out, { recursive: true });

  let imported = 0;
  let skipped = 0;
  for (const d of DEVICES) {
    const existing = await prisma.product.findUnique({ where: { sku: d.sku } });
    const svg = devicePackSvg({
      sku: d.sku,
      name: d.name,
      kind: d.kind,
      manufacturer: "Ahona Care",
    });
    fs.writeFileSync(path.join(out, `${d.sku}.svg`), svg);
    await sharp(Buffer.from(svg))
      .resize(640, 640)
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82 })
      .toFile(path.join(out, `${d.sku}.jpg`));
    const image = `/uploads/packs/${d.sku}.jpg`;
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { image, images: [image] },
      });
      skipped++;
      continue;
    }
    const slug = d.sku.toLowerCase();
    await prisma.product.create({
      data: {
        name: d.name,
        slug,
        sku: d.sku,
        description: d.description,
        shortDesc: d.shortDesc,
        image,
        images: [image],
        price: d.price,
        comparePrice: d.compare,
        stock: 40,
        unit: d.unit,
        rating: 4.5,
        reviewCount: 12 + imported,
        isFeatured: imported < 4,
        isMedicine: false,
        requiresRx: false,
        tags: ["device", "otc", d.kind],
        section: "medical-devices",
        categoryId: cat.id,
        brandId: brand.id,
        expressDelivery: true,
        isActive: true,
      },
    });
    imported++;
  }
  const n = await prisma.product.count({ where: { category: { slug: "medical-devices" } } });
  console.log(`Done. imported=${imported} updated=${skipped} medical-devices=${n}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
