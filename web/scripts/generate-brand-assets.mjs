/**
 * Generate logo PNGs, favicons, apple-touch, and OG image from brand SVG.
 * Run: node scripts/generate-brand-assets.mjs
 */
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
const iconsDir = join(publicDir, "icons");
const brandDir = join(publicDir, "brand");

mkdirSync(iconsDir, { recursive: true });
mkdirSync(brandDir, { recursive: true });

/** Ahona dawn-A: letter A of the name, rising sun in the window (Ahona = dawn). */
const aPath =
  "M32 9.8 52.4 54h-8.6l-3.45-8.4H23.65L20.2 54H11.6L32 9.8Zm0 14.4 4.35 10.6h-8.7L32 24.2Z";
const sunPath = "M27.2 34.8a4.8 4.8 0 0 1 9.6 0H27.2Z";
const rayPath = "M32 26.6v2.3M27.7 28.2l1.5 1.7M36.3 28.2l-1.5 1.7";

function markInner() {
  return `<path fill="#c9a227" fill-rule="evenodd" d="${aPath}"/>
  <path fill="#e8c547" d="${sunPath}"/>
  <path fill="none" stroke="#e8c547" stroke-width="1.15" stroke-linecap="round" d="${rayPath}"/>`;
}

const markSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a5c56"/>
      <stop offset="100%" stop-color="#0c2a28"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#g)"/>
  ${markInner()}
</svg>`;

/** Tab-size mark: chunky gold A, no sun. The dawn-A smears to a blob at 16px. */
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0c2a28"/>
  <path fill="#c9a227" fill-rule="evenodd" d="M32 8.5 54 55h-10.2l-3.7-9.4H23.9L20.2 55H10L32 8.5Zm0 16.2 5.1 12.6h-10.2L32 24.7Z"/>
</svg>
`;

const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0c2a28"/>
      <stop offset="55%" stop-color="#164f4a"/>
      <stop offset="100%" stop-color="#1f6b64"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="980" cy="120" r="180" fill="#c9a227" opacity="0.12"/>
  <circle cx="200" cy="520" r="220" fill="#c9a227" opacity="0.08"/>
  <rect x="80" y="180" width="120" height="120" rx="28" fill="#0c2a28" stroke="#c9a227" stroke-width="3"/>
  <g transform="translate(80 180) scale(1.875)">${markInner()}</g>
  <text x="230" y="248" font-family="Liberation Serif, Georgia, Times New Roman, serif" font-size="84" font-weight="600" fill="#ffffff">Ahona</text>
  <text x="235" y="292" font-family="Liberation Sans, system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="6" fill="#c9a227">PREMIUM HEALTH</text>
  <text x="80" y="400" font-family="Liberation Sans, system-ui, sans-serif" font-size="36" font-weight="600" fill="#f8f6f1">Medicine · Lab · Doctor Consult</text>
  <text x="80" y="455" font-family="Liberation Sans, system-ui, sans-serif" font-size="24" fill="#e8e4db">Genuine care · Express delivery · Bangladesh</text>
  <rect x="80" y="500" width="220" height="48" rx="24" fill="#c9a227"/>
  <text x="190" y="532" text-anchor="middle" font-family="Liberation Sans, system-ui, sans-serif" font-size="18" font-weight="700" fill="#0c2a28">Shop online</text>
</svg>`;

async function pngFromSvg(svg, path, size) {
  const buf = Buffer.from(svg);
  let pipeline = sharp(buf);
  if (size) pipeline = pipeline.resize(size, size);
  await pipeline.png().toFile(path);
  console.log("wrote", path);
}

async function main() {
  // App icons
  await pngFromSvg(markSvg, join(iconsDir, "icon-192.png"), 192);
  await pngFromSvg(markSvg, join(iconsDir, "icon-512.png"), 512);
  await pngFromSvg(markSvg, join(iconsDir, "apple-touch-icon.png"), 180);
  await pngFromSvg(markSvg, join(brandDir, "logo-mark.png"), 256);

  writeFileSync(join(publicDir, "favicon.svg"), faviconSvg);
  writeFileSync(join(root, "src/app/icon.svg"), faviconSvg);
  await pngFromSvg(faviconSvg, join(publicDir, "favicon-32.png"), 32);
  await pngFromSvg(faviconSvg, join(publicDir, "favicon-16.png"), 16);
  await pngFromSvg(faviconSvg, join(publicDir, "favicon.png"), 48);

  const sizes = [16, 32, 48];
  const images = [];
  for (const s of sizes) {
    const buf = await sharp(Buffer.from(faviconSvg)).resize(s, s).png().toBuffer();
    images.push({ size: s, buf });
  }
  const ico = buildIco(images);
  writeFileSync(join(publicDir, "favicon.ico"), ico);
  writeFileSync(join(root, "src/app/favicon.ico"), ico);
  console.log("wrote favicon.ico + favicon.svg");
  await pngFromSvg(markSvg, join(root, "src/app/apple-icon.png"), 180);

  // OG image
  await sharp(Buffer.from(ogSvg)).png().toFile(join(publicDir, "og-image.png"));
  console.log("wrote og-image.png");

  // Brand wordmark PNG — Ahona + dawn-A mark
  const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="560" height="128" viewBox="0 0 280 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a5c56"/>
      <stop offset="100%" stop-color="#0c2a28"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="64" height="64" rx="16" fill="url(#g)"/>
  ${markInner()}
  <text x="80" y="34" font-family="Liberation Serif, Georgia, Times New Roman, serif" font-size="32" font-weight="600" fill="#0c2a28">Ahona</text>
  <text x="82" y="52" font-family="Liberation Sans, system-ui, sans-serif" font-size="10" font-weight="700" letter-spacing="2.4" fill="#9a7b1a">PREMIUM HEALTH</text>
</svg>`;
  await sharp(Buffer.from(logoSvg)).png().toFile(join(brandDir, "logo.png"));
  writeFileSync(join(brandDir, "logo.svg"), logoSvg.trim() + "\n");
  writeFileSync(join(brandDir, "logo-mark.svg"), markSvg.trim() + "\n");
  console.log("wrote brand/logo.png + svg");
}

/** Minimal multi-image ICO builder */
function buildIco(images) {
  const count = images.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = [];
  const blobs = [];
  for (const img of images) {
    const size = img.size >= 256 ? 0 : img.size;
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    blobs.push(img.buf);
    offset += img.buf.length;
  }
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  return Buffer.concat([header, ...entries, ...blobs]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
