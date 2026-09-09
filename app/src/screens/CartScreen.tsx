/** Cart tab — line items, qty controls, checkout CTA. */
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { mediaUrl } from '../config';
import { Button, EmptyView } from '../components/ui';
import { useCart } from '../store/cart';
import { colors, formatPrice, radii } from '../theme';
import type { TabScreenProps } from '../navigation/types';

export function CartScreen({ navigation }: TabScreenProps<'Cart'>) {
  const items = useCart(s => s.items);
  const setQty = useCart(s => s.setQty);
  const remove = useCart(s => s.remove);
  const subtotal = useCart(s => s.subtotal());
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <Text style={styles.title}>My cart</Text>
      {items.length === 0 ? (
        <EmptyView
          title="Your cart is empty"
          hint="Browse the store and add something you love."
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              padding: 14,
              paddingBottom: 130 + insets.bottom,
            }}
          >
            {items.map(i => (
              <View
                key={`${i.productId}:${i.variantId ?? ''}`}
                style={styles.row}
              >
                {i.image ? (
                  <Image
                    source={{ uri: mediaUrl(i.image) }}
                    style={styles.img}
                  />
                ) : (
                  <View
                    style={[styles.img, { backgroundColor: colors.brandSoft }]}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={2} style={styles.name}>
                    {i.name}
                  </Text>
                  {i.variantName ? (
                    <Text style={styles.variant}>{i.variantName}</Text>
                  ) : null}
                  <Text style={styles.price}>
                    {formatPrice(i.price * i.qty)}
                  </Text>
                  <View style={styles.qtyRow}>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() =>
                        setQty(i.productId, i.variantId, i.qty - 1)
                      }
                    >
                      <Text style={styles.qtyText}>−</Text>
                    </Pressable>
                    <Text style={styles.qtyVal}>{i.qty}</Text>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() =>
                        setQty(
                          i.productId,
                          i.variantId,
                          Math.min(i.stock || 99, i.qty + 1),
                        )
                      }
                    >
                      <Text style={styles.qtyText}>+</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => remove(i.productId, i.variantId)}
                      hitSlop={8}
                      style={{ marginLeft: 'auto' }}
                    >
                      <Text style={styles.remove}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
          <View
            style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>Subtotal</Text>
              <Text style={styles.subVal}>{formatPrice(subtotal)}</Text>
            </View>
            <Button
              label="Checkout"
              onPress={() => navigation.navigate('Checkout')}
              style={{ flex: 1.4 }}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    marginBottom: 10,
  },
  img: { width: 72, height: 72, borderRadius: 10 },
  name: { fontSize: 13.5, fontWeight: '600', color: colors.ink },
  variant: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.forest,
    marginTop: 4,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 16, color: colors.forest, fontWeight: '700' },
  qtyVal: { minWidth: 18, textAlign: 'center', fontWeight: '700' },
  remove: { fontSize: 12.5, color: colors.danger, fontWeight: '600' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  subLabel: { fontSize: 12, color: colors.inkMuted },
  subVal: { fontSize: 18, fontWeight: '800', color: colors.ink },
});
