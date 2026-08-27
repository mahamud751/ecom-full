/** Order success + order tracking + my orders. */
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import {
  Badge,
  Button,
  Card,
  EmptyView,
  ErrorView,
  Field,
  Loading,
  statusLabel,
  statusTone,
} from '../components/ui';
import { useAuth } from '../store/auth';
import { colors, formatPrice, radii } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

/* ── Success ─────────────────────────────────────────────────────── */

type SuccessProps = NativeStackScreenProps<RootParamList, 'OrderSuccess'>;

export function OrderSuccessScreen({ navigation, route }: SuccessProps) {
  const { orderNumber } = route.params;
  return (
    <View style={styles.center}>
      <Text style={styles.check}>✓</Text>
      <Text style={styles.h1}>Order placed!</Text>
      <Text style={styles.sub}>
        Thanks for shopping with Ahona. Pay cash when your order arrives.
      </Text>
      {orderNumber ? (
        <Card style={{ padding: 14, marginTop: 16, alignItems: 'center' }}>
          <Text style={styles.cap}>Your order number</Text>
          <Text style={styles.orderNo}>{orderNumber}</Text>
        </Card>
      ) : null}
      <Button
        label="Track this order"
        onPress={() => navigation.replace('TrackOrder')}
        style={{ marginTop: 20, alignSelf: 'stretch' }}
      />
      <Button
        label="Continue shopping"
        variant="outline"
        onPress={() => navigation.popToTop()}
        style={{ marginTop: 10, alignSelf: 'stretch' }}
      />
    </View>
  );
}

/* ── Track ───────────────────────────────────────────────────────── */

type TrackProps = NativeStackScreenProps<RootParamList, 'TrackOrder'>;

type TrackResult = {
  orderNumber: string;
  status: string;
  customerName?: string;
  createdAt?: string;
  total?: number;
  timeline?: { status: string; at: string }[];
};

export function TrackOrderScreen({ navigation }: TrackProps) {
  const [orderNo, setOrderNo] = useState('');
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    if (!orderNo.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await http.get('/orders', {
        params: { order: orderNo.trim() },
      });
      setResult(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Order not found'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.h2}>Track your order</Text>
      <Text style={styles.sub}>
        Enter the order number from your confirmation.
      </Text>
      <Field
        label="Order number"
        value={orderNo}
        onChangeText={setOrderNo}
        placeholder="e.g. CHB-XXXXXX"
        autoCapitalize="characters"
      />
      <Button label="Track" onPress={() => void lookup()} loading={loading} />

      {error ? <Text style={styles.err}>{error}</Text> : null}
      {result ? (
        <Card style={{ padding: 16, marginTop: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={styles.orderNo}>{result.orderNumber}</Text>
            <Badge
              label={statusLabel(result.status)}
              tone={statusTone(result.status)}
            />
          </View>
          {typeof result.total === 'number' ? (
            <Text style={styles.cap}>Total: {formatPrice(result.total)}</Text>
          ) : null}
          {result.timeline?.map((t, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.dot} />
              <Text style={styles.stepText}>
                {statusLabel(t.status)}
                {t.at ? ` — ${new Date(t.at).toLocaleString()}` : ''}
              </Text>
            </View>
          ))}
          <Button
            label="Need help? Contact support"
            variant="ghost"
            onPress={() => navigation.navigate('Support')}
            style={{ marginTop: 12 }}
          />
        </Card>
      ) : null}
    </ScrollView>
  );
}

/* ── My orders ───────────────────────────────────────────────────── */

type MyOrdersProps = NativeStackScreenProps<RootParamList, 'MyOrders'>;

type MyOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
};

export function MyOrdersScreen({ navigation }: MyOrdersProps) {
  const user = useAuth(s => s.user);
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    http
      .get('/auth/orders')
      .then(res => setOrders(res.data.orders ?? []))
      .catch(err => setError(apiErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (!user) {
    return (
      <View style={{ flex: 1 }}>
        <EmptyView
          title="Sign in to see your orders"
          hint="Your order history lives in your account."
        />
        <View style={{ paddingHorizontal: 40 }}>
          <Button
            label="Login / Register"
            onPress={() => navigation.navigate('Auth')}
          />
        </View>
      </View>
    );
  }

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!orders) return <Loading />;
  if (orders.length === 0) {
    return (
      <EmptyView
        title="No orders yet"
        hint="Your placed orders will show up here."
      />
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 14 }}>
      {orders.map(o => (
        <Pressable key={o.id} onPress={() => navigation.navigate('TrackOrder')}>
          <Card style={{ padding: 14, marginBottom: 10 }}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <Text style={styles.orderNo}>{o.orderNumber}</Text>
              <Badge
                label={statusLabel(o.status)}
                tone={statusTone(o.status)}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 6,
              }}
            >
              <Text style={styles.cap}>
                {new Date(o.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.lineVal}>{formatPrice(o.total)}</Text>
            </View>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  center: {
    flex: 1,
    backgroundColor: colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  check: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.lime,
    color: colors.white,
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 72,
    overflow: 'hidden',
  },
  h1: { fontSize: 24, fontWeight: '800', color: colors.ink, marginTop: 18 },
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink },
  sub: {
    fontSize: 13.5,
    color: colors.inkMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  cap: { fontSize: 12, color: colors.inkMuted, marginTop: 6 },
  orderNo: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.forest,
    letterSpacing: 0.5,
  },
  err: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.forestMid,
  },
  stepText: { fontSize: 13, color: colors.ink },
  lineVal: { fontSize: 13, fontWeight: '700', color: colors.ink },
});
