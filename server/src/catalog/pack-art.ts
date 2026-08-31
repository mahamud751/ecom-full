/** Unique pharmacy pack SVG for each medicine SKU. */

export type PackInput = {
  sku: string;
  name: string;
  strength?: string;
  form?: string;
  manufacturer?: string;
  requiresRx?: boolean;
};

const PALETTES = [
  ["#E8F0EF", "#1F6B5A", "#0F3D34"],
  ["#F3EEE8", "#8B5A2B", "#4A2E16"],
  ["#EAF0F7", "#2B5F8B", "#16344A"],
  ["#F6EBEF", "#8B3A5A", "#4A1E30"],
  ["#EEF3E8", "#4F7A2E", "#2A4218"],
  ["#F4EFE6", "#B07A2A", "#6A4814"],
  ["#ECEAF6", "#4A3A8B", "#241A4A"],
  ["#F7EEE8", "#B04A2A", "#6A2414"],
  ["#E8F3F2", "#2A7A72", "#144842"],
  ["#F3E8EE", "#7A2A5A", "#421430"],
  ["#EEF2F6", "#3A5A7A", "#1A3042"],
  ["#F6F0E8", "#8B6A2A", "#4A3814"],
  ["#EAF4EC", "#2E7A4A", "#164224"],
  ["#F4EAE8", "#8B3A2A", "#4A1A14"],
  ["#E8EEF6", "#3A4A8B", "#1A244A"],
  ["#F0F4E8", "#6A7A2A", "#384214"],
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function xml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(s: string, n = 18): [string, string] {
  const t = s.trim();
  if (t.length <= n) return [t, ""];
  const i = t.lastIndexOf(" ", n);
  const cut = i > 8 ? i : n;
  return [t.slice(0, cut).trim(), t.slice(cut).trim().slice(0, n)];
}

export function detectForm(name: string, fallback = "Tablet"): string {
  const n = `${name} ${fallback}`.toLowerCase();
  if (/\b(syrup|suspension|solution|elixir)\b/.test(n)) return "Syrup";
  if (/\b(capsule|cap\b)\b/.test(n)) return "Capsule";
  if (/\b(cream|ointment|gel|lotion)\b/.test(n)) return "Cream";
  if (/\b(inject|vial|ampoule|infusion)\b/.test(n)) return "Injection";
  if (/\b(drop|nasal|eye|ophthalmic)\b/.test(n)) return "Drops";
  if (/\b(inhal|nebul)\b/.test(n)) return "Inhaler";
  if (/\b(powder|sachet)\b/.test(n)) return "Powder";
  if (/\b(suppositor)/.test(n)) return "Suppository";
  return "Tablet";
}

function artwork(form: string, accent: string, ink: string): string {
  switch (form) {
    case "Syrup":
      return `<rect x="250" y="168" width="140" height="28" rx="6" fill="${ink}"/><rect x="228" y="196" width="184" height="252" rx="40" fill="#fff" stroke="${accent}" stroke-width="10"/><ellipse cx="320" cy="236" rx="62" ry="18" fill="${accent}" opacity=".2"/><rect x="248" y="268" width="144" height="150" rx="18" fill="${accent}" opacity=".18"/>`;
    case "Capsule":
      return `<rect x="268" y="160" width="104" height="36" rx="8" fill="${ink}"/><rect x="236" y="196" width="168" height="268" rx="28" fill="#fff" stroke="${accent}" stroke-width="10"/><ellipse cx="304" cy="330" rx="16" ry="36" fill="${accent}"/><ellipse cx="336" cy="330" rx="16" ry="36" fill="${ink}"/>`;
    case "Cream":
      return `<path d="M280 150h80l24 56H256z" fill="${ink}"/><rect x="248" y="206" width="144" height="268" rx="18" fill="#fff" stroke="${accent}" stroke-width="10"/><rect x="268" y="250" width="104" height="160" rx="10" fill="${accent}" opacity=".2"/>`;
    case "Injection":
      return `<rect x="300" y="140" width="40" height="70" rx="6" fill="${ink}"/><rect x="276" y="210" width="88" height="220" rx="16" fill="#fff" stroke="${accent}" stroke-width="8"/><rect x="292" y="250" width="56" height="120" rx="6" fill="${accent}" opacity=".25"/><rect x="308" y="430" width="24" height="70" fill="${ink}"/>`;
    case "Drops":
      return `<path d="M320 150c28 48 48 78 48 112a48 48 0 1 1-96 0c0-34 20-64 48-112z" fill="#fff" stroke="${accent}" stroke-width="8"/><circle cx="320" cy="270" r="22" fill="${accent}"/>`;
    case "Inhaler":
      return `<rect x="286" y="150" width="68" height="210" rx="16" fill="#fff" stroke="${accent}" stroke-width="8"/><rect x="246" y="348" width="148" height="90" rx="22" fill="${ink}"/>`;
    case "Powder":
      return `<path d="M220 210h200l-24 230H244z" fill="#fff" stroke="${accent}" stroke-width="8"/><rect x="248" y="250" width="144" height="70" fill="${accent}" opacity=".25"/>`;
    default:
      return `<rect x="188" y="168" width="264" height="300" rx="18" fill="#fff" stroke="${accent}" stroke-width="10"/><rect x="208" y="188" width="224" height="70" rx="8" fill="${accent}"/><circle cx="248" cy="390" r="18" fill="${accent}" opacity=".35"/><circle cx="292" cy="390" r="18" fill="${ink}" opacity=".25"/><circle cx="336" cy="390" r="18" fill="${accent}" opacity=".35"/><circle cx="380" cy="390" r="18" fill="${ink}" opacity=".25"/>`;
  }
}

export function medicinePackSvg(input: PackInput): string {
  const form = detectForm(input.name, input.form || "");
  const h = hash(input.sku + input.name);
  const [bg, accent, ink] = PALETTES[h % PALETTES.length];
  const brand = (input.name.split(/\s+\d/)[0] || input.name).slice(0, 28);
  const [l1, l2] = wrap(brand, 16);
  const strength = (input.strength || "").slice(0, 22);
  const maker = (input.manufacturer || "").slice(0, 28);
  const rx = input.requiresRx;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 640 640">
  <rect width="640" height="640" fill="${bg}"/>
  <circle cx="520" cy="90" r="120" fill="${accent}" opacity=".12"/>
  <circle cx="80" cy="560" r="140" fill="${ink}" opacity=".08"/>
  ${artwork(form, accent, ink)}
  <rect x="40" y="488" width="560" height="116" rx="20" fill="#fff" opacity=".92"/>
  <text x="320" y="528" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="28" font-weight="800" fill="${ink}">${xml(l1)}</text>
  ${l2 ? `<text x="320" y="558" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="22" font-weight="700" fill="${accent}">${xml(l2)}</text>` : ""}
  <text x="320" y="${l2 ? 584 : 562}" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="16" fill="#445">${xml([strength, form].filter(Boolean).join(" · "))}</text>
  ${maker ? `<text x="320" y="606" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" fill="#778">${xml(maker)}</text>` : ""}
  <rect x="24" y="24" width="${rx ? 86 : 70}" height="28" rx="8" fill="${rx ? "#9B2C2C" : "#1F6B5A"}"/>
  <text x="${rx ? 67 : 59}" y="43" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" font-weight="700" fill="#fff">${rx ? "Rx" : "OTC"}</text>
</svg>`;
}

export function packPublicPath(sku: string): string {
  return `/uploads/packs/${sku}.jpg`;
}

function deviceArtwork(kind: string, accent: string, ink: string): string {
  switch (kind) {
    case "thermometer":
      return `<rect x="306" y="150" width="28" height="220" rx="14" fill="#fff" stroke="${accent}" stroke-width="8"/><circle cx="320" cy="400" r="46" fill="#fff" stroke="${ink}" stroke-width="8"/><rect x="314" y="210" width="12" height="150" rx="6" fill="${accent}"/>`;
    case "bp":
      return `<rect x="210" y="190" width="220" height="150" rx="18" fill="#fff" stroke="${accent}" stroke-width="8"/><circle cx="320" cy="265" r="42" fill="${accent}" opacity=".2"/><rect x="240" y="360" width="160" height="70" rx="24" fill="${ink}"/>`;
    case "oximeter":
      return `<rect x="250" y="210" width="140" height="90" rx="16" fill="#fff" stroke="${accent}" stroke-width="8"/><rect x="268" y="300" width="104" height="70" rx="12" fill="${ink}"/>`;
    case "nebulizer":
      return `<rect x="250" y="200" width="140" height="180" rx="28" fill="#fff" stroke="${accent}" stroke-width="8"/><ellipse cx="320" cy="200" rx="36" ry="16" fill="${ink}"/><rect x="300" y="140" width="40" height="60" rx="8" fill="${ink}"/>`;
    case "glucometer":
      return `<rect x="240" y="170" width="160" height="250" rx="24" fill="#fff" stroke="${accent}" stroke-width="8"/><rect x="260" y="200" width="120" height="80" rx="10" fill="${accent}" opacity=".25"/><rect x="284" y="320" width="72" height="48" rx="10" fill="${ink}"/>`;
    case "scale":
      return `<rect x="180" y="220" width="280" height="180" rx="16" fill="#fff" stroke="${accent}" stroke-width="8"/><rect x="250" y="260" width="140" height="50" rx="8" fill="${accent}" opacity=".25"/>`;
    case "bag":
      return `<rect x="230" y="190" width="180" height="220" rx="40" fill="#fff" stroke="${accent}" stroke-width="8"/><rect x="292" y="150" width="56" height="50" rx="10" fill="${ink}"/>`;
    case "mask":
      return `<ellipse cx="320" cy="300" rx="110" ry="70" fill="#fff" stroke="${accent}" stroke-width="8"/><path d="M210 300 C170 250 170 350 210 300 M430 300 C470 250 470 350 430 300" fill="none" stroke="${ink}" stroke-width="8"/>`;
    case "kit":
      return `<rect x="190" y="200" width="260" height="180" rx="16" fill="#fff" stroke="${accent}" stroke-width="8"/><rect x="300" y="230" width="40" height="120" fill="${accent}"/><rect x="240" y="270" width="160" height="40" fill="${accent}"/>`;
    default:
      return `<rect x="210" y="180" width="220" height="250" rx="20" fill="#fff" stroke="${accent}" stroke-width="8"/><circle cx="320" cy="300" r="40" fill="${accent}" opacity=".3"/>`;
  }
}

export function devicePackSvg(input: {
  sku: string;
  name: string;
  kind?: string;
  manufacturer?: string;
}): string {
  const kind = (input.kind || "other").toLowerCase();
  const h = hash(input.sku + input.name);
  const [bg, accent, ink] = PALETTES[h % PALETTES.length];
  const [l1, l2] = wrap(input.name, 18);
  const maker = (input.manufacturer || "").slice(0, 28);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 640 640">
  <rect width="640" height="640" fill="${bg}"/>
  <circle cx="520" cy="90" r="120" fill="${accent}" opacity=".12"/>
  <circle cx="80" cy="560" r="140" fill="${ink}" opacity=".08"/>
  ${deviceArtwork(kind, accent, ink)}
  <rect x="40" y="488" width="560" height="116" rx="20" fill="#fff" opacity=".92"/>
  <text x="320" y="528" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="26" font-weight="800" fill="${ink}">${xml(l1)}</text>
  ${l2 ? `<text x="320" y="558" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="20" font-weight="700" fill="${accent}">${xml(l2)}</text>` : ""}
  ${maker ? `<text x="320" y="${l2 ? 586 : 562}" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="14" fill="#667">${xml(maker)}</text>` : ""}
  <rect x="24" y="24" width="86" height="28" rx="8" fill="#1F6B5A"/>
  <text x="67" y="43" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" font-weight="700" fill="#fff">DEVICE</text>
</svg>`;
}
