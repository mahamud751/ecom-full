/** Core UI kit — card/button/badge/input styles ported from the web. */
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { colors, radii, shadows } from "../theme";

/* ── Button ─────────────────────────────────────────────────────── */

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "gold" | "outline" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg =
    variant === "primary"
      ? colors.forest
      : variant === "gold"
        ? colors.gold
        : variant === "danger"
          ? colors.danger
          : "transparent";
  const fg =
    variant === "outline" || variant === "ghost" ? colors.forest : colors.white;
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: off ? 0.6 : pressed ? 0.85 : 1 },
        variant === "outline" && { borderWidth: 1.5, borderColor: colors.forest },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
      )}
    </Pressable>
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
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

/* ── Badge ──────────────────────────────────────────────────────── */

export function Badge({
  label,
  tone = "gold",
}: {
  label: string;
  tone?: "gold" | "green" | "red" | "muted" | "forest";
}) {
  const map = {
    gold: { bg: colors.goldSoft, fg: colors.goldDeep },
    green: { bg: "#e3f3ea", fg: colors.lime },
    red: { bg: "#fbe7ea", fg: colors.danger },
    muted: { bg: colors.brandSoft, fg: colors.inkMuted },
    forest: { bg: colors.brandLight, fg: colors.forest },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <Text style={[styles.badgeText, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

/* ── Section header ─────────────────────────────────────────────── */

export function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ── Input ──────────────────────────────────────────────────────── */

export function Field({
  label,
  ...props
}: TextInputProps & { label?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.inkMuted}
        {...props}
        style={[styles.field, props.style]}
      />
    </View>
  );
}

/* ── States ─────────────────────────────────────────────────────── */

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.forest} size="large" />
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
    <View style={styles.center}>
      <Text style={[styles.centerText, { color: colors.danger }]}>{message}</Text>
      {onRetry ? (
        <Button label="Retry" variant="outline" onPress={onRetry} style={{ marginTop: 12 }} />
      ) : null}
    </View>
  );
}

export function EmptyView({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.center}>
      <Text style={[styles.h3, { textAlign: "center" }]}>{title}</Text>
      {hint ? (
        <Text style={[styles.centerText, { marginTop: 6 }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

/* ── Helpers ────────────────────────────────────────────────────── */

export function statusTone(status: string): "gold" | "green" | "red" | "muted" | "forest" {
  const s = status.toUpperCase();
  if (["DELIVERED", "COMPLETED", "APPROVED", "ACTIVE"].includes(s)) return "green";
  if (["CANCELLED", "REJECTED", "REFUNDED"].includes(s)) return "red";
  if (["SHIPPED", "PACKAGING", "CONFIRMED"].includes(s)) return "forest";
  return "gold";
}

export function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  btnText: { fontSize: 15, fontWeight: "600" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.ink },
  seeAll: { fontSize: 13, fontWeight: "600", color: colors.forestMid },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 6,
  },
  field: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.ink,
  },
  center: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  centerText: { fontSize: 13, color: colors.inkMuted, marginTop: 8, textAlign: "center" },
  h3: { fontSize: 16, fontWeight: "700", color: colors.ink },
});
