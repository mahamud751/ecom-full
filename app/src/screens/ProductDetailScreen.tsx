/** Product detail — gallery, price, variants, add to cart, Rx notice. */
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { http, apiErrorMessage } from '../api/client';
import { mediaUrl } from '../config';
import { AppIcon, type IconName } from '../components/AppIcon';
import {
  Badge,
  Button,
  ErrorView,
  IconButton,
  IconTile,
  Loading,
  SmartImage,
  Stepper,
} from '../components/ui';
import { useWishlist } from '../store/wishlist';
import { useCart } from '../store/cart';
import { colors, discountPercent, formatPrice, radii, shadows } from '../theme';
import type { ProductDetail } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootParamList, 'ProductDetail'>;

const SCREEN_WIDTH = Dimensions.get('window').width;

export function ProductDetailScreen({ navigation, route }: Props) {
  const { slug } = route.params;
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(null);
  const add = useCart(s => s.add);
  const cartCount = useCart(s => s.count());
  const wished = useWishlist(s => s.ids.includes(product?.id ?? ''));
  const toggleWish = useWishlist(s => s.toggle);
  const [slide, setSlide] = useState(0);
  const toast = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.spring(toast, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 8 }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toast, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }, 2600);
  };

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  useEffect(() => {
    http
      .get(`/products/${slug}`)
      .then(res => {
        const p: ProductDetail = res.data.product ?? res.data;
        setProduct(p);
        const def = p.variants?.find(v => v.isDefault) ?? p.variants?.[0];
        if (def) setVariantId(def.id);
      })
      .catch(err => setError(apiErrorMessage(err, 'Product not found')));
  }, [slug]);

  if (error) return <ErrorView message={error} />;
  if (!product) return <Loading />;

  const active = product.variants?.find(v => v.id === variantId) ?? undefined;
  const price = active ? active.price : product.price;
  const compare = active ? null : product.comparePrice;
  const stock = active ? active.stock : product.stock;
  const pct = discountPercent(price, compare);

  function addToCart(goCheckout = false) {
    if (!product) return;
    if (product.requiresPrescription) {
      Alert.alert(
        'Prescription required',
        'This product needs a valid prescription. Our pharmacist will call you to verify it after checkout.',
        [
          { text: 'Continue', onPress: () => doAdd(goCheckout) },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }
    doAdd(goCheckout);
  }

  function doAdd(goCheckout: boolean) {
    add(
      {
        productId: product!.id,
        slug: product!.slug,
        name: product!.name,
        image: product!.image,
        price,
        stock,
        variantId,
        variantName: active?.name ?? null,
      },
      qty,
    );
    if (goCheckout) navigation.navigate('Checkout');
    else showToast();
  }

  const images = product.images?.length
    ? product.images
    : product.image
    ? [product.image]
    : [];

  const perks: { icon: IconName; t: string; s: string }[] = [
    { icon: 'shield', t: '100% genuine', s: 'Sourced from brands' },
    { icon: 'truck', t: product.expressDelivery ? 'Express' : '12–24h', s: 'Fast delivery' },
    { icon: 'wallet', t: 'COD', s: 'Pay on delivery' },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        <View style={styles.gallery}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            onMomentumScrollEnd={e =>
              setSlide(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))
            }
          >
            {(images.length ? images : [null]).map((img, i) => (
              <View key={i} style={styles.slide}>
                <SmartImage
                  uri={img ? mediaUrl(img) : null}
                  style={styles.heroImg}
                  resizeMode="contain"
                  icon="pill"
                  iconSize={72}
                />
              </View>
            ))}
          </ScrollView>
          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === slide && styles.dotActive]} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.sheet}>
          <View style={styles.badges}>
            {pct > 0 ? <Badge label={`${pct}% OFF`} tone="red" /> : null}
            {product.requiresPrescription ? (
              <Badge label="Rx required" tone="forest" dot />
            ) : null}
            {product.expressDelivery ? (
              <Badge label="Express 12–24h" tone="green" dot />
            ) : null}
            {stock <= 0 ? (
              <Badge label="Out of stock" tone="red" />
            ) : stock <= 10 ? (
              <Badge label={`Only ${stock} left`} tone="gold" />
            ) : null}
          </View>

          {product.brand?.name ? (
            <Text style={styles.brand}>{product.brand.name}</Text>
          ) : null}
          <Text style={styles.name}>{product.name}</Text>
          {product.genericName ? (
            <Text style={styles.generic}>{product.genericName}</Text>
          ) : null}

          {typeof product.rating === 'number' && product.rating > 0 ? (
            <View style={styles.ratingRow}>
              <AppIcon name="star" size={15} filled color={colors.goldStar} />
              <Text style={styles.ratingVal}>{product.rating.toFixed(1)}</Text>
              {product.reviewCount ? (
                <Text style={styles.ratingCount}>({product.reviewCount} reviews)</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
                <Text style={styles.price}>{formatPrice(price)}</Text>
                {compare && compare > price ? (
                  <Text style={styles.compare}>{formatPrice(compare)}</Text>
                ) : null}
              </View>
              {compare && compare > price ? (
                <Text style={styles.save}>You save {formatPrice(compare - price)}</Text>
              ) : (
                <Text style={styles.saveMuted}>Inclusive of all taxes</Text>
              )}
            </View>
            <Stepper
              value={qty}
              onDec={() => setQty(q => Math.max(1, q - 1))}
              onInc={() => setQty(q => Math.min(stock || 99, q + 1))}
            />
          </View>

          {product.variants && product.variants.length > 0 ? (
            <View style={{ marginTop: 22 }}>
              <Text style={styles.label}>Choose variant</Text>
              <View style={styles.variantRow}>
                {product.variants.map(v => {
                  const on = variantId === v.id;
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => setVariantId(v.id)}
                      style={[styles.variant, on && styles.variantActive]}
                    >
                      <Text style={[styles.variantName, on && { color: colors.forest }]}>
                        {v.name}
                      </Text>
                      <Text style={styles.variantPrice}>{formatPrice(v.price)}</Text>
                      {on ? (
                        <View style={styles.variantCheck}>
                          <AppIcon name="check" color={colors.white} size={10} strokeWidth={3} />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.perks}>
            {perks.map(p => (
              <View key={p.t} style={styles.perk}>
                <IconTile name={p.icon} size={36} />
                <Text style={styles.perkT}>{p.t}</Text>
                <Text style={styles.perkS}>{p.s}</Text>
              </View>
            ))}
          </View>

          {product.requiresPrescription ? (
            <View style={styles.rxNote}>
              <AppIcon name="file" color={colors.goldDeep} size={20} />
              <Text style={styles.rxText}>
                This medicine needs a valid prescription. Our pharmacist will verify it
                with you after you order.
              </Text>
            </View>
          ) : null}

          {product.description ? (
            <View style={{ marginTop: 22 }}>
              <Text style={styles.label}>About this product</Text>
              <Text style={styles.desc}>{product.description}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <IconButton name="back" onPress={() => navigation.goBack()} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <IconButton
            name="heart"
            iconColor={wished ? colors.discount : colors.ink}
            onPress={() => toggleWish(product.id)}
          />
          <IconButton
            name="cart"
            badge={cartCount}
            onPress={() => navigation.navigate('Tabs', { screen: 'Cart' })}
          />
        </View>
      </View>

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.toast,
          {
            bottom: 96 + insets.bottom,
            opacity: toast,
            transform: [{ translateY: toast.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          },
        ]}
      >
        <View style={styles.toastIcon}>
          <AppIcon name="check" color={colors.forestDeep} size={14} strokeWidth={3} />
        </View>
        <Text style={styles.toastText} numberOfLines={1}>
          Added to cart
        </Text>
        <Pressable onPress={() => navigation.navigate('Tabs', { screen: 'Cart' })} hitSlop={8}>
          <Text style={styles.toastAction}>View cart</Text>
        </Pressable>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}>
        <View style={{ flex: 0.9 }}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.total}>{formatPrice(price * qty)}</Text>
        </View>
        <Button
          label="Add"
          icon="cart"
          variant="outline"
          onPress={() => addToCart(false)}
          disabled={stock <= 0}
          style={{ flex: 1 }}
        />
        <Button
          label="Buy now"
          onPress={() => addToCart(true)}
          disabled={stock <= 0}
          style={{ flex: 1.1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  gallery: { backgroundColor: colors.surfaceAlt, paddingBottom: 36 },
  slide: {
    width: SCREEN_WIDTH,
    height: 400,
    paddingTop: 70,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImg: { width: '100%', height: '100%', borderRadius: radii.xl },
  dots: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line },
  dotActive: { width: 18, backgroundColor: colors.forest },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sheet: {
    marginTop: -24,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  brand: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.forestMid,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  generic: { fontSize: 13.5, color: colors.inkMuted, marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  ratingVal: { fontSize: 13.5, fontWeight: '800', color: colors.ink },
  ratingCount: { fontSize: 12.5, color: colors.inkMuted },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  price: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.6 },
  compare: {
    fontSize: 15,
    color: colors.inkFaint,
    textDecorationLine: 'line-through',
  },
  save: { fontSize: 12.5, color: colors.lime, fontWeight: '700', marginTop: 2 },
  saveMuted: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 10,
  },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  variant: {
    minWidth: 96,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  variantActive: { borderColor: colors.forest, backgroundColor: colors.brandSoft },
  variantName: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  variantPrice: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  variantCheck: {
    position: 'absolute',
    top: -7,
    right: -7,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perks: {
    flexDirection: 'row',
    marginTop: 22,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingVertical: 14,
  },
  perk: { flex: 1, alignItems: 'center' },
  perkT: { fontSize: 12.5, fontWeight: '800', color: colors.ink, marginTop: 8 },
  perkS: { fontSize: 10.5, color: colors.inkMuted, marginTop: 1 },
  rxNote: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: colors.goldSoft,
    borderRadius: radii.md,
    padding: 14,
    marginTop: 16,
  },
  rxText: { flex: 1, fontSize: 12.5, color: colors.inkSoft, lineHeight: 18 },
  desc: { fontSize: 14.5, lineHeight: 22, color: colors.inkSoft },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadows.float,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.forestDeep,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...shadows.float,
  },
  toastIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: { flex: 1, color: colors.white, fontSize: 14, fontWeight: '700' },
  toastAction: { color: colors.gold, fontSize: 13.5, fontWeight: '800' },
  totalLabel: { fontSize: 11.5, color: colors.inkMuted, fontWeight: '600' },
  total: { fontSize: 19, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
});
