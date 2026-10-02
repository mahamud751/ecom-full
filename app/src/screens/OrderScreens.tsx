/** Order success + order tracking + my orders. */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { http, apiErrorMessage } from '../api/client';
import { AppIcon } from '../components/AppIcon';
import {
  Badge,
  Button,
  Card,
  EmptyView,
  ErrorView,
  Field,
  Gradient,
  IconTile,
  Loading,
  statusLabel,
  statusTone,
} from '../components/ui';
import { useAuth } from '../store/auth';
import { colors, formatPrice, gradients, radii } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

/* ── Success ─────────────────────────────────────────────────────── */

type SuccessProps = NativeStackScreenProps<RootParamList, 'OrderSuccess'>;

export function OrderSuccessScreen({ navigation, route }: SuccessProps) {
  const { orderNumber } = route.params;
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.success, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
      <Gradient from={gradients.mint[0]} to={gradients.mint[1]} angle="vertical" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.halo2}>
          <View style={styles.halo1}>
            <View style={styles.checkCircle}>
              <Gradient from={gradients.forestSoft[0]} to={gradients.forest[1]} />
              <AppIcon name="check" color={colors.white} size={46} strokeWidth={3} />
            </View>
          </View>
        </View>
        <Text style={styles.h1}>Order placed!</Text>
        <Text style={styles.sub}>
          Thanks for shopping with Ahona. A pharmacist is reviewing your order —
          pay cash when it arrives.
        </Text>
        {orderNumber ? (
          <View style={styles.ticket}>
            <Text style={styles.cap}>ORDER NUMBER</Text>
            <Text style={styles.ticketNo}>{orderNumber}</Text>
            <View style={styles.ticketRow}>
              {[
                { icon: 'shield' as const, t: 'Verified' },
                { icon: 'truck' as const, t: '12–24h' },
                { icon: 'wallet' as const, t: 'COD' },
              ].map(x => (
                <View key={x.t} style={styles.ticketItem}>
                  <AppIcon name={x.icon} color={colors.forestMid} size={16} />
                  <Text style={styles.ticketItemText}>{x.t}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
      <Button
        label="Track this order"
        icon="truck"
        size="lg"
        onPress={() => navigation.replace('TrackOrder')}
        style={{ alignSelf: 'stretch' }}
      />
      <Button
        label="Continue shopping"
        variant="ghost"
        onPress={() => navigation.popToTop()}
        style={{ marginTop: 8, alignSelf: 'stretch' }}
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

  const timeline = result?.timeline ?? [];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.trackHero}>
        <IconTile name="truck" size={52} color={colors.goldDeep} bg={colors.goldSoft} />
        <View style={{ flex: 1 }}>
          <Text style={styles.h2}>Track your order</Text>
          <Text style={styles.subLeft}>Enter the number from your confirmation.</Text>
        </View>
      </View>
      <Card style={{ padding: 16 }}>
        <Field
          label="Order number"
          icon="box"
          value={orderNo}
          onChangeText={setOrderNo}
          placeholder="e.g. CHB-XXXXXX"
          autoCapitalize="characters"
          returnKeyType="search"
          onSubmitEditing={() => void lookup()}
        />
        <Button label="Track order" icon="search" onPress={() => void lookup()} loading={loading} />
      </Card>

      {error ? (
        <View style={styles.errBox}>
          <AppIcon name="info" color={colors.danger} size={18} />
          <Text style={styles.err}>{error}</Text>
        </View>
      ) : null}

      {result ? (
        <Card style={{ padding: 18, marginTop: 16 }}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cap}>ORDER</Text>
              <Text style={styles.orderNo}>{result.orderNumber}</Text>
            </View>
            <Badge label={statusLabel(result.status)} tone={statusTone(result.status)} dot />
          </View>
          {typeof result.total === 'number' ? (
            <View style={styles.totalPill}>
              <Text style={styles.totalPillLabel}>Total</Text>
              <Text style={styles.totalPillVal}>{formatPrice(result.total)}</Text>
            </View>
          ) : null}
          <View style={{ marginTop: 16 }}>
            {timeline.map((t, i) => {
              const last = i === timeline.length - 1;
              return (
                <View key={i} style={styles.tlRow}>
                  <View style={styles.tlRail}>
                    <View style={[styles.tlDot, last && styles.tlDotNow]}>
                      {last ? null : (
                        <AppIcon name="check" color={colors.white} size={10} strokeWidth={3} />
                      )}
                    </View>
                    {!last ? <View style={styles.tlLine} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: last ? 0 : 18 }}>
                    <Text style={[styles.tlStatus, last && { color: colors.forest }]}>
                      {statusLabel(t.status)}
                    </Text>
                    {t.at ? (
                      <Text style={styles.tlAt}>{new Date(t.at).toLocaleString()}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
          <Button
            label="Need help? Contact support"
            icon="chat"
            variant="soft"
            size="sm"
            onPress={() => navigation.navigate('Support')}
            style={{ marginTop: 18 }}
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
    setError(null);
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
      <View style={[styles.root, { justifyContent: 'center' }]}>
        <EmptyView
          icon="box"
          title="Sign in to see your orders"
          hint="Your order history lives in your account."
          action={{ label: 'Login / Register', onPress: () => navigation.navigate('Auth') }}
        />
      </View>
    );
  }

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!orders) return <Loading />;
  if (orders.length === 0) {
    return (
      <View style={[styles.root, { justifyContent: 'center' }]}>
        <EmptyView
          icon="box"
          title="No orders yet"
          hint="Your placed orders will show up here."
          action={{ label: 'Start shopping', onPress: () => navigation.popToTop() }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {orders.map(o => (
        <Card
          key={o.id}
          onPress={() => navigation.navigate('TrackOrder')}
          style={styles.orderCard}
        >
          <IconTile name="box" size={46} />
          <View style={{ flex: 1 }}>
            <Text style={styles.orderNoSm}>{o.orderNumber}</Text>
            <Text style={styles.orderDate}>
              {new Date(o.createdAt).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text style={styles.lineVal}>{formatPrice(o.total)}</Text>
            <Badge label={statusLabel(o.status)} tone={statusTone(o.status)} />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  success: { flex: 1, paddingHorizontal: 24, alignItems: 'center' },
  halo2: {
    padding: 18,
    borderRadius: 100,
    backgroundColor: 'rgba(21,80,74,0.06)',
  },
  halo1: {
    padding: 14,
    borderRadius: 80,
    backgroundColor: 'rgba(21,80,74,0.1)',
  },
  checkCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: { fontSize: 28, fontWeight: '800', color: colors.ink, marginTop: 26, letterSpacing: -0.6 },
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  sub: {
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  subLeft: { fontSize: 13, color: colors.inkMuted, marginTop: 3 },
  ticket: {
    alignSelf: 'stretch',
    marginTop: 28,
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderStyle: 'dashed',
  },
  ticketNo: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.forest,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  ticketRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  ticketItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ticketItemText: { fontSize: 12, fontWeight: '700', color: colors.inkSoft },
  cap: { fontSize: 11, color: colors.inkMuted, fontWeight: '700', letterSpacing: 1 },
  trackHero: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNo: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  totalPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  totalPillLabel: { fontSize: 13, color: colors.inkMuted },
  totalPillVal: { fontSize: 14, fontWeight: '800', color: colors.ink },
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.dangerSoft,
  },
  err: { flex: 1, color: colors.danger, fontSize: 13, fontWeight: '600' },
  tlRow: { flexDirection: 'row', gap: 12 },
  tlRail: { alignItems: 'center', width: 20 },
  tlDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.forestMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlDotNow: {
    backgroundColor: colors.surface,
    borderWidth: 5,
    borderColor: colors.gold,
  },
  tlLine: { flex: 1, width: 2, backgroundColor: colors.brandLight, marginVertical: 2 },
  tlStatus: { fontSize: 14, fontWeight: '700', color: colors.ink },
  tlAt: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    marginBottom: 12,
  },
  orderNoSm: { fontSize: 15, fontWeight: '800', color: colors.ink, letterSpacing: 0.3 },
  orderDate: { fontSize: 12, color: colors.inkMuted, marginTop: 3 },
  lineVal: { fontSize: 15, fontWeight: '800', color: colors.ink },
});
