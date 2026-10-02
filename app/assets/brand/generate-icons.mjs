/**
 * Ahona brand icon generator — one SVG source → Android launcher icons
 * (legacy, round, adaptive fg/bg/monochrome) + Play Store listing assets.
 *
 *   node app/assets/brand/generate-icons.mjs
 *
 * Uses `sharp` from server/node_modules (no extra install).
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(here, '../..');
const require = createRequire(path.resolve(appDir, '../server/package.json'));
const sharp = require('sharp');

const RES = path.join(appDir, 'android/app/src/main/res');
const STORE = path.join(here, 'play-store');

/* ── Brand geometry (512 × 512 design grid) ─────────────────────── */

const C = {
  forestTop: '#1f6f66',
  forestBottom: '#0a2321',
  goldLight: '#f3d98a',
  gold: '#d4ad35',
  goldDeep: '#a8841c',
  ivory: '#fbf8f0',
};

const defs = `
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.forestTop}"/>
    <stop offset="1" stop-color="${C.forestBottom}"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.22" cy="0.12" r="0.75">
    <stop offset="0" stop-color="#3fa396" stop-opacity="0.45"/>
    <stop offset="1" stop-color="#3fa396" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="warm" cx="0.8" cy="0.25" r="0.35">
    <stop offset="0" stop-color="${C.gold}" stop-opacity="0.16"/>
    <stop offset="1" stop-color="${C.gold}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.goldLight}"/>
    <stop offset="0.55" stop-color="${C.gold}"/>
    <stop offset="1" stop-color="${C.goldDeep}"/>
  </linearGradient>`;

/** The mark itself: gold "A" whose crossbar is a medical cross, plus a dawn sparkle. */
function glyph({ mono = false } = {}) {
  const gold = mono ? '#fff' : 'url(#gold)';
  const cross = mono ? '#fff' : C.ivory;
  const spark = mono ? '#fff' : C.goldLight;
  const crossRects = `
      <rect x="188" y="292" width="136" height="44" rx="12"/>
      <rect x="234" y="258" width="44" height="112" rx="12"/>`;
  // Single-colour (themed icon): cut a gap around the cross so it doesn't merge into the A.
  const monoMask = mono
    ? `<mask id="gap" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
         <rect width="512" height="512" fill="#fff"/>
         <g fill="#000" stroke="#000" stroke-width="28" stroke-linejoin="round">${crossRects}</g>
       </mask>`
    : '';
  return `
  <g>
    ${monoMask}
    <!-- A legs -->
    <path d="M150 400 L256 132 L362 400" fill="none" stroke="${gold}" ${mono ? 'mask="url(#gap)"' : ''}
          stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- medical cross = crossbar -->
    <g fill="${cross}">${crossRects}
    </g>
    <!-- dawn sparkle -->
    <path fill="${spark}" d="M388 96 C392 124 400 132 428 136 C400 140 392 148 388 176 C384 148 376 140 348 136 C376 132 384 124 388 96 Z"/>
  </g>`;
}

const background = (rx = 0) => `
  <rect width="512" height="512" rx="${rx}" fill="url(#bg)"/>
  <rect width="512" height="512" rx="${rx}" fill="url(#glow)"/>
  <rect width="512" height="512" rx="${rx}" fill="url(#warm)"/>`;

const svg = body =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs>${defs}</defs>${body}</svg>`;

/** Full icon (background + glyph); `scale` shrinks the glyph toward center. */
const fullIcon = ({ rx = 0, scale = 0.86 } = {}) =>
  svg(`${background(rx)}<g transform="translate(256 262) scale(${scale}) translate(-256 -262)">${glyph()}</g>`);

/** Adaptive foreground: glyph only, inside the 66/108 safe zone. */
const adaptiveFg = ({ mono = false } = {}) =>
  svg(`<g transform="translate(256 262) scale(0.6) translate(-256 -262)">${glyph({ mono })}</g>`);

const adaptiveBg = () => svg(background(0));

const circleIcon = () =>
  svg(`<clipPath id="c"><circle cx="256" cy="256" r="256"/></clipPath>
       <g clip-path="url(#c)">${background(0)}
       <g transform="translate(256 262) scale(0.78) translate(-256 -262)">${glyph()}</g></g>`);

/* ── Render helpers ─────────────────────────────────────────────── */

async function png(svgText, size, out, { w, h } = {}) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(svgText), { density: 384 })
    .resize(w ?? size, h ?? size)
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log('✓', path.relative(appDir, out));
}

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

/* ── Play Store feature graphic (1024 × 500) ───────────────────── */

function featureGraphic() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 500">
  <defs>${defs}
    <linearGradient id="fbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.forestTop}"/>
      <stop offset="1" stop-color="${C.forestBottom}"/>
    </linearGradient>
    <radialGradient id="fglow" cx="0.1" cy="0.05" r="0.8">
      <stop offset="0" stop-color="#3fa396" stop-opacity="0.4"/>
      <stop offset="1" stop-color="${C.gold}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#fbg)"/>
  <rect width="1024" height="500" fill="url(#fglow)"/>
  <rect width="1024" height="500" fill="url(#warm)"/>
  <circle cx="930" cy="470" r="190" fill="none" stroke="${C.gold}" stroke-opacity="0.12" stroke-width="2"/>
  <circle cx="930" cy="470" r="250" fill="none" stroke="${C.gold}" stroke-opacity="0.08" stroke-width="2"/>
  <g transform="translate(96 110)">
    <rect width="280" height="280" rx="64" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.12"/>
    <g transform="translate(140 144) scale(0.46) translate(-256 -262)">${glyph()}</g>
  </g>
  <g font-family="Helvetica Neue, Helvetica, Arial, sans-serif">
    <text x="436" y="228" fill="#ffffff" font-size="92" font-weight="800" letter-spacing="-2">Ahona</text>
    <text x="440" y="272" fill="${C.goldLight}" font-size="22" font-weight="700" letter-spacing="7">HEALTH &amp; BEAUTY</text>
    <text x="440" y="336" fill="#ffffff" fill-opacity="0.82" font-size="26" font-weight="500">Medicines · Doctor consults · Lab tests</text>
    <text x="440" y="374" fill="#ffffff" fill-opacity="0.6" font-size="22" font-weight="500">Delivered to your door in 12–24h</text>
  </g>
</svg>`;
}

/* ── Main ───────────────────────────────────────────────────────── */

for (const [d, m] of Object.entries(DENSITIES)) {
  const dir = path.join(RES, `mipmap-${d}`);
  await png(fullIcon({ rx: 0, scale: 0.8 }), 48 * m, path.join(dir, 'ic_launcher.png'));
  await png(circleIcon(), 48 * m, path.join(dir, 'ic_launcher_round.png'));
  await png(adaptiveFg(), 108 * m, path.join(dir, 'ic_launcher_foreground.png'));
  await png(adaptiveBg(), 108 * m, path.join(dir, 'ic_launcher_background.png'));
  await png(adaptiveFg({ mono: true }), 108 * m, path.join(dir, 'ic_launcher_monochrome.png'));
}

// Play Store: 512×512 hi-res icon (full-bleed square; Play applies its own mask)
await png(fullIcon({ rx: 0, scale: 0.8 }), 512, path.join(STORE, 'icon-512.png'));
// Play Store: 1024×500 feature graphic
await png(featureGraphic(), 0, path.join(STORE, 'feature-graphic-1024x500.png'), { w: 1024, h: 500 });
// Source SVGs for designers / web
fs.writeFileSync(path.join(here, 'ahona-icon.svg'), fullIcon({ rx: 112, scale: 0.8 }));
fs.writeFileSync(path.join(here, 'ahona-mark.svg'), svg(glyph()));
console.log('✓ app/assets/brand/ahona-icon.svg, ahona-mark.svg');
