/** Checkout — delivery details, coupon, COD place order. */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { http, apiErrorMessage } from '../api/client';
import { mediaUrl } from '../config';
import { AppIcon, type IconName } from '../components/AppIcon';
import { Button, Card, EmptyView, Field, IconTile, SmartImage } from '../components/ui';
import { useAuth } from '../store/auth';
import { useCart } from '../store/cart';
import { colors, formatPrice, radii, shadows } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootParamList, 'Checkout'>;

const DELIVERY_FEE = 60;

export function CheckoutScreen({ navigation }: Props) {
  const items = useCart(s => s.items);
  const subtotal = useCart(s => s.subtotal());
  const clear = useCart(s => s.clear);
  const user = useAuth(s => s.user);
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [area, setArea] = useState('');
  const [notes, setNotes] = useState('');
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  if (items.length === 0) {
    return (
      <EmptyView title="Nothing to check out" hint="Your cart is empty." />
    );
  }

  const total = Math.max(0, subtotal - discount) + DELIVERY_FEE;

  async function applyCoupon() {
    if (!coupon.trim()) return;
    try {
      const res = await http.post('/coupons/validate', {
        code: coupon.trim(),
        subtotal,
      });
      setDiscount(res.data.discount ?? 0);
      setCouponMsg(
        `Coupon applied — you save ${formatPrice(res.data.discount ?? 0)}`,
      );
    } catch (err) {
      setDiscount(0);
      setCouponMsg(apiErrorMessage(err, 'Invalid coupon'));
    }
  }

  async function placeOrder() {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Missing details', 'Name, phone and address are required.');
      return;
    }
    setPlacing(true);
    try {
      const res = await http.post('/orders', {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        address: address.trim(),
        city,
        area: area.trim() || undefined,
        notes: notes.trim() || undefined,
        paymentMethod: 'COD',
        couponCode: discount > 0 ? coupon.trim().toUpperCase() : undefined,
        items: items.map(i => ({
          productId: i.productId,
          variantId: i.variantId ?? undefined,
          quantity: i.qty,
        })),
      });
      clear();
      navigation.replace('OrderSuccess', {
        orderId: res.data.id ?? res.data.orderId,
        orderNumber: res.data.orderNumber,
      });
    } catch (err) {
      Alert.alert(
        'Order failed',
        apiErrorMessage(err, 'Could not place the order'),
      );
    } finally {
      setPlacing(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 130 + insets.bottom }}
      >
        <Steps />

        <Section n={1} icon="pin" title="Delivery details">
          <Field label="Full name" icon="user" value={name} onChangeText={setName} placeholder="Your name" />
          <Field
            label="Phone"
            icon="phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="01XXXXXXXXX"
            keyboardType="phone-pad"
          />
          <Field
            label="Email (optional)"
            icon="mail"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field label="Address" icon="home" value={address} onChangeText={setAddress} placeholder="House, road, block" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field label="City" value={city} onChangeText={setCity} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Area" value={area} onChangeText={setArea} placeholder="e.g. Dhanmondi" />
            </View>
          </View>
          <Field
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Landmark, delivery time…"
          />
        </Section>

        <Section n={2} icon="wallet" title="Payment">
          <View style={styles.payment}>
            <IconTile name="wallet" size={42} color={colors.forestDeep} bg={colors.goldSoft} />
            <View style={{ flex: 1 }}>
              <Text style={styles.payT}>Cash on delivery</Text>
              <Text style={styles.payS}>Pay when your order arrives</Text>
            </View>
            <View style={styles.radio}>
              <View style={styles.radioDot} />
            </View>
          </View>
          <View style={styles.couponRow}>
            <View style={{ flex: 1 }}>
              <Field
                icon="tag"
                value={coupon}
                onChangeText={setCoupon}
                placeholder="Coupon code"
                autoCapitalize="characters"
              />
            </View>
            <Button label="Apply" variant="soft" onPress={() => void applyCoupon()} style={{ marginBottom: 14 }} />
          </View>
          {couponMsg ? (
            <View style={styles.couponMsgRow}>
              <AppIcon name={discount > 0 ? 'check' : 'info'} color={discount > 0 ? colors.lime : colors.inkMuted} size={15} />
              <Text style={[styles.couponMsg, discount > 0 && { color: colors.lime }]}>{couponMsg}</Text>
            </View>
          ) : null}
        </Section>

        <Section n={3} icon="box" title={`Order summary · ${items.length} item${items.length > 1 ? 's' : ''}`}>
          {items.map(i => (
            <View key={`${i.productId}:${i.variantId ?? ''}`} style={styles.item}>
              <SmartImage
                uri={i.image ? mediaUrl(i.image) : null}
                style={styles.itemImg}
                resizeMode="contain"
                icon="pill"
                iconSize={18}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {i.name}
                </Text>
                <Text style={styles.itemQty}>
                  Qty {i.qty}
                  {i.variantName ? ` · ${i.variantName}` : ''}
                </Text>
              </View>
              <Text style={styles.lineVal}>{formatPrice(i.price * i.qty)}</Text>
            </View>
          ))}
          <View style={styles.bill}>
            <View style={styles.line}>
              <Text style={styles.lineName}>Subtotal</Text>
              <Text style={styles.lineVal}>{formatPrice(subtotal)}</Text>
            </View>
            {discount > 0 ? (
              <View style={styles.line}>
                <Text style={[styles.lineName, { color: colors.lime }]}>Coupon discount</Text>
                <Text style={[styles.lineVal, { color: colors.lime }]}>−{formatPrice(discount)}</Text>
              </View>
            ) : null}
            <View style={styles.line}>
              <Text style={styles.lineName}>Delivery</Text>
              <Text style={styles.lineVal}>{formatPrice(DELIVERY_FEE)}</Text>
            </View>
            <View style={[styles.line, styles.totalLine]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalVal}>{formatPrice(total)}</Text>
            </View>
          </View>
        </Section>

        <View style={styles.secure}>
          <AppIcon name="shield" color={colors.lime} size={16} />
          <Text style={styles.secureText}>Pharmacist-verified · Genuine products · Easy returns</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.footLabel}>Total payable</Text>
          <Text style={styles.footVal}>{formatPrice(total)}</Text>
        </View>
        <Button
          label="Place order"
          icon="check"
          loading={placing}
          onPress={() => void placeOrder()}
          style={{ flex: 1.3 }}
        />
      </View>
    </View>
  );
}

function Steps() {
  const steps = ['Cart', 'Details', 'Done'];
  return (
    <View style={styles.steps}>
      {steps.map((st, i) => (
        <React.Fragment key={st}>
          <View style={styles.step}>
            <View style={[styles.stepDot, i <= 1 && styles.stepDotOn]}>
              {i === 0 ? (
                <AppIcon name="check" color={colors.white} size={12} strokeWidth={3} />
              ) : (
                <Text style={[styles.stepN, i <= 1 && { color: colors.white }]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, i <= 1 && { color: colors.ink }]}>{st}</Text>
          </View>
          {i < steps.length - 1 ? (
            <View style={[styles.stepLine, i === 0 && { backgroundColor: colors.forest }]} />
          ) : null}
        </React.Fragment>
      ))}
    </View>
  );
}

function Section({
  n,
  icon,
  title,
  children,
}: {
  n: number;
  icon: IconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHead}>
        <IconTile name={icon} size={34} />
        <Text style={styles.h3}>{title}</Text>
        <Text style={styles.sectionN}>{n}/3</Text>
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  step: { alignItems: 'center', gap: 5 },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.lineSoft,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  stepN: { fontSize: 12, fontWeight: '800', color: colors.inkMuted },
  stepLabel: { fontSize: 11.5, fontWeight: '700', color: colors.inkMuted },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.line, marginHorizontal: 8, marginBottom: 18 },
  section: { padding: 16, marginBottom: 14 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  h3: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.ink },
  sectionN: { fontSize: 11.5, fontWeight: '700', color: colors.inkFaint },
  payment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.forest,
    backgroundColor: colors.brandSoft,
    marginBottom: 14,
  },
  payT: { fontSize: 14.5, fontWeight: '800', color: colors.ink },
  payS: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.forest },
  couponRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  couponMsgRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 },
  couponMsg: { fontSize: 12.5, color: colors.inkMuted, fontWeight: '600' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  itemImg: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  itemName: { fontSize: 13.5, fontWeight: '600', color: colors.ink },
  itemQty: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  bill: {
    marginTop: 10,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  lineName: { fontSize: 13.5, color: colors.inkMuted, flex: 1, marginRight: 10 },
  lineVal: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  totalLine: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderStyle: 'dashed',
  },
  totalLabel: { fontSize: 16, fontWeight: '800', color: colors.ink },
  totalVal: { fontSize: 18, fontWeight: '800', color: colors.forest },
  secure: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  secureText: { fontSize: 11.5, color: colors.inkMuted, fontWeight: '600' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadows.float,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
  },
  footLabel: { fontSize: 11.5, color: colors.inkMuted, fontWeight: '600' },
  footVal: { fontSize: 21, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
});
