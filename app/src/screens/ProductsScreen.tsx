/** Product list with sort + load-more. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { AppIcon } from '../components/AppIcon';
import { Chip, EmptyView, ErrorView, Loading } from '../components/ui';
import { colors } from '../theme';
import type { ProductCard as ProductCardType } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootParamList, 'Products'>;

const SORTS = [
  { key: 'popular', label: 'Popular' },
  { key: 'price-asc', label: 'Price: low' },
  { key: 'price-desc', label: 'Price: high' },
  { key: 'newest', label: 'Newest' },
];

export function ProductsScreen({ navigation, route }: Props) {
  const { category, hub, section } = route.params ?? {};
  const [items, setItems] = useState<ProductCardType[]>([]);
  const [page, setPage] = useState(1);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState('popular');
  const [error, setError] = useState<string | null>(null);
  // Latest request wins: a slow page for an old sort must not land in the list.
  const reqId = useRef(0);
  // onEndReached can fire again before the loadingMore state re-renders.
  const fetchingMore = useRef(false);

  const load = useCallback(
    async (p: number, s: string, append: boolean) => {
      if (append && fetchingMore.current) return;
      const id = ++reqId.current;
      try {
        if (append) {
          fetchingMore.current = true;
          setLoadingMore(true);
        } else setLoading(true);
        setError(null);
        const res = await http.get('/products', {
          params: {
            page: p,
            perPage: 20,
            sort: s,
            lite: 1,
            ...(category ? { category } : {}),
            ...(hub ? { hub } : {}),
            ...(section ? { section } : {}),
          },
        });
        if (id !== reqId.current) return;
        const next: ProductCardType[] = res.data.products ?? [];
        setItems(prev => {
          if (!append) return next;
          const seen = new Set(prev.map(x => x.id));
          return [...prev, ...next.filter(x => !seen.has(x.id))];
        });
        // hasMore comes from lite mode; older servers only return the page.
        setDone(!(res.data.hasMore ?? next.length === 20));
        setPage(p);
      } catch (err) {
        if (id === reqId.current) setError(apiErrorMessage(err));
      } finally {
        if (append) fetchingMore.current = false;
        if (id === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 40 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              width="48.3%"
              onPress={() =>
                navigation.navigate('ProductDetail', { slug: item.slug })
              }
            />
          )}
          onEndReached={() => {
            if (!done && !loadingMore) void load(page + 1, sort, true);
          }}
          onEndReachedThreshold={0.4}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          ListFooterComponent={loadingMore ? <Loading /> : undefined}
          ListEmptyComponent={
            <EmptyView
              icon="search"
              title="No products found"
              hint="Try another category or sort order."
            />
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
    <View style={styles.sortBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortRow}
      >
        <View style={styles.sortIcon}>
          <AppIcon name="sort" color={colors.forest} size={16} />
        </View>
        {sorts.map(s => (
          <Chip
            key={s.key}
            label={s.label}
            active={active === s.key}
            onPress={() => onPick(s.key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  sortBar: { backgroundColor: colors.ivory },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  sortIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
