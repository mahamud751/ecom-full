/** Core UI kit — buttons, cards, badges, inputs, rows and states. */
import React, { useId, useState } from "react";
import {
  ActivityIndicator,
  Image,
  type ImageResizeMode,
  type ImageStyle,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { colors, gradients, radii, shadows } from "../theme";
import { AppIcon, type IconName } from "./AppIcon";

/* ── Gradient ───────────────────────────────────────────────────── */

/** Split "rgba(r,g,b,a)" into an rgb colour + opacity (svg <Stop> ignores rgba alpha). */
function stop(c: string): { stopColor: string; stopOpacity: number } {
  const m = c.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/);
  return m
    ? { stopColor: `rgb(${m[1]},${m[2]},${m[3]})`, stopOpacity: Number(m[4]) }
    : { stopColor: c, stopOpacity: 1 };
}

/** Absolute-fill linear gradient. Put it first inside a view with overflow hidden. */
export function Gradient({
  from,
  to,
  angle = "diagonal",
  style,
}: {
  from: string;
  to: string;
  angle?: "diagonal" | "vertical" | "horizontal";
  style?: StyleProp<ViewStyle>;
}) {
  const id = "g" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const end =
    angle === "vertical"
      ? { x2: "0", y2: "1" }
      : angle === "horizontal"
        ? { x2: "1", y2: "0" }
        : { x2: "1", y2: "1" };
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" {...end}>
            <Stop offset="0" {...stop(from)} />
            <Stop offset="1" {...stop(to)} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/* ── SmartImage — remote image with a branded fallback ───────── */

export function SmartImage({
  uri,
  style,
  resizeMode = "cover",
  icon = "leaf",
  iconSize = 30,
  hideFallback,
}: {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
  icon?: IconName;
  iconSize?: number;
  /** Render nothing (let what's behind show) instead of the placeholder. */
  hideFallback?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    if (hideFallback) return null;
    return (
      <View
        style={[
          style as StyleProp<ViewStyle>,
          { backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
        ]}>
        <AppIcon name={icon} color={colors.forestGlow} size={iconSize} strokeWidth={1.5} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
    />
  );
}

/* ── Button ─────────────────────────────────────────────────────── */

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "gold" | "outline" | "ghost" | "danger" | "soft";
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const gradient =
    variant === "primary" ? gradients.forestSoft : variant === "gold" ? gradients.gold : null;
  const bg =
    variant === "danger"
      ? colors.danger
      : variant === "soft"
        ? colors.brandLight
        : variant === "outline"
          ? colors.surface
          : "transparent";
  const fg =
    variant === "outline" || variant === "ghost" || variant === "soft"
      ? colors.forest
      : variant === "gold"
        ? colors.forestDeep
        : colors.white;
  const off = disabled || loading;
  const pad = size === "sm" ? 9 : size === "lg" ? 17 : 14;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, paddingVertical: pad },
        gradient && !off ? shadows.glow : null,
        variant === "outline" && styles.btnOutline,
        { opacity: off ? 0.55 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}>
      {gradient ? <Gradient from={gradient[0]} to={gradient[1]} angle="horizontal" /> : null}
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <AppIcon name={icon} color={fg} size={size === "sm" ? 16 : 19} /> : null}
          <Text
            style={[
              styles.btnText,
              { color: fg, fontSize: size === "sm" ? 13.5 : size === "lg" ? 16.5 : 15 },
            ]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/* ── IconButton ─────────────────────────────────────────────────── */

export function IconButton({
  name,
  onPress,
  tone = "light",
  size = 42,
  badge,
  iconColor,
  style,
}: {
  name: IconName;
  onPress?: () => void;
  tone?: "light" | "glass" | "forest" | "plain";
  size?: number;
  badge?: number;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = {
    light: colors.surface,
    glass: "rgba(255,255,255,0.16)",
    forest: colors.forest,
    plain: "transparent",
  }[tone];
  const fg = iconColor ?? (tone === "glass" || tone === "forest" ? colors.white : colors.ink);
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.75 : 1,
        },
        tone === "light" && styles.iconBtnLight,
        tone === "glass" && styles.iconBtnGlass,
        style,
      ]}>
      <AppIcon name={name} color={fg} size={size * 0.48} />
      {badge != null && badge > 0 ? (
        <View style={styles.iconBadge}>
          <Text style={styles.iconBadgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/* ── IconTile — rounded square holding an icon ─────────────────── */

export function IconTile({
  name,
  color = colors.forest,
  bg = colors.brandLight,
  size = 44,
  radius,
}: {
  name: IconName;
  color?: string;
  bg?: string;
  size?: number;
  radius?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? size * 0.32,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}>
      <AppIcon name={name} color={color} size={size * 0.5} />
    </View>
  );
}

/* ── Card ───────────────────────────────────────────────────────── */

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          { transform: [{ scale: pressed ? 0.985 : 1 }] },
          style,
        ]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

/* ── Badge ──────────────────────────────────────────────────────── */

type Tone = "gold" | "green" | "red" | "muted" | "forest";

const TONES: Record<Tone, { bg: string; fg: string }> = {
  gold: { bg: colors.goldSoft, fg: colors.goldDeep },
  green: { bg: colors.successSoft, fg: colors.lime },
  red: { bg: colors.dangerSoft, fg: colors.danger },
  muted: { bg: colors.lineSoft, fg: colors.inkMuted },
  forest: { bg: colors.brandLight, fg: colors.forest },
};

export function Badge({
  label,
  tone = "gold",
  dot,
  style,
}: {
  label: string;
  tone?: Tone;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const map = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }, style]}>
      {dot ? <View style={[styles.badgeDot, { backgroundColor: map.fg }]} /> : null}
      <Text style={[styles.badgeText, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

/* ── Chip (selectable pill) ─────────────────────────────────────── */

export function Chip({
  label,
  active,
  onPress,
  icon,
  style,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const fg = active ? colors.white : colors.inkSoft;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipActive : null,
        { opacity: pressed ? 0.8 : 1 },
        style,
      ]}>
      {icon ? <AppIcon name={icon} color={fg} size={15} /> : null}
      <Text style={[styles.chipText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/* ── Section header ─────────────────────────────────────────────── */

export function SectionHeader({
  title,
  subtitle,
  icon,
  onSeeAll,
  actionLabel = "See all",
  style,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  onSeeAll?: () => void;
  actionLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
        {icon ? <IconTile name={icon} size={30} color={colors.goldDeep} bg={colors.goldSoft} /> : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
        </View>
      </View>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAllBtn}>
          <Text style={styles.seeAll}>{actionLabel}</Text>
          <AppIcon name="chevronRight" color={colors.forestMid} size={14} strokeWidth={2.4} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* ── List row (settings / menu style) ───────────────────────────── */

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
  danger,
  last,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowDivider,
        pressed && { backgroundColor: colors.surfaceAlt },
      ]}>
      {icon ? (
        <IconTile
          name={icon}
          size={38}
          color={danger ? colors.danger : colors.forest}
          bg={danger ? colors.dangerSoft : colors.brandSoft}
        />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && { color: colors.danger }]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <AppIcon name="chevronRight" color={colors.inkFaint} size={18} /> : null)}
    </Pressable>
  );
}

/* ── Quantity stepper ───────────────────────────────────────────── */

export function Stepper({
  value,
  onDec,
  onInc,
  compact,
  removable,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
  compact?: boolean;
  /** Show a trash icon at 1 (decrementing removes the line). */
  removable?: boolean;
}) {
  const s = compact ? 28 : 34;
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onDec} hitSlop={6} style={[styles.stepBtn, { width: s, height: s }]}>
        <AppIcon name={removable && value <= 1 ? "trash" : "minus"} color={colors.forest} size={s * 0.5} />
      </Pressable>
      <Text style={styles.stepVal}>{value}</Text>
      <Pressable
        onPress={onInc}
        hitSlop={6}
        style={[styles.stepBtn, styles.stepBtnPlus, { width: s, height: s }]}>
        <AppIcon name="plus" color={colors.white} size={s * 0.5} />
      </Pressable>
    </View>
  );
}

/* ── Divider ────────────────────────────────────────────────────── */

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/* ── Input ──────────────────────────────────────────────────────── */

export function Field({
  label,
  icon,
  hint,
  ...props
}: TextInputProps & { label?: string; icon?: IconName; hint?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View
        style={[
          styles.fieldWrap,
          focused && styles.fieldFocused,
          props.multiline && { alignItems: "flex-start" },
        ]}>
        {icon ? (
          <View style={props.multiline ? { paddingTop: 13 } : null}>
            <AppIcon name={icon} color={focused ? colors.forest : colors.inkFaint} size={18} />
          </View>
        ) : null}
        <TextInput
          placeholderTextColor={colors.inkFaint}
          {...props}
          onFocus={e => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[styles.field, props.style as StyleProp<TextStyle>]}
        />
      </View>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

/* ── States ─────────────────────────────────────────────────────── */

export function Loading({ label }: { label?: string }) {
  return (
    <View style={[styles.center, { flex: 1 }]}>
      <View style={styles.loaderRing}>
        <ActivityIndicator color={colors.forest} size="large" />
      </View>
      {label ? <Text style={styles.centerText}>{label}</Text> : null}
    </View>
  );
}

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={[styles.center, { flex: 1 }]}>
      <IconTile name="info" size={64} color={colors.danger} bg={colors.dangerSoft} radius={32} />
      <Text style={[styles.h3, { marginTop: 16, textAlign: "center" }]}>Something went wrong</Text>
      <Text style={styles.centerText}>{message}</Text>
      {onRetry ? (
        <Button
          label="Try again"
          variant="outline"
          size="sm"
          onPress={onRetry}
          style={{ marginTop: 18, paddingHorizontal: 28 }}
        />
      ) : null}
    </View>
  );
}

export function EmptyView({
  title,
  hint,
  icon = "box",
  action,
}: {
  title: string;
  hint?: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.center}>
      <View style={styles.emptyHalo}>
        <IconTile name={icon} size={72} radius={36} color={colors.forest} bg={colors.brandLight} />
      </View>
      <Text style={[styles.h3, { textAlign: "center", marginTop: 18, fontSize: 18 }]}>{title}</Text>
      {hint ? <Text style={[styles.centerText, { marginTop: 6 }]}>{hint}</Text> : null}
      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          style={{ marginTop: 20, paddingHorizontal: 32 }}
        />
      ) : null}
    </View>
  );
}

/* ── Helpers ────────────────────────────────────────────────────── */

export function statusTone(status: string): Tone {
  const s = status.toUpperCase();
  if (["DELIVERED", "COMPLETED", "APPROVED", "ACTIVE"].includes(s)) return "green";
  if (["CANCELLED", "REJECTED", "REFUNDED"].includes(s)) return "red";
  if (["SHIPPED", "PACKAGING", "CONFIRMED"].includes(s)) return "forest";
  return "gold";
}

export function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radii.md,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    overflow: "hidden",
  },
  btnOutline: { borderWidth: 1.5, borderColor: colors.forest },
  btnText: { fontWeight: "700", letterSpacing: 0.2 },
  iconBtnLight: {
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadows.card,
    shadowOpacity: 0.05,
  },
  iconBtnGlass: { borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  iconBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  iconBadgeText: { fontSize: 9.5, fontWeight: "800", color: colors.forestDeep },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadows.card,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { fontSize: 13, fontWeight: "600" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.ink, letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  seeAll: { fontSize: 12.5, fontWeight: "700", color: colors.forestMid },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  rowTitle: { fontSize: 15, fontWeight: "600", color: colors.ink },
  rowSub: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brandSoft,
    borderRadius: radii.pill,
    padding: 3,
    gap: 4,
  },
  stepBtn: {
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  stepBtnPlus: { backgroundColor: colors.forest },
  stepVal: {
    minWidth: 22,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: 12 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.inkSoft,
    marginBottom: 7,
  },
  fieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  fieldFocused: { borderColor: colors.forestMid, backgroundColor: colors.surface },
  field: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.ink,
  },
  fieldHint: { fontSize: 11.5, color: colors.inkMuted, marginTop: 5 },
  center: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loaderRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  emptyHalo: {
    padding: 14,
    borderRadius: 60,
    backgroundColor: colors.brandSoft,
  },
  centerText: {
    fontSize: 13.5,
    color: colors.inkMuted,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 19,
  },
  h3: { fontSize: 16, fontWeight: "800", color: colors.ink },
});
