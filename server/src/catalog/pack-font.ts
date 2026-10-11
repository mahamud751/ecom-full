import fs from "node:fs";
import path from "node:path";

const CANDIDATES = [
  path.join(process.cwd(), "assets", "fonts"),
  "/usr/share/fonts/truetype/dejavu",
  "/usr/share/fonts/truetype/liberation",
];

function findFont(names: string[]): string {
  for (const dir of CANDIDATES) {
    for (const name of names) {
      const fp = path.join(dir, name);
      if (fs.existsSync(fp)) return fp;
    }
  }
  return "";
}

export const PACK_FONT = findFont(["DejaVuSans.ttf", "LiberationSans-Regular.ttf"]);
export const PACK_FONT_BOLD = findFont(["DejaVuSans-Bold.ttf", "LiberationSans-Bold.ttf"]);

export const FONT_BOLD = "PackBold, DejaVu Sans, Liberation Sans, Arial, sans-serif";
export const FONT_REG = "PackSans, DejaVu Sans, Liberation Sans, Arial, sans-serif";

export function packFontFace(): string {
  if (!PACK_FONT) return "";
  const regular = `file://${PACK_FONT}`;
  const bold = `file://${PACK_FONT_BOLD || PACK_FONT}`;
  return `<defs><style type="text/css">
@font-face { font-family: "PackSans"; src: url("${regular}"); }
@font-face { font-family: "PackBold"; src: url("${bold}"); font-weight: 700; }
</style></defs>`;
}
