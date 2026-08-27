/** Doctors tab — list with specialty filter. */
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { http, apiErrorMessage } from '../api/client';
import { mediaUrl } from '../config';
import { Badge, ErrorView, Loading } from '../components/ui';
import { colors, formatPrice, radii, shadows } from '../theme';
import type { DoctorCard } from '../types';
import type { TabScreenProps } from '../navigation/types';

const SPECIALTIES = [
  'All',
  'Medicine',
  'Gynecologist',
  'Dermatologist',
  'Pediatrician',
  'Psychiatrist',
  'Nutritionist',
];

export function DoctorsScreen({ navigation }: TabScreenProps<'Doctors'>) {
  const [doctors, setDoctors] = useState<DoctorCard[] | null>(null);
  const [spec, setSpec] = useState('All');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    http
      .get('/doctors', { params: spec === 'All' ? {} : { specialty: spec } })
      .then(res => setDoctors(res.data.doctors ?? []))
      .catch(err => setError(apiErrorMessage(err)));
  }, [spec]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <Text style={styles.title}>Consult a doctor</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 10 }}
      >
        {SPECIALTIES.map(s => (
          <Pressable
            key={s}
            onPress={() => setSpec(s)}
            style={[styles.chip, spec === s && styles.chipActive]}
          >
            <Text
              style={[styles.chipText, spec === s && { color: colors.white }]}
            >
              {s}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {error ? (
        <ErrorView message={error} onRetry={load} />
      ) : !doctors ? (
        <Loading />
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={d => d.id}
          contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate('DoctorDetail', { slug: item.slug })
              }
            >
              {item.image ? (
                <Image
                  source={{ uri: mediaUrl(item.image) }}
                  style={styles.img}
                />
              ) : (
                <View
                  style={[styles.img, { backgroundColor: colors.brandSoft }]}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.spec}>
                  {item.specialty}
                  {item.designation ? ` · ${item.designation}` : ''}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.rating}>
                    ★{' '}
                    {typeof item.rating === 'number'
                      ? item.rating.toFixed(1)
                      : '4.8'}
                  </Text>
                  {item.patients ? (
                    <Text style={styles.patients}>
                      {item.patients} patients
                    </Text>
                  ) : null}
                  {item.availableNow ? (
                    <Badge label="Available now" tone="green" />
                  ) : null}
                </View>
              </View>
              <Text style={styles.fee}>{formatPrice(item.fee)}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <ErrorView message="No doctors found" onRetry={load} />
          }
        />
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
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.inkMuted },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    ...shadows.card,
  },
  img: { width: 72, height: 82, borderRadius: 12 },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink },
  spec: { fontSize: 12.5, color: colors.inkMuted, marginTop: 2 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  rating: { fontSize: 12, color: colors.goldDeep, fontWeight: '700' },
  patients: { fontSize: 11.5, color: colors.inkMuted },
  fee: { fontSize: 15, fontWeight: '800', color: colors.forest },
});
