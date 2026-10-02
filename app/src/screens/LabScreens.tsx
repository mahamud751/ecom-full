/** Lab tests + packages, and the booking form. */
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import { AppIcon } from '../components/AppIcon';
import { Badge, Button, Card, ErrorView, Field, Gradient, IconTile, Loading } from '../components/ui';
import { useAuth } from '../store/auth';
import { colors, discountPercent, formatPrice, radii } from '../theme';
import type { LabPackage, LabTest } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

/* ── Lab list ────────────────────────────────────────────────────── */

type LabProps = NativeStackScreenProps<RootParamList, 'Lab'>;

export function LabScreen({ navigation }: LabProps) {
  const [tests, setTests] = useState<LabTest[] | null>(null);
  const [packages, setPackages] = useState<LabPackage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    http
      .get('/lab')
      .then(res => {
        setTests(res.data.tests ?? []);
        setPackages(res.data.packages ?? []);
      })
      .catch(err => setError(apiErrorMessage(err)));

  useEffect(() => {
    void load();
  }, []);

  if (error) return <ErrorView message={error} onRetry={() => void load()} />;
  if (!tests) return <Loading />;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Gradient from="#c5537c" to="#6d1f3d" />
        <View style={styles.heroGlow} />
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Lab tests at home</Text>
          <Text style={styles.heroSub}>Sample collected from your home</Text>
          <View style={styles.heroPerks}>
            {['Home collection', 'Digital reports'].map(t => (
              <View key={t} style={styles.heroPerk}>
                <AppIcon name="check" color={colors.white} size={12} strokeWidth={3} />
                <Text style={styles.heroPerkText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.heroIcon}>
          <AppIcon name="flask" color={colors.white} size={38} strokeWidth={1.6} />
        </View>
      </View>

      {packages.length > 0 ? (
        <>
          <Text style={styles.section}>Health packages</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 8 }}
          >
            {packages.map((p, i) => {
              const pct = discountPercent(p.price, p.comparePrice);
              return (
                <Card
                  key={p.id}
                  style={styles.pkg}
                  onPress={() => navigation.navigate('LabBook', { packageId: p.id, name: p.name })}
                >
                  <View style={styles.pkgTop}>
                    <IconTile
                      name="shield"
                      size={40}
                      color={i % 2 ? colors.goldDeep : '#b23a62'}
                      bg={i % 2 ? colors.goldSoft : '#fbe9ef'}
                    />
                    {pct > 0 ? <Badge label={`${pct}% OFF`} tone="red" /> : null}
                  </View>
                  <Text style={styles.name} numberOfLines={2}>
                    {p.name}
                  </Text>
                  {p.tests?.length ? (
                    <Text style={styles.desc}>{p.tests.length} tests included</Text>
                  ) : p.description ? (
                    <Text style={styles.desc} numberOfLines={2}>
                      {p.description}
                    </Text>
                  ) : null}
                  {p.reportHours ? (
                    <View style={styles.meta}>
                      <AppIcon name="clock" color={colors.inkMuted} size={13} />
                      <Text style={styles.metaText}>Report in {p.reportHours}h</Text>
                    </View>
                  ) : null}
                  <View style={styles.pkgFoot}>
                    <View>
                      <Text style={styles.price}>{formatPrice(p.price)}</Text>
                      {p.comparePrice && p.comparePrice > p.price ? (
                        <Text style={styles.compare}>{formatPrice(p.comparePrice)}</Text>
                      ) : null}
                    </View>
                    <View style={styles.bookBtn}>
                      <Text style={styles.bookText}>Book</Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      <Text style={styles.section}>Individual tests</Text>
      <View style={{ paddingHorizontal: 16 }}>
        {tests.map(t => {
          const pct = discountPercent(t.price, t.comparePrice);
          return (
            <Card
              key={t.id}
              style={styles.test}
              onPress={() => navigation.navigate('LabBook', { testId: t.id, name: t.name })}
            >
              <IconTile name="flask" size={42} color="#b23a62" bg="#fbe9ef" />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{t.name}</Text>
                {t.description ? (
                  <Text numberOfLines={1} style={styles.desc}>
                    {t.description}
                  </Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.price}>{formatPrice(t.price)}</Text>
                {pct > 0 ? <Text style={styles.pct}>{pct}% off</Text> : null}
              </View>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}

/* ── Lab book ────────────────────────────────────────────────────── */

type BookProps = NativeStackScreenProps<RootParamList, 'LabBook'>;

export function LabBookScreen({ navigation, route }: BookProps) {
  const { testId, packageId, name } = route.params;
  const user = useAuth(s => s.user);
  const [custName, setCustName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);

  async function book() {
    if (!custName.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Missing details', 'Name, phone and address are required.');
      return;
    }
    setBooking(true);
    try {
      const res = await http.post('/lab', {
        customerName: custName.trim(),
        customerPhone: phone.trim(),
        address: address.trim(),
        city,
        labTestId: testId,
        labPackageId: packageId,
        notes: notes.trim() || undefined,
      });
      const bookingData = res.data.booking ?? res.data;
      Alert.alert(
        'Booking confirmed',
        `Your sample collection for “${name}” is booked${
          bookingData.bookingNumber ? ` (${bookingData.bookingNumber})` : ''
        }. Our team will call you to confirm.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert('Booking failed', apiErrorMessage(err));
    } finally {
      setBooking(false);
    }
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.bookHead}>
        <IconTile name="flask" size={50} color="#b23a62" bg="#fbe9ef" />
        <View style={{ flex: 1 }}>
          <Text style={styles.h2}>{name}</Text>
          <Text style={styles.sub}>Home sample collection · pay on delivery</Text>
        </View>
      </View>
      <Card style={{ padding: 16 }}>
        <Field label="Full name" icon="user" value={custName} onChangeText={setCustName} />
        <Field label="Phone" icon="phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Address" icon="pin" value={address} onChangeText={setAddress} placeholder="House, road, block" />
        <Field label="City" icon="hospital" value={city} onChangeText={setCity} />
        <Field label="Notes (optional)" icon="clock" value={notes} onChangeText={setNotes} placeholder="Preferred time…" />
      </Card>
      <Button
        label="Confirm booking"
        icon="check"
        size="lg"
        loading={booking}
        onPress={() => void book()}
        style={{ marginTop: 16 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  hero: {
    margin: 16,
    marginBottom: 4,
    borderRadius: radii.xl,
    overflow: 'hidden',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    right: -60,
    top: -70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroTitle: { color: colors.white, fontSize: 21, fontWeight: '800', letterSpacing: -0.3 },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  heroPerks: { flexDirection: 'row', gap: 12, marginTop: 14 },
  heroPerk: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroPerkText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  heroIcon: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  h2: { fontSize: 19, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: colors.inkMuted, marginTop: 3 },
  section: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 16,
    letterSpacing: -0.3,
  },
  pkg: { width: 230, padding: 16 },
  pkgTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  pkgFoot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 14,
  },
  bookBtn: {
    backgroundColor: colors.forest,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bookText: { color: colors.white, fontSize: 12.5, fontWeight: '800' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  metaText: { fontSize: 12, color: colors.inkMuted },
  test: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 10 },
  bookHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  name: { fontSize: 14.5, fontWeight: '800', color: colors.ink },
  desc: { fontSize: 12.5, color: colors.inkMuted, marginTop: 3 },
  price: { fontSize: 16, fontWeight: '800', color: colors.ink },
  compare: {
    fontSize: 12,
    color: colors.inkFaint,
    textDecorationLine: 'line-through',
  },
  pct: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.discount,
    marginTop: 2,
  },
});
