/** Categories browser (hubs + categories). */
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import { ErrorView, Loading } from '../components/ui';
import { colors, radii } from '../theme';
import type { Category } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootParamList, 'Categories'>;

const HUBS = [
  { key: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { key: 'beauty', label: 'Beauty', icon: '✨' },
  { key: 'wellness', label: 'Wellness', icon: '🌿' },
  { key: 'baby', label: 'Mom & Baby', icon: '🍼' },
];

export function CategoriesScreen({ navigation }: Props) {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    http
      .get('/categories')
      .then(res => setCats(res.data.categories ?? res.data ?? []))
      .catch(err => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorView message={error} />;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text style={styles.h2}>Shop by hub</Text>
      <View style={styles.hubRow}>
        {HUBS.map(h => (
          <Pressable
            key={h.key}
            style={styles.hub}
            onPress={() =>
              navigation.navigate('Products', { hub: h.key, title: h.label })
            }
          >
            <Text style={styles.hubIcon}>{h.icon}</Text>
            <Text style={styles.hubLabel}>{h.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.h2, { marginTop: 24 }]}>All categories</Text>
      <View style={styles.grid}>
        {cats.map(c => (
          <Pressable
            key={c.id}
            style={styles.cat}
            onPress={() =>
              navigation.navigate('Products', {
                category: c.slug,
                title: c.name,
              })
            }
          >
            <Text style={styles.catIcon}>{c.icon || '🌿'}</Text>
            <Text numberOfLines={2} style={styles.catName}>
              {c.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  h2: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 12 },
  hubRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hub: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    alignItems: 'center',
  },
  hubIcon: { fontSize: 28 },
  hubLabel: {
    marginTop: 8,
    fontWeight: '700',
    color: colors.forest,
    fontSize: 13,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cat: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    alignItems: 'center',
  },
  catIcon: { fontSize: 22 },
  catName: {
    fontSize: 11.5,
    color: colors.ink,
    marginTop: 6,
    textAlign: 'center',
  },
});
