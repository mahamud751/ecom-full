/** Product detail — gallery, price, variants, add to cart, Rx notice. */
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import { mediaUrl } from '../config';
import { Badge, Button, ErrorView, Loading } from '../components/ui';
import { useCart } from '../store/cart';
import { colors, discountPercent, formatPrice, radii } from '../theme';
import type { ProductDetail } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootParamList, 'ProductDetail'>;

export function ProductDetailScreen({ navigation, route }: Props) {
  const { slug } = route.params;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<string | null>(null);
  const add = useCart(s => s.add);

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
    else Alert.alert('Added to cart', product!.name);
  }

  const images = product.images?.length
    ? product.images
    : product.image
    ? [product.image]
    : [];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {images.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
          >
            {images.map((img, i) => (
              <Image
                key={i}
                source={{ uri: mediaUrl(img) }}
                style={styles.hero}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.hero, { backgroundColor: colors.brandSoft }]} />
        )}

        <View style={styles.body}>
          <View style={styles.rowBetween}>
            {pct > 0 ? <Badge label={`${pct}% OFF`} tone="red" /> : null}
            {product.requiresPrescription ? (
              <Badge label="Rx required" tone="forest" />
            ) : null}
            {product.expressDelivery ? (
              <Badge label="Express 12–24h" tone="green" />
            ) : null}
          </View>

          <Text style={styles.name}>{product.name}</Text>
          {product.brand?.name ? (
            <Text style={styles.brand}>by {product.brand.name}</Text>
          ) : null}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(price)}</Text>
            {compare && compare > price ? (
              <Text style={styles.compare}>{formatPrice(compare)}</Text>
            ) : null}
          </View>

          {product.variants && product.variants.length > 0 ? (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.label}>Variant</Text>
              <View style={styles.variantRow}>
                {product.variants.map(v => (
                  <Pressable
                    key={v.id}
                    onPress={() => setVariantId(v.id)}
                    style={[
                      styles.variant,
                      variantId === v.id && styles.variantActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.variantText,
                        variantId === v.id && { color: colors.white },
                      ]}
                    >
                      {v.name} · {formatPrice(v.price)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.qtyRow}>
            <Text style={styles.label}>Quantity</Text>
            <View style={styles.qtyCtl}>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => setQty(q => Math.max(1, q - 1))}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </Pressable>
              <Text style={styles.qtyVal}>{qty}</Text>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => setQty(q => Math.min(stock || 99, q + 1))}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          {stock <= 0 ? (
            <Badge label="Out of stock" tone="red" />
          ) : stock <= 10 ? (
            <Badge label={`Hurry — only ${stock} left`} tone="gold" />
          ) : null}

          {product.description ? (
            <View style={{ marginTop: 18 }}>
              <Text style={styles.label}>About this product</Text>
              <Text style={styles.desc}>{product.description}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={`Add to cart · ${formatPrice(price * qty)}`}
          onPress={() => addToCart(false)}
          disabled={stock <= 0}
          style={{ flex: 1 }}
        />
        <Button
          label="Buy now"
          variant="gold"
          onPress={() => addToCart(true)}
          disabled={stock <= 0}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  hero: { width: '100%', height: 340 },
  body: { padding: 16 },
  rowBetween: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  name: { fontSize: 20, fontWeight: '800', color: colors.ink, lineHeight: 26 },
  brand: { fontSize: 13, color: colors.inkMuted, marginTop: 4 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  price: { fontSize: 24, fontWeight: '800', color: colors.forest },
  compare: {
    fontSize: 15,
    color: colors.inkMuted,
    textDecorationLine: 'line-through',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variant: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.surface,
  },
  variantActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  variantText: { fontSize: 12.5, fontWeight: '600', color: colors.ink },
  qtyRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyCtl: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  qtyBtnText: { fontSize: 18, color: colors.forest, fontWeight: '700' },
  qtyVal: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  desc: { fontSize: 14, lineHeight: 21, color: colors.ink },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
