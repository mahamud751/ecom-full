/**
 * Design system ported from the web storefront (src/app/globals.css).
 * Ahona Premium — deep forest + champagne gold + warm ivory.
 */
export const colors = {
  forestDeep: "#0c2a28",
  forest: "#164f4a",
  forestMid: "#1f6b64",
  gold: "#c9a227",
  goldDeep: "#9a7b1a",
  goldSoft: "#f5edd4",
  goldStar: "#d4af37",
  ivory: "#f8f6f1",
  surface: "#ffffff",
  ink: "#14201f",
  inkMuted: "#5c6b69",
  line: "#e8e4db",
  discount: "#c41e3a",
  lime: "#3d9a6a",
  brandLight: "#e8f2f0",
  brandSoft: "#f0f7f6",
  danger: "#c41e3a",
  warning: "#b45309",
  white: "#ffffff",
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const spacing = (n: number) => n * 4;

export const fonts = {
  regular: "System",
  serif: "Georgia",
};

export const type = {
  h1: { fontSize: 26, fontWeight: "700" as const, color: colors.ink },
  h2: { fontSize: 20, fontWeight: "700" as const, color: colors.ink },
  h3: { fontSize: 16, fontWeight: "600" as const, color: colors.ink },
  body: { fontSize: 14, color: colors.ink },
  caption: { fontSize: 12, color: colors.inkMuted },
};

export const shadows = {
  card: {
    shadowColor: colors.forestDeep,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};

export function formatPrice(price: number): string {
  const rounded = price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
  return `${BRAND_CURRENCY}${Number(rounded).toLocaleString("en-BD")}`;
}

const BRAND_CURRENCY = "৳";

export function discountPercent(
  price: number,
  comparePrice?: number | null,
): number {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}
