/**
 * Ahona mark — gold "A" whose crossbar is a medical cross, with a dawn
 * sparkle, on forest green. Same geometry as app/assets/brand/ahona-icon.svg
 * (the launcher / Play Store icon), drawn on a 512 grid.
 */
import React, { useId } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { colors } from "../theme";

export function AhonaMark({ size = 36 }: { size?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1f6f66" />
          <Stop offset="1" stopColor="#0a2321" />
        </LinearGradient>
        <RadialGradient id={`gl${id}`} cx="0.22" cy="0.12" r="0.75">
          <Stop offset="0" stopColor="#3fa396" stopOpacity={0.45} />
          <Stop offset="1" stopColor="#3fa396" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={`au${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f3d98a" />
          <Stop offset="0.55" stopColor="#d4ad35" />
          <Stop offset="1" stopColor="#a8841c" />
        </LinearGradient>
      </Defs>
      <Rect width={512} height={512} rx={124} fill={`url(#bg${id})`} />
      <Rect width={512} height={512} rx={124} fill={`url(#gl${id})`} />
      <G transform="translate(256 262) scale(0.8) translate(-256 -262)">
        <Path
          d="M150 400 L256 132 L362 400"
          fill="none"
          stroke={`url(#au${id})`}
          strokeWidth={64}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Rect x={188} y={292} width={136} height={44} rx={12} fill="#fbf8f0" />
        <Rect x={234} y={258} width={44} height={112} rx={12} fill="#fbf8f0" />
        <Path
          fill="#f3d98a"
          d="M388 96 C392 124 400 132 428 136 C400 140 392 148 388 176 C384 148 376 140 348 136 C376 132 384 124 388 96 Z"
        />
      </G>
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
  name: { fontSize: 20, fontWeight: "800", color: colors.ink, letterSpacing: -0.3 },
  tag: { fontSize: 10, color: colors.inkMuted, letterSpacing: 1.6, textTransform: "uppercase" },
});
