/** Storefront product card — image tile, wishlist heart, price block. */
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native';
import { thumbUrl } from '../config';
import { colors, discountPercent, formatPrice, radii, shadows } from '../theme';
import { useWishlist } from '../store/wishlist';
import { AppIcon } from './AppIcon';
import { SmartImage } from './ui';
import type { ProductCard as ProductCardType } from '../types';

/** Cards are at most ~half the screen wide; fetch a thumbnail, not the original. */
const CARD_IMG_DP = 170;

function WishHeart({ id }: { id: string }) {
  const on = useWishlist(s => s.ids.includes(id));
  const toggle = useWishlist(s => s.toggle);
  return (
    <Pressable onPress={() => toggle(id)} hitSlop={8} style={styles.heart}>
      <AppIcon
        name="heart"
        size={16}
        filled={on}
        color={on ? colors.discount : colors.inkMuted}
      />
    </Pressable>
  );
}

function ProductCardBase({
  product,
  onPress,
  width,
}: {
  product: ProductCardType;
  onPress: () => void;
  width?: DimensionValue;
}) {
  const pct = discountPercent(product.price, product.comparePrice);
  const soldOut = product.stock <= 0;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        width ? { width } : null,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={styles.imgWrap}>
        <SmartImage
          uri={product.image ? thumbUrl(product.image, CARD_IMG_DP) : null}
          style={[styles.img, soldOut && { opacity: 0.45 }]}
          resizeMode="contain"
          icon="pill"
          iconSize={38}
        />
        <View style={styles.topRow}>
          {pct > 0 ? (
            <View style={styles.pctBadge}>
              <Text style={styles.pctText}>{pct}% OFF</Text>
            </View>
          ) : (
            <View />
          )}
          <WishHeart id={product.id} />
        </View>
        {product.requiresPrescription ? (
          <View style={styles.rxBadge}>
            <Text style={styles.rxText}>Rx</Text>
          </View>
        ) : null}
        {soldOut ? (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>Sold out</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        {product.brand?.name ? (
          <Text numberOfLines={1} style={styles.brand}>
            {product.brand.name}
          </Text>
        ) : null}
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <View style={styles.bottom}>
          <View style={{ flex: 1 }}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {pct > 0 ? (
              <Text style={styles.compare}>
                {formatPrice(product.comparePrice!)}
              </Text>
            ) : null}
          </View>
          {typeof product.rating === 'number' && product.rating > 0 ? (
            <View style={styles.rating}>
              <AppIcon name="star" size={11} filled color={colors.goldStar} />
              <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        {!soldOut && product.stock <= 10 ? (
          <Text style={styles.low}>Only {product.stock} left</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Memoized: product rows are re-created on every list render (new `onPress`
 * closure each time), so compare by the fields that actually affect output and
 * skip the churn from the changing callback identity.
 */
export const ProductCard = React.memo(
  ProductCardBase,
  (a, b) =>
    a.width === b.width &&
    a.product.id === b.product.id &&
    a.product.price === b.product.price &&
    a.product.comparePrice === b.product.comparePrice &&
    a.product.stock === b.product.stock &&
    a.product.image === b.product.image &&
    a.product.name === b.product.name &&
    a.product.rating === b.product.rating,
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadows.card,
  },
  imgWrap: {
    position: 'relative',
    backgroundColor: colors.surfaceAlt,
    margin: 6,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  img: { width: '100%', aspectRatio: 1 },
  topRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pctBadge: {
    backgroundColor: colors.discount,
    borderRadius: radii.xs,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  pctText: { color: colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  heart: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
    shadowOpacity: 0.08,
  },
  rxBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: colors.forest,
    borderRadius: radii.xs,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  rxText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  soldOut: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: colors.ink,
    borderRadius: radii.xs,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  soldOutText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  body: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 12 },
  brand: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.forestMid,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  name: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.ink,
    lineHeight: 18.5,
    minHeight: 37,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  price: { fontSize: 16, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },
  compare: {
    fontSize: 11.5,
    color: colors.inkFaint,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.goldSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ratingText: { fontSize: 11, fontWeight: '800', color: colors.goldDeep },
  low: { fontSize: 11, color: colors.warning, fontWeight: '600', marginTop: 6 },
});
