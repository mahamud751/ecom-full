/** Lab tests + packages, and the booking form. */
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import { Button, Card, ErrorView, Field, Loading } from '../components/ui';
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
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text style={styles.h2}>Lab tests at home</Text>
      <Text style={styles.sub}>
        Free home sample collection · reports in 20–24h
      </Text>

      {packages.length > 0 ? (
        <>
          <Text style={styles.section}>Packages</Text>
          {packages.map(p => {
            const pct = discountPercent(p.price, p.comparePrice);
            return (
              <Card
                key={p.id}
                style={{ padding: 14, marginBottom: 10 }}
                onPress={() =>
                  navigation.navigate('LabBook', {
                    packageId: p.id,
                    name: p.name,
                  })
                }
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{p.name}</Text>
                    {p.description ? (
                      <Text style={styles.desc}>{p.description}</Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.price}>{formatPrice(p.price)}</Text>
                    {p.comparePrice && p.comparePrice > p.price ? (
                      <Text style={styles.compare}>
                        {formatPrice(p.comparePrice)}
                      </Text>
                    ) : null}
                    {pct > 0 ? <Text style={styles.pct}>-{pct}%</Text> : null}
                  </View>
                </View>
              </Card>
            );
          })}
        </>
      ) : null}

      <Text style={styles.section}>Individual tests</Text>
      {tests.map(t => {
        const pct = discountPercent(t.price, t.comparePrice);
        return (
          <Card
            key={t.id}
            style={{ padding: 14, marginBottom: 10 }}
            onPress={() =>
              navigation.navigate('LabBook', { testId: t.id, name: t.name })
            }
          >
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{t.name}</Text>
                {t.description ? (
                  <Text numberOfLines={2} style={styles.desc}>
                    {t.description}
                  </Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.price}>{formatPrice(t.price)}</Text>
                {pct > 0 ? <Text style={styles.pct}>-{pct}%</Text> : null}
              </View>
            </View>
          </Card>
        );
      })}
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
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.h2}>Book: {name}</Text>
      <Text style={styles.sub}>Home sample collection — pay on delivery.</Text>
      <Card style={{ padding: 14, marginTop: 14 }}>
        <Field label="Full name" value={custName} onChangeText={setCustName} />
        <Field
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <Field
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="House, road, block"
        />
        <Field label="City" value={city} onChangeText={setCity} />
        <Field
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Preferred time…"
        />
      </Card>
      <Button
        label="Confirm booking"
        loading={booking}
        onPress={() => void book()}
        style={{ marginTop: 14 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 13, color: colors.inkMuted, marginTop: 4 },
  section: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 18,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  name: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  desc: { fontSize: 12.5, color: colors.inkMuted, marginTop: 3 },
  price: { fontSize: 15, fontWeight: '800', color: colors.forest },
  compare: {
    fontSize: 12,
    color: colors.inkMuted,
    textDecorationLine: 'line-through',
  },
  pct: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.discount,
    marginTop: 2,
  },
});
