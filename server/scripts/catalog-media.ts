/**
 * Download Open Beauty / Open Food Facts pack photos into /uploads.
 * Data is ODbL; we store a local JPEG so the store does not hotlink.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export const BOT_UA = "AhonaPharmacy/1.0 (local catalog; open facts import)";

export function preferFullImage(url: string): string {
  return url
    .replace(/\.400\.jpe?g(\?.*)?$/i, ".full.jpg")
    .replace(/\.200\.jpe?g(\?.*)?$/i, ".full.jpg");
}

export function uploadsDir(...parts: string[]): string {
  return path.join(process.cwd(), "uploads", ...parts);
}

export async function saveRemoteImage(opts: {
  url: string;
  folder: string;
  filename: string;
}): Promise<string | null> {
  const destDir = uploadsDir(opts.folder);
  fs.mkdirSync(destDir, { recursive: true });
  const urls = [preferFullImage(opts.url), opts.url].filter(
    (u, i, a) => a.indexOf(u) === i,
  );
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": BOT_UA } });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1200) continue;
      const jpeg = await sharp(buf)
        .rotate()
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 86 })
        .toBuffer();
      const file = `${opts.filename}.jpg`;
      fs.writeFileSync(path.join(destDir, file), jpeg);
      return `/uploads/${opts.folder}/${file}`;
    } catch {
      continue;
    }
  }
  return null;
}
