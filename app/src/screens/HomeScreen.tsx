/** Home — banners, category grid, flash sale / featured sections, doctors. */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { http, apiErrorMessage } from '../api/client';
import { mediaUrl } from '../config';
import { BrandLogo } from '../components/Logo';
import { AppIcon } from '../components/AppIcon';
import { ProductCard } from '../components/ProductCard';
import { ErrorView, Loading, SectionHeader } from '../components/ui';
import { colors, radii } from '../theme';
import type { TabScreenProps } from '../navigation/types';
import type {
  Banner,
  Category,
  DoctorCard,
  ProductCard as ProductCardType,
} from '../types';

type HomeData = {
  banners: Banner[];
  categories: Category[];
  flashSale: ProductCardType[];
  featured: ProductCardType[];
  himalaya: ProductCardType[];
  skinoDeals: ProductCardType[];
  doctors: DoctorCard[];
};

const W = Dimensions.get('window').width;

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await http.get('/home');
      setData(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load home'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const goProduct = (slug: string) =>
    navigation.navigate('ProductDetail', { slug });

  if (error && !data) {
    return <ErrorView message={error} onRetry={() => void load()} />;
  }
  if (!data) return <Loading label="Waking up the store…" />;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.forest}
          />
        }
      >
        <View style={styles.header}>
          <BrandLogo />
          <Pressable
            onPress={() => navigation.navigate('Search')}
            style={styles.searchBtn}
          >
            <AppIcon name="search" color={colors.inkMuted} size={18} />
            <Text style={styles.searchBtnText}>Search products, doctors, labs…</Text>
          </Pressable>
        </View>

        {/* Banners */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {data.banners.map(b => (
            <Pressable
              key={b.id}
              style={styles.banner}
              onPress={() => {
                const m = b.link?.match(/\/category\/([\w-]+)/);
                if (m)
                  navigation.navigate('Products', {
                    category: m[1],
                    title: b.title,
                  });
                else navigation.navigate('Products', { title: b.title });
              }}
            >
              {b.image ? (
                <Image
                  source={{ uri: mediaUrl(b.image) }}
                  style={styles.bannerImg}
                />
              ) : (
                <View
                  style={[
                    styles.bannerImg,
                    { backgroundColor: colors.forestMid },
                  ]}
                />
              )}
              <View style={styles.bannerOverlay}>
                <Text style={styles.bannerTitle}>{b.title}</Text>
                {b.subtitle ? (
                  <Text style={styles.bannerSub}>{b.subtitle}</Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Categories */}
        <View style={styles.section}>
          <SectionHeader
            title="Shop by category"
            onSeeAll={() => navigation.navigate('Categories')}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {data.categories.slice(0, 12).map(c => (
              <Pressable
                key={c.id}
                style={styles.catChip}
                onPress={() =>
                  navigation.navigate('Products', {
                    category: c.slug,
                    title: c.name,
                  })
                }
              >
                <View style={styles.catIcon}>
                  {c.image ? (
                    <Image
                      source={{ uri: mediaUrl(c.image) }}
                      style={styles.catImage}
                    />
                  ) : (
                    <Text style={styles.catIconText}>{c.icon || '🌿'}</Text>
                  )}
                </View>
                <Text numberOfLines={1} style={styles.catName}>
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Flash sale */}
        {data.flashSale.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="⚡ Flash sale"
              onSeeAll={() =>
                navigation.navigate('Products', {
                  section: 'flashSale',
                  title: 'Flash sale',
                })
              }
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {data.flashSale.map(p => (
                <View key={p.id} style={{ marginRight: 10 }}>
                  <ProductCard
                    product={p}
                    width={(W - 64) / 2}
                    onPress={() => goProduct(p.slug)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Featured */}
        <View style={styles.section}>
          <SectionHeader
            title="Featured for you"
            onSeeAll={() =>
              navigation.navigate('Products', { title: 'All products' })
            }
          />
          <FlatList
            data={data.featured}
            numColumns={2}
            scrollEnabled={false}
            keyExtractor={i => i.id}
            contentContainerStyle={{ gap: 10 }}
            columnWrapperStyle={{ gap: 10 }}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                width={(W - 42) / 2}
                onPress={() => goProduct(item.slug)}
              />
            )}
          />
        </View>

        {/* Doctors strip */}
        {data.doctors.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="Talk to a doctor"
              onSeeAll={() => navigation.navigate('Doctors')}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {data.doctors.map(d => (
                <Pressable
                  key={d.id}
                  style={styles.docCard}
                  onPress={() =>
                    navigation.navigate('DoctorDetail', { slug: d.slug })
                  }
                >
                  {d.image ? (
                    <Image
                      source={{ uri: mediaUrl(d.image) }}
                      style={styles.docImg}
                    />
                  ) : null}
                  <Text numberOfLines={1} style={styles.docName}>
                    {d.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.docSpec}>
                    {d.specialty}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  searchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchBtnText: { color: colors.inkMuted, fontSize: 13 },
  banner: {
    width: W - 64,
    height: 150,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: colors.forest,
  },
  bannerImg: { width: '100%', height: '100%' },
  bannerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    backgroundColor: 'rgba(12,42,40,0.55)',
  },
  bannerTitle: { color: colors.white, fontSize: 17, fontWeight: '800' },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 22 },
  catChip: { alignItems: 'center', marginRight: 14, width: 72 },
  catIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  catImage: { width: 56, height: 56 },
  catIconText: { fontSize: 24 },
  catName: {
    fontSize: 11.5,
    color: colors.ink,
    marginTop: 6,
    textAlign: 'center',
  },
  docCard: {
    width: 130,
    marginRight: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  docImg: { width: '100%', height: 110 },
  docName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.ink,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  docSpec: {
    fontSize: 11,
    color: colors.inkMuted,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
});
