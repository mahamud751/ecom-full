/** Storefront product card — mirrors the web ProductCard layout. */
import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native';
import { mediaUrl } from '../config';
import { colors, discountPercent, formatPrice, radii, shadows } from '../theme';
import { Badge } from './ui';
import type { ProductCard as ProductCardType } from '../types';

export function ProductCard({
  product,
  onPress,
  width,
}: {
  product: ProductCardType;
  onPress: () => void;
  width?: DimensionValue;
}) {
  const pct = discountPercent(product.price, product.comparePrice);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        width ? { width } : null,
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={styles.imgWrap}>
        {product.image ? (
          <Image source={{ uri: mediaUrl(product.image) }} style={styles.img} />
        ) : (
          <View style={[styles.img, { backgroundColor: colors.brandSoft }]} />
        )}
        {pct > 0 ? (
          <View style={styles.pctBadge}>
            <Text style={styles.pctText}>-{pct}%</Text>
          </View>
        ) : null}
        {product.requiresPrescription ? (
          <View style={styles.rxBadge}>
            <Text style={styles.rxText}>Rx</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.comparePrice && product.comparePrice > product.price ? (
            <Text style={styles.compare}>
              {formatPrice(product.comparePrice)}
            </Text>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          {typeof product.rating === 'number' && product.rating > 0 ? (
            <Text style={styles.rating}>★ {product.rating.toFixed(1)}</Text>
          ) : null}
          {product.stock <= 0 ? (
            <Badge label="Out of stock" tone="red" />
          ) : product.stock <= 10 ? (
            <Badge label={`Only ${product.stock} left`} tone="gold" />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    ...shadows.card,
  },
  imgWrap: { position: 'relative' },
  img: { width: '100%', aspectRatio: 1, backgroundColor: colors.brandSoft },
  pctBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.discount,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  pctText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  rxBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.forest,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  rxText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  body: { padding: 10 },
  name: { fontSize: 13, fontWeight: '600', color: colors.ink, lineHeight: 18 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  price: { fontSize: 15, fontWeight: '800', color: colors.forest },
  compare: {
    fontSize: 12,
    color: colors.inkMuted,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    minHeight: 18,
  },
  rating: { fontSize: 12, color: colors.goldDeep, fontWeight: '700' },
});
