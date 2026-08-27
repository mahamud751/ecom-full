/** Product list with sort + load-more. */
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { ErrorView, Loading } from '../components/ui';
import { colors, radii } from '../theme';
import type { ProductCard as ProductCardType } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootParamList, 'Products'>;

const SORTS = [
  { key: 'popular', label: 'Popular' },
  { key: 'price-asc', label: 'Price ↑' },
  { key: 'price-desc', label: 'Price ↓' },
  { key: 'newest', label: 'Newest' },
];

export function ProductsScreen({ navigation, route }: Props) {
  const { category, hub, section, title } = route.params ?? {};
  const [items, setItems] = useState<ProductCardType[]>([]);
  const [page, setPage] = useState(1);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState('popular');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number, s: string, append: boolean) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError(null);
        const res = await http.get('/products', {
          params: {
            page: p,
            perPage: 20,
            sort: s,
            ...(category ? { category } : {}),
            ...(hub ? { hub } : {}),
            ...(section ? { section } : {}),
          },
        });
        const next: ProductCardType[] = res.data.products ?? [];
        setItems(prev => (append ? [...prev, ...next] : next));
        setDone(next.length < 20);
        setPage(p);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, hub, section],
  );

  useEffect(() => {
    void load(1, sort, false);
  }, [load, sort]);

  return (
    <View style={styles.root}>
      <ScrollViewRow sorts={SORTS} active={sort} onPick={setSort} />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorView message={error} onRetry={() => void load(1, sort, false)} />
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 40 }}
          columnWrapperStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              width="48.5%"
              onPress={() =>
                navigation.navigate('ProductDetail', { slug: item.slug })
              }
            />
          )}
          onEndReached={() => {
            if (!done && !loadingMore) void load(page + 1, sort, true);
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <Loading /> : undefined}
          ListEmptyComponent={
            <Loading label={title ? 'No products found' : 'Loading…'} />
          }
        />
      )}
    </View>
  );
}

function ScrollViewRow({
  sorts,
  active,
  onPick,
}: {
  sorts: { key: string; label: string }[];
  active: string;
  onPick: (k: string) => void;
}) {
  return (
    <View style={styles.sortRow}>
      {sorts.map(s => (
        <Pressable
          key={s.key}
          onPress={() => onPick(s.key)}
          style={[styles.sortChip, active === s.key && styles.sortChipActive]}
        >
          <Text
            style={[
              styles.sortText,
              active === s.key && { color: colors.white },
            ]}
          >
            {s.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  sortChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  sortChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  sortText: { fontSize: 12.5, fontWeight: '600', color: colors.inkMuted },
});
