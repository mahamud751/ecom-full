/** Categories browser (hubs + categories). */
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import { thumbUrl } from '../config';
import { type IconName } from '../components/AppIcon';
import { ErrorView, IconTile, Loading, SmartImage } from '../components/ui';
import { colors, radii, shadows } from '../theme';
import type { Category } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootParamList, 'Categories'>;

const HUBS: { key: string; label: string; sub: string; icon: IconName; tint: string; fg: string }[] = [
  { key: 'pharmacy', label: 'Pharmacy', sub: 'Medicines & OTC', icon: 'pill', tint: colors.brandLight, fg: colors.forest },
  { key: 'beauty', label: 'Beauty', sub: 'Skin, hair & makeup', icon: 'sparkle', tint: '#fbe9ef', fg: '#b23a62' },
  { key: 'wellness', label: 'Wellness', sub: 'Herbal & nutrition', icon: 'leaf', tint: colors.goldSoft, fg: colors.goldDeep },
  { key: 'baby', label: 'Mom & Baby', sub: 'Care for little ones', icon: 'baby', tint: '#eef0fb', fg: '#4452a8' },
];

const TINTS = ['#e4f1ee', '#fbeee6', '#eef0fb', '#f7efd6', '#fbe9ef', '#e8f4e4'];

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
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.h2}>Shop by hub</Text>
      <View style={styles.hubRow}>
        {HUBS.map(h => (
          <Pressable
            key={h.key}
            style={({ pressed }) => [styles.hub, pressed && { transform: [{ scale: 0.97 }] }]}
            onPress={() =>
              navigation.navigate('Products', { hub: h.key, title: h.label })
            }
          >
            <IconTile name={h.icon} size={46} color={h.fg} bg={h.tint} />
            <Text style={styles.hubLabel}>{h.label}</Text>
            <Text style={styles.hubSub}>{h.sub}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.h2, { marginTop: 28 }]}>All categories</Text>
      <View style={styles.grid}>
        {cats.map((c, i) => (
          <Pressable
            key={c.id}
            style={({ pressed }) => [styles.cat, pressed && { opacity: 0.8 }]}
            onPress={() =>
              navigation.navigate('Products', {
                category: c.slug,
                title: c.name,
              })
            }
          >
            <View style={[styles.catIconWrap, { backgroundColor: TINTS[i % TINTS.length] }]}>
              <SmartImage
                uri={c.image ? thumbUrl(c.image, 68) : null}
                style={styles.catImage}
                icon="leaf"
                iconSize={26}
              />
            </View>
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
  h2: { fontSize: 19, fontWeight: '800', color: colors.ink, marginBottom: 14, letterSpacing: -0.3 },
  hubRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  hub: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 16,
    ...shadows.card,
  },
  hubLabel: { marginTop: 12, fontWeight: '800', color: colors.ink, fontSize: 15 },
  hubSub: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 18 },
  cat: { width: '25%', alignItems: 'center' },
  catIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  catImage: { width: 68, height: 68 },
  catName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.inkSoft,
    marginTop: 7,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});
