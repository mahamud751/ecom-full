/** Checkout — delivery details, coupon, COD place order. */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { http, apiErrorMessage } from '../api/client';
import { Button, Card, EmptyView, Field } from '../components/ui';
import { useAuth } from '../store/auth';
import { useCart } from '../store/cart';
import { colors, formatPrice } from '../theme';
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
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 14, paddingBottom: 40 + insets.bottom }}
    >
      <Card style={{ padding: 14, marginBottom: 12 }}>
        <Text style={styles.h3}>Delivery details</Text>
        <Field
          label="Full name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
        />
        <Field
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="01XXXXXXXXX"
          keyboardType="phone-pad"
        />
        <Field
          label="Email (optional)"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
        />
        <Field
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="House, road, block"
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="City" value={city} onChangeText={setCity} />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Area"
              value={area}
              onChangeText={setArea}
              placeholder="e.g. Dhanmondi"
            />
          </View>
        </View>
        <Field
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Landmark, delivery time…"
        />
      </Card>

      <Card style={{ padding: 14, marginBottom: 12 }}>
        <Text style={styles.h3}>Coupon</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field
              value={coupon}
              onChangeText={setCoupon}
              placeholder="Coupon code"
              autoCapitalize="characters"
            />
          </View>
          <Button
            label="Apply"
            variant="outline"
            onPress={() => void applyCoupon()}
            style={{ marginTop: 0 }}
          />
        </View>
        {couponMsg ? <Text style={styles.couponMsg}>{couponMsg}</Text> : null}
      </Card>

      <Card style={{ padding: 14, marginBottom: 16 }}>
        <Text style={styles.h3}>Order summary</Text>
        {items.map(i => (
          <View key={`${i.productId}:${i.variantId ?? ''}`} style={styles.line}>
            <Text style={styles.lineName} numberOfLines={1}>
              {i.name} × {i.qty}
            </Text>
            <Text style={styles.lineVal}>{formatPrice(i.price * i.qty)}</Text>
          </View>
        ))}
        <View style={styles.line}>
          <Text style={styles.lineName}>Subtotal</Text>
          <Text style={styles.lineVal}>{formatPrice(subtotal)}</Text>
        </View>
        {discount > 0 ? (
          <View style={styles.line}>
            <Text style={[styles.lineName, { color: colors.lime }]}>
              Coupon discount
            </Text>
            <Text style={[styles.lineVal, { color: colors.lime }]}>
              −{formatPrice(discount)}
            </Text>
          </View>
        ) : null}
        <View style={styles.line}>
          <Text style={styles.lineName}>Delivery</Text>
          <Text style={styles.lineVal}>{formatPrice(DELIVERY_FEE)}</Text>
        </View>
        <View
          style={[
            styles.line,
            {
              marginTop: 6,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: colors.line,
            },
          ]}
        >
          <Text style={styles.totalLabel}>Total (COD)</Text>
          <Text style={styles.totalVal}>{formatPrice(total)}</Text>
        </View>
      </Card>

      <Button
        label={`Place order · ${formatPrice(total)}`}
        loading={placing}
        onPress={() => void placeOrder()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  h3: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 12 },
  couponMsg: { fontSize: 12.5, color: colors.forestMid, marginTop: 2 },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  lineName: { fontSize: 13, color: colors.inkMuted, flex: 1, marginRight: 10 },
  lineVal: { fontSize: 13, fontWeight: '600', color: colors.ink },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  totalVal: { fontSize: 17, fontWeight: '800', color: colors.forest },
});
