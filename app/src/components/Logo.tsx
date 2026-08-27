/** Ahona dawn-A mark recreated as SVG (ported from web BrandLogo). */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { colors } from "../theme";

export function AhonaMark({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="ahona-g" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1a5c56" />
          <Stop offset="1" stopColor="#0c2a28" />
        </LinearGradient>
      </Defs>
      <Rect width={64} height={64} rx={16} fill="url(#ahona-g)" />
      <Path
        fill={colors.gold}
        fillRule="evenodd"
        d="M32 9.8 52.4 54h-8.6l-3.45-8.4H23.65L20.2 54H11.6L32 9.8Zm0 14.4 4.35 10.6h-8.7L32 24.2Z"
      />
      <Path fill="#e8c547" d="M27.2 34.8a4.8 4.8 0 0 1 9.6 0H27.2Z" />
      <Path
        fill="none"
        stroke="#e8c547"
        strokeWidth={1.15}
        strokeLinecap="round"
        d="M32 26.6v2.3M27.7 28.2l1.5 1.7M36.3 28.2l-1.5 1.7"
      />
    </Svg>
  );
}

export function BrandLogo({
  size = 36,
  wordmark = true,
  light = false,
}: {
  size?: number;
  wordmark?: boolean;
  light?: boolean;
}) {
  return (
    <View style={styles.row}>
      <AhonaMark size={size} />
      {wordmark ? (
        <View style={{ marginLeft: 10 }}>
          <Text style={[styles.name, light && { color: colors.white }]}>Ahona</Text>
          <Text style={[styles.tag, light && { color: "rgba(255,255,255,0.7)" }]}>
            Health & Beauty
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 19, fontWeight: "800", color: colors.ink, letterSpacing: 0.3 },
  tag: { fontSize: 10, color: colors.inkMuted, letterSpacing: 1.6, textTransform: "uppercase" },
});
