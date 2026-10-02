/** Cart tab — line items, qty controls, order summary + checkout CTA. */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { mediaUrl } from '../config';
import { AppIcon } from '../components/AppIcon';
import { tabBarSpace } from '../components/FluidTabBar';
import { Button, EmptyView, SmartImage, Stepper } from '../components/ui';
import { useCart } from '../store/cart';
import { colors, formatPrice, radii, shadows } from '../theme';
import type { TabScreenProps } from '../navigation/types';

export function CartScreen({ navigation }: TabScreenProps<'Cart'>) {
  const items = useCart(s => s.items);
  const setQty = useCart(s => s.setQty);
  const remove = useCart(s => s.remove);
  const subtotal = useCart(s => s.subtotal());
  const count = useCart(s => s.count());
  const insets = useSafeAreaInsets();
  const bottom = tabBarSpace(insets);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My cart</Text>
          <Text style={styles.subtitle}>
            {count > 0 ? `${count} item${count > 1 ? 's' : ''} ready to go` : 'Nothing here yet'}
          </Text>
        </View>
        {items.length > 0 ? (
          <View style={styles.headerIcon}>
            <AppIcon name="cart" color={colors.forest} size={22} />
          </View>
        ) : null}
      </View>

      {items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', paddingBottom: bottom }}>
          <EmptyView
            icon="cart"
            title="Your cart is empty"
            hint="Genuine medicines, beauty and wellness — delivered in 12–24h."
            action={{ label: 'Start shopping', onPress: () => navigation.navigate('Home') }}
          />
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 4,
              paddingBottom: bottom + 150,
            }}
          >
            {items.map(i => (
              <Pressable
                key={`${i.productId}:${i.variantId ?? ''}`}
                onPress={() => navigation.navigate('ProductDetail', { slug: i.slug })}
                style={styles.row}
              >
                <SmartImage
                  uri={i.image ? mediaUrl(i.image) : null}
                  style={styles.img}
                  resizeMode="contain"
                  icon="pill"
                  iconSize={28}
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Text numberOfLines={2} style={styles.name}>
                      {i.name}
                    </Text>
                    <Pressable
                      onPress={() => remove(i.productId, i.variantId)}
                      hitSlop={10}
                    >
                      <AppIcon name="close" color={colors.inkFaint} size={18} />
                    </Pressable>
                  </View>
                  {i.variantName ? (
                    <Text style={styles.variant}>{i.variantName}</Text>
                  ) : null}
                  <View style={styles.rowFoot}>
                    <View>
                      <Text style={styles.price}>{formatPrice(i.price * i.qty)}</Text>
                      {i.qty > 1 ? (
                        <Text style={styles.each}>{formatPrice(i.price)} each</Text>
                      ) : null}
                    </View>
                    <Stepper
                      compact
                      removable
                      value={i.qty}
                      onDec={() => setQty(i.productId, i.variantId, i.qty - 1)}
                      onInc={() =>
                        setQty(i.productId, i.variantId, Math.min(i.stock || 99, i.qty + 1))
                      }
                    />
                  </View>
                </View>
              </Pressable>
            ))}

            <View style={styles.note}>
              <AppIcon name="shield" color={colors.lime} size={18} />
              <Text style={styles.noteText}>
                Every order is checked by a licensed pharmacist before dispatch.
              </Text>
            </View>
          </ScrollView>

          <View style={[styles.summary, { bottom: bottom + 4 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>Subtotal</Text>
              <Text style={styles.subVal}>{formatPrice(subtotal)}</Text>
              <Text style={styles.subHint}>Delivery calculated at checkout</Text>
            </View>
            <Button
              label="Checkout"
              icon="arrowRight"
              onPress={() => navigation.navigate('Checkout')}
              style={{ flex: 1.2 }}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.6 },
  subtitle: { fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 12,
    marginBottom: 12,
    ...shadows.card,
  },
  img: {
    width: 86,
    height: 86,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  name: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink, lineHeight: 19 },
  variant: {
    alignSelf: 'flex-start',
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.forestMid,
    backgroundColor: colors.brandSoft,
    borderRadius: radii.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 5,
    overflow: 'hidden',
  },
  rowFoot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 8,
  },
  price: { fontSize: 16, fontWeight: '800', color: colors.ink },
  each: { fontSize: 11, color: colors.inkMuted, marginTop: 1 },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.successSoft,
    borderRadius: radii.md,
    padding: 14,
    marginTop: 4,
  },
  noteText: { flex: 1, fontSize: 12.5, color: colors.inkSoft, lineHeight: 17 },
  summary: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadows.float,
    shadowOpacity: 0.12,
  },
  subLabel: { fontSize: 12, color: colors.inkMuted, fontWeight: '600' },
  subVal: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  subHint: { fontSize: 10.5, color: colors.inkFaint, marginTop: 1 },
});
