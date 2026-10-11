/**
 * Copy banner heroes and download catalog/form photos into /uploads.
 * From server/: npx tsx scripts/prepare-media.ts
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { saveRemoteImage } from "./catalog-media";

const ROOT = process.cwd();

const BANNER_FILES = ["pharmacy.jpg", "beauty.jpg", "doctor.jpg", "lab.jpg"];

const FORM_SRC: Record<string, string> = {
  tablet:
    "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=1200&h=1200&q=90",
  capsule:
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&h=1200&q=90",
  syrup:
    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1200&h=1200&q=90",
  cream:
    "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1200&h=1200&q=90",
  injection:
    "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=1200&h=1200&q=90",
  drops:
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&h=1200&q=90",
  inhaler:
    "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&h=1200&q=90",
  powder:
    "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=1200&h=1200&q=90",
};

function alreadyGood(file: string): boolean {
  return fs.existsSync(file) && fs.statSync(file).size > 2000;
}

export function copyBannerHeroes(): number {
  const dest = path.join(ROOT, "uploads", "brand", "heroes");
  const webDest = path.join(ROOT, "..", "web", "public", "uploads", "brand", "heroes");
  const sources = [
    path.join(ROOT, "..", "web", "public", "brand", "heroes"),
    path.join(ROOT, "uploads", "brand", "heroes"),
  ];
  fs.mkdirSync(dest, { recursive: true });
  fs.mkdirSync(webDest, { recursive: true });

  const srcDir = sources.find((dir) =>
    BANNER_FILES.every((f) => fs.existsSync(path.join(dir, f))),
  );
  if (!srcDir) {
    console.warn("Banner hero sources not found under web/public/brand/heroes");
    return 0;
  }

  let copied = 0;
  for (const file of BANNER_FILES) {
    const from = path.join(srcDir, file);
    const apiTo = path.join(dest, file);
    const webTo = path.join(webDest, file);
    if (from !== apiTo) fs.copyFileSync(from, apiTo);
    fs.copyFileSync(from, webTo);
    copied++;
  }
  return copied;
}

async function makeMedicineHero() {
  const formsDir = path.join(ROOT, "uploads", "forms");
  const tiles = ["tablet", "syrup", "capsule", "drops"];
  for (const name of tiles) {
    if (!alreadyGood(path.join(formsDir, `${name}.jpg`))) return;
  }
  const resized = await Promise.all(
    tiles.map((name) =>
      sharp(path.join(formsDir, `${name}.jpg`))
        .resize(560, 560, { fit: "cover" })
        .jpeg()
        .toBuffer(),
    ),
  );
  await sharp({
    create: { width: 1200, height: 1200, channels: 3, background: "#f4f1ea" },
  })
    .composite([
      { input: resized[0], left: 32, top: 32 },
      { input: resized[1], left: 608, top: 32 },
      { input: resized[2], left: 32, top: 608 },
      { input: resized[3], left: 608, top: 608 },
    ])
    .jpeg({ quality: 86 })
    .toFile(path.join(formsDir, "medicine-hero.jpg"));
}

export async function prepareFormPhotos(): Promise<number> {
  let saved = 0;
  for (const [name, url] of Object.entries(FORM_SRC)) {
    const dest = path.join(ROOT, "uploads", "forms", `${name}.jpg`);
    if (alreadyGood(dest)) {
      saved++;
      continue;
    }
    const local = await saveRemoteImage({ url, folder: "forms", filename: name });
    if (local) saved++;
    else console.warn(`Failed to download form photo ${name}`);
  }
  const hero = path.join(ROOT, "uploads", "forms", "medicine-hero.jpg");
  if (!alreadyGood(hero)) {
    try {
      await makeMedicineHero();
    } catch (err) {
      console.warn("medicine-hero composite failed", err);
    }
  }
  return saved;
}

export async function localizeUrl(
  url: string,
  folder: string,
  filename: string,
): Promise<string> {
  if (!url.startsWith("http")) return url;
  const dest = path.join(ROOT, "uploads", folder, `${filename}.jpg`);
  if (alreadyGood(dest)) return `/uploads/${folder}/${filename}.jpg`;
  const local = await saveRemoteImage({ url, folder, filename });
  return local || url;
}

export async function prepareMedia(): Promise<void> {
  const banners = copyBannerHeroes();
  const forms = await prepareFormPhotos();
  console.log(`Media ready — banners=${banners} formPhotos=${forms}`);
}

const direct = /prepare-media/.test(process.argv[1] || "");
if (direct) {
  prepareMedia()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .then(() => undefined);
}
