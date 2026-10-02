/**
 * Ahona design system — deep forest + champagne gold + warm ivory.
 * Tokens keep the web storefront's palette; depth, radii and type are tuned
 * for a softer, more premium mobile feel.
 */
export const colors = {
  forestDeep: "#0b2624",
  forest: "#15504a",
  forestMid: "#1f6b64",
  forestGlow: "#2c8a80",
  gold: "#c9a227",
  goldDeep: "#94761a",
  goldSoft: "#f7efd6",
  goldStar: "#e0b43a",
  ivory: "#f6f4ee",
  surface: "#ffffff",
  surfaceAlt: "#fbfaf7",
  ink: "#101c1b",
  inkSoft: "#34423f",
  inkMuted: "#6b7a77",
  inkFaint: "#a3aeab",
  line: "#ebe7de",
  lineSoft: "#f1eee7",
  discount: "#d7263d",
  lime: "#2f9163",
  brandLight: "#e4f1ee",
  brandSoft: "#f0f6f4",
  danger: "#d7263d",
  dangerSoft: "#fdecee",
  warning: "#b45309",
  successSoft: "#e3f4ea",
  white: "#ffffff",
  overlay: "rgba(8,26,25,0.55)",
};

/** Two-stop gradients rendered via <Gradient> (react-native-svg). */
export const gradients = {
  forest: ["#1d6a62", "#0b2624"] as const,
  forestSoft: ["#2c8a80", "#15504a"] as const,
  gold: ["#e3c25a", "#b8901c"] as const,
  dawn: ["#fff7e3", "#f6f4ee"] as const,
  mint: ["#e9f5f1", "#f6f4ee"] as const,
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  pill: 999,
};

export const spacing = (n: number) => n * 4;

export const fonts = {
  regular: "System",
  serif: "Georgia",
};

export const type = {
  display: {
    fontSize: 30,
    fontWeight: "800" as const,
    color: colors.ink,
    letterSpacing: -0.6,
  },
  h1: { fontSize: 26, fontWeight: "800" as const, color: colors.ink, letterSpacing: -0.4 },
  h2: { fontSize: 20, fontWeight: "800" as const, color: colors.ink, letterSpacing: -0.2 },
  h3: { fontSize: 16, fontWeight: "700" as const, color: colors.ink },
  body: { fontSize: 14, color: colors.inkSoft, lineHeight: 20 },
  caption: { fontSize: 12, color: colors.inkMuted },
  overline: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: colors.inkMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
  },
};

export const shadows = {
  /** Resting cards — barely-there lift. */
  card: {
    shadowColor: "#0b2624",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  /** Floating elements — tab bar, sticky CTAs, hero cards. */
  float: {
    shadowColor: "#0b2624",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  /** Coloured glow under primary buttons. */
  glow: {
    shadowColor: "#15504a",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
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
