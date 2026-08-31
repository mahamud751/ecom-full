/**
 * Build Play Console assets from the Ahona logo SVG.
 * Run: node app/store-assets/generate-play-store.mjs
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("../../web/node_modules/sharp");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "play-store");
const media = path.join(root, "media");
const iconDir = path.join(root, "icon");
const shotDir = path.join(root, "screenshots", "phone");
const gfxDir = path.join(root, "graphics");
const htmlDir = path.join(root, "html");

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const aPath =
  "M32 9.8 52.4 54h-8.6l-3.45-8.4H23.65L20.2 54H11.6L32 9.8Zm0 14.4 4.35 10.6h-8.7L32 24.2Z";
const sunPath = "M27.2 34.8a4.8 4.8 0 0 1 9.6 0H27.2Z";
const rayPath = "M32 26.6v2.3M27.7 28.2l1.5 1.7M36.3 28.2l-1.5 1.7";

const markInner = `<path fill="#c9a227" fill-rule="evenodd" d="${aPath}"/>
  <path fill="#e8c547" d="${sunPath}"/>
  <path fill="none" stroke="#e8c547" stroke-width="1.15" stroke-linecap="round" d="${rayPath}"/>`;

const fullMark = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a5c56"/>
      <stop offset="100%" stop-color="#0c2a28"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
  ${markInner}
</svg>`;

/** Adaptive foreground: mark only, extra padding so the A sits in the 66% safe zone. */
const adaptiveFg = `<svg xmlns="http://www.w3.org/2000/svg" width="432" height="432" viewBox="0 0 64 64">
  <g transform="translate(10 10) scale(0.6875)">${markInner}</g>
</svg>`;

const featureSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0c2a28"/>
      <stop offset="60%" stop-color="#164f4a"/>
      <stop offset="100%" stop-color="#1f6b64"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <circle cx="860" cy="70" r="160" fill="#c9a227" opacity="0.12"/>
  <circle cx="120" cy="460" r="180" fill="#c9a227" opacity="0.08"/>
  <rect x="72" y="150" width="180" height="180" rx="40" fill="#0c2a28" stroke="#c9a227" stroke-width="3"/>
  <g transform="translate(72 150) scale(2.8125)">${markInner}</g>
  <text x="290" y="220" font-family="Georgia, Times New Roman, serif" font-size="92" font-weight="600" fill="#ffffff">Ahona</text>
  <text x="294" y="268" font-family="system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="6" fill="#c9a227">PREMIUM HEALTH</text>
  <text x="290" y="340" font-family="system-ui, sans-serif" font-size="32" font-weight="600" fill="#f8f6f1">Medicine  ·  Lab tests  ·  Doctor consult</text>
  <text x="290" y="390" font-family="system-ui, sans-serif" font-size="24" fill="#e8e4db">Home collection  ·  Express delivery  ·  Bangladesh</text>
</svg>`;

async function png(svg, out, size) {
  let p = sharp(Buffer.from(svg));
  if (size) p = p.resize(size, size);
  await p.png().toFile(out);
}

function chromeShot(html, out) {
  const r = spawnSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=1080,1920`,
      `--screenshot=${out}`,
      `file://${html}`,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    throw new Error(`Chrome screenshot failed for ${html}`);
  }
}

async function main() {
  for (const d of [iconDir, shotDir, gfxDir]) fs.mkdirSync(d, { recursive: true });

  await png(fullMark, path.join(iconDir, "play-icon-512.png"), 512);
  await sharp(Buffer.from(fullMark))
    .resize(512, 512)
    .flatten({ background: "#0c2a28" })
    .png()
    .toFile(path.join(iconDir, "play-icon-512-opaque.png"));

  await png(adaptiveFg, path.join(iconDir, "adaptive-foreground-432.png"), 432);
  await sharp({
    create: { width: 432, height: 432, channels: 3, background: "#0c2a28" },
  })
    .png()
    .toFile(path.join(iconDir, "adaptive-background-432.png"));

  const launchers = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [name, size] of Object.entries(launchers)) {
    await png(fullMark, path.join(iconDir, `ic_launcher-${name}.png`), size);
  }

  await sharp(Buffer.from(featureSvg)).png().toFile(path.join(gfxDir, "feature-graphic-1024x500.png"));
  await sharp(Buffer.from(featureSvg))
    .jpeg({ quality: 92 })
    .toFile(path.join(gfxDir, "feature-graphic-1024x500.jpg"));

  fs.copyFileSync(
    path.join(iconDir, "play-icon-512.png"),
    path.join(__dirname, "play-store-icon-512.png"),
  );

  const shots = [
    ["01-home.html", "01-home.png"],
    ["02-medicines.html", "02-medicines.png"],
    ["03-product.html", "03-product.png"],
    ["04-lab.html", "04-lab.png"],
    ["05-doctors.html", "05-doctors.png"],
  ];
  for (const [html, pngName] of shots) {
    const out = path.join(shotDir, pngName);
    chromeShot(path.join(htmlDir, html), out);
    const meta = await sharp(out).metadata();
    if (meta.width !== 1080 || meta.height !== 1920) {
      await sharp(out)
        .resize(1080, 1920, { fit: "cover", position: "top" })
        .png()
        .toFile(out);
    }
    console.log("shot", pngName, (await sharp(out).metadata()).width, "x", (await sharp(out).metadata()).height);
  }

  console.log("Wrote Play Store pack under", root);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
