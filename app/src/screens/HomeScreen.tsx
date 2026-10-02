/** Home — hero + search, quick services, banners, categories, product rails, doctors. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { http, apiErrorMessage } from '../api/client';
import { mediaUrl } from '../config';
import { AhonaMark } from '../components/Logo';
import { AppIcon, type IconName } from '../components/AppIcon';
import { ProductCard } from '../components/ProductCard';
import {
  ErrorView,
  Gradient,
  IconButton,
  Loading,
  SectionHeader,
  SmartImage,
} from '../components/ui';
import { useAuth } from '../store/auth';
import { useWishlist } from '../store/wishlist';
import { colors, formatPrice, gradients, radii, shadows } from '../theme';
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
  beautyPicks?: ProductCardType[];
  foodPicks?: ProductCardType[];
  doctors: DoctorCard[];
};

const W = Dimensions.get('window').width;
const BANNER_W = W - 32;
const RAIL_W = (W - 56) / 2.15;
const GRID_W = (W - 44) / 2;

const CATEGORY_TINTS = ['#e4f1ee', '#fbeee6', '#eef0fb', '#f7efd6', '#fbe9ef', '#e8f4e4'];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const insets = useSafeAreaInsets();
  const user = useAuth(s => s.user);
  const wishCount = useWishlist(s => s.ids.length);
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [slide, setSlide] = useState(0);
  // Once the dark hero scrolls away, show an ivory status-bar scrim + dark icons.
  const [solidTop, setSolidTop] = useState(false);
  const solidRef = useRef(false);
  solidRef.current = solidTop;

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

  // Hero is dark: light status-bar text while Home is focused, dark elsewhere.
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(solidRef.current ? 'dark-content' : 'light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, []),
  );

  const goProduct = (slug: string) =>
    navigation.navigate('ProductDetail', { slug });

  const onBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (BANNER_W + 12));
    if (i !== slide) setSlide(i);
  };

  if (error && !data) {
    return <ErrorView message={error} onRetry={() => void load()} />;
  }
  if (!data) return <Loading label="Waking up the store…" />;

  const firstName = user?.name?.split(' ')[0];

  const services: { icon: IconName; label: string; sub: string; onPress: () => void; tint: string; fg: string }[] = [
    {
      icon: 'pill',
      label: 'Medicines',
      sub: 'Genuine only',
      tint: colors.brandLight,
      fg: colors.forest,
      onPress: () => navigation.navigate('Products', { category: 'medicine', title: 'Medicine' }),
    },
    {
      icon: 'file',
      label: 'My Rx',
      sub: 'From your consult',
      tint: colors.goldSoft,
      fg: colors.goldDeep,
      onPress: () => navigation.navigate('PrescriptionRequest'),
    },
    {
      icon: 'stethoscope',
      label: 'Doctors',
      sub: 'Video consult',
      tint: '#eef0fb',
      fg: '#4452a8',
      onPress: () => navigation.navigate('Doctors'),
    },
    {
      icon: 'flask',
      label: 'Lab tests',
      sub: 'Home sample',
      tint: '#fbe9ef',
      fg: '#b23a62',
      onPress: () => navigation.navigate('Lab'),
    },
  ];

  const rail = (
    title: string,
    items: ProductCardType[] | undefined,
    opts: { subtitle?: string; icon?: IconName; section?: string; category?: string },
  ) =>
    items && items.length > 0 ? (
      <View style={styles.section}>
        <SectionHeader
          title={title}
          subtitle={opts.subtitle}
          icon={opts.icon}
          onSeeAll={() =>
            navigation.navigate('Products', {
              section: opts.section,
              category: opts.category,
              title,
            })
          }
          style={{ paddingHorizontal: 16 }}
        />
        <FlatList
          horizontal
          data={items}
          keyExtractor={p => p.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 6 }}
          renderItem={({ item }) => (
            <ProductCard product={item} width={RAIL_W} onPress={() => goProduct(item.slug)} />
          )}
        />
      </View>
    ) : null;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={64}
        onScroll={e => {
          const solid = e.nativeEvent.contentOffset.y > 220;
          if (solid !== solidRef.current) {
            setSolidTop(solid);
            StatusBar.setBarStyle(solid ? 'dark-content' : 'light-content');
          }
        }}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.white}
            progressViewOffset={insets.top}
          />
        }
      >
        {/* Hero */}
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <Gradient from={gradients.forest[0]} to={gradients.forest[1]} />
          <View style={styles.heroGlow} />
          <View style={styles.heroGlow2} />
          <View style={styles.heroTop}>
            <AhonaMark size={42} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.hello}>
                {greeting()}
                {firstName ? `, ${firstName}` : ''} 👋
              </Text>
              <Text style={styles.heroTitle}>How can we care for you?</Text>
            </View>
            <IconButton
              name="heart"
              tone="glass"
              size={42}
              badge={wishCount || undefined}
              onPress={() => navigation.navigate('Wishlist')}
            />
            <IconButton
              name="bell"
              tone="glass"
              size={42}
              style={{ marginLeft: 8 }}
              onPress={() => navigation.navigate('Notifications')}
            />
          </View>

          <Pressable onPress={() => navigation.navigate('Search')} style={styles.search}>
            <AppIcon name="search" color={colors.forest} size={20} />
            <Text style={styles.searchText}>Search medicine, brands, doctors…</Text>
            <View style={styles.searchMic}>
              <AppIcon name="mic" color={colors.white} size={16} />
            </View>
          </Pressable>

          <View style={styles.trustRow}>
            {[
              { icon: 'shield' as const, t: '100% genuine' },
              { icon: 'truck' as const, t: '12–24h delivery' },
              { icon: 'wallet' as const, t: 'Cash on delivery' },
            ].map(x => (
              <View key={x.t} style={styles.trust}>
                <AppIcon name={x.icon} color={colors.gold} size={14} />
                <Text style={styles.trustText}>{x.t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick services */}
        <View style={styles.services}>
          {services.map(s => (
            <Pressable
              key={s.label}
              onPress={s.onPress}
              style={({ pressed }) => [styles.service, pressed && { transform: [{ scale: 0.96 }] }]}
            >
              <View style={[styles.serviceIcon, { backgroundColor: s.tint }]}>
                <AppIcon name={s.icon} color={s.fg} size={24} />
              </View>
              <Text style={styles.serviceLabel}>{s.label}</Text>
              <Text numberOfLines={1} style={styles.serviceSub}>
                {s.sub}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Banners */}
        {data.banners.length > 0 ? (
          <View style={{ marginTop: 22 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={BANNER_W + 12}
              decelerationRate="fast"
              onScroll={onBannerScroll}
              scrollEventThrottle={32}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {data.banners.map((b, i) => (
                <Pressable
                  key={b.id}
                  style={styles.banner}
                  onPress={() => {
                    const m = b.link?.match(/\/category\/([\w-]+)/);
                    if (m)
                      navigation.navigate('Products', { category: m[1], title: b.title });
                    else navigation.navigate('Products', { title: b.title });
                  }}
                >
                  <Gradient
                    from={i % 2 ? '#8a6a12' : gradients.forestSoft[0]}
                    to={i % 2 ? '#3d2e07' : gradients.forest[1]}
                  />
                  {b.image ? (
                    <SmartImage
                      uri={mediaUrl(b.image)}
                      style={StyleSheet.absoluteFill}
                      hideFallback
                    />
                  ) : null}
                  <Gradient
                    from="rgba(8,26,25,0.55)"
                    to="rgba(8,26,25,0)"
                    angle="horizontal"
                  />
                  <View style={styles.bannerArt}>
                    <AppIcon
                      name={(['leaf', 'sparkle', 'flask', 'baby'] as IconName[])[i % 4]}
                      color="rgba(255,255,255,0.13)"
                      size={150}
                      strokeWidth={1.2}
                    />
                  </View>
                  <View style={styles.bannerBody}>
                    <View style={styles.bannerTag}>
                      <Text style={styles.bannerTagText}>
                        {i === 0 ? 'AHONA PROMISE' : 'LIMITED OFFER'}
                      </Text>
                    </View>
                    <Text style={styles.bannerTitle} numberOfLines={2}>
                      {b.title}
                    </Text>
                    {b.subtitle ? (
                      <Text style={styles.bannerSub} numberOfLines={2}>
                        {b.subtitle}
                      </Text>
                    ) : null}
                    <View style={styles.bannerCta}>
                      <Text style={styles.bannerCtaText}>{b.cta || 'Shop now'}</Text>
                      <AppIcon name="arrowRight" color={colors.forestDeep} size={14} strokeWidth={2.4} />
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.dots}>
              {data.banners.map((b, i) => (
                <View key={b.id} style={[styles.dot, i === slide && styles.dotActive]} />
              ))}
            </View>
          </View>
        ) : null}

        {/* Categories */}
        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <SectionHeader
            title="Shop by category"
            subtitle="Everything for your family’s health"
            onSeeAll={() => navigation.navigate('Categories')}
          />
          <View style={styles.catGrid}>
            {data.categories.slice(0, 8).map((c, i) => (
              <Pressable
                key={c.id}
                style={({ pressed }) => [styles.cat, pressed && { opacity: 0.8 }]}
                onPress={() =>
                  navigation.navigate('Products', { category: c.slug, title: c.name })
                }
              >
                <View style={[styles.catIcon, { backgroundColor: CATEGORY_TINTS[i % CATEGORY_TINTS.length] }]}>
                  <SmartImage
                    uri={c.image ? mediaUrl(c.image) : null}
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
        </View>

        {/* Flash sale */}
        {data.flashSale.length > 0 ? (
          <View style={styles.flash}>
            <Gradient from="#fff4d6" to="#f6f4ee" angle="vertical" />
            <View style={styles.flashHead}>
              <View style={styles.flashBolt}>
                <AppIcon name="bolt" color={colors.forestDeep} size={18} filled />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.flashTitle}>Flash sale</Text>
                <Text style={styles.flashSub}>Deals refresh every day at midnight</Text>
              </View>
              <Pressable
                hitSlop={8}
                style={styles.flashAll}
                onPress={() =>
                  navigation.navigate('Products', { section: 'flashSale', title: 'Flash sale' })
                }
              >
                <Text style={styles.flashAllText}>See all</Text>
                <AppIcon name="chevronRight" color={colors.white} size={13} strokeWidth={2.6} />
              </Pressable>
            </View>
            <FlatList
              horizontal
              data={data.flashSale}
              keyExtractor={p => p.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 18 }}
              renderItem={({ item }) => (
                <ProductCard product={item} width={RAIL_W} onPress={() => goProduct(item.slug)} />
              )}
            />
          </View>
        ) : null}

        {/* Doctors */}
        {data.doctors.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="Talk to a doctor"
              subtitle="Certified specialists, from home"
              onSeeAll={() => navigation.navigate('Doctors')}
              style={{ paddingHorizontal: 16 }}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 6 }}
            >
              {data.doctors.map(d => (
                <Pressable
                  key={d.id}
                  style={({ pressed }) => [styles.docCard, pressed && { transform: [{ scale: 0.98 }] }]}
                  onPress={() => navigation.navigate('DoctorDetail', { slug: d.slug })}
                >
                  <View>
                    <SmartImage
                      uri={d.image ? mediaUrl(d.image) : null}
                      style={styles.docImg}
                      icon="doctor"
                    />
                    {d.availableNow ? (
                      <View style={styles.docOnline}>
                        <View style={styles.docOnlineDot} />
                        <Text style={styles.docOnlineText}>Online</Text>
                      </View>
                    ) : null}
                    {d.rating ? (
                      <View style={styles.docRating}>
                        <AppIcon name="star" color={colors.goldStar} size={11} filled />
                        <Text style={styles.docRatingText}>{d.rating.toFixed(1)}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={{ padding: 12 }}>
                    <Text numberOfLines={1} style={styles.docName}>
                      {d.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.docSpec}>
                      {d.specialty}
                      {d.experience ? ` · ${d.experience} yrs` : ''}
                    </Text>
                    <View style={styles.docFoot}>
                      <Text style={styles.docFee}>{formatPrice(d.fee)}</Text>
                      <View style={styles.docGo}>
                        <AppIcon name="video" color={colors.white} size={14} />
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {rail('Beauty picks', data.beautyPicks, {
          subtitle: 'Skincare & makeup our team loves',
          category: 'beauty',
        })}
        {rail('Himalaya wellness', data.himalaya, { subtitle: 'Herbal care, trusted for decades' })}
        {rail('Food & nutrition', data.foodPicks, {
          subtitle: 'Fuel for everyday health',
          category: 'food-nutrition',
        })}

        {/* Featured */}
        <View style={[styles.section, { paddingHorizontal: 16 }]}>
          <SectionHeader
            title="Featured for you"
            subtitle="Handpicked bestsellers"
            onSeeAll={() => navigation.navigate('Products', { title: 'All products' })}
          />
          <View style={styles.grid}>
            {data.featured.map(item => (
              <ProductCard
                key={item.id}
                product={item}
                width={GRID_W}
                onPress={() => goProduct(item.slug)}
              />
            ))}
          </View>
        </View>

        {/* Rx CTA */}
        <Pressable
          style={styles.rxCta}
          onPress={() => navigation.navigate('PrescriptionRequest')}
        >
          <Gradient from={gradients.gold[0]} to={gradients.gold[1]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rxTitle}>Consulted a doctor?</Text>
            <Text style={styles.rxSub}>
              View your prescription with your consultation number.
            </Text>
          </View>
          <View style={styles.rxBtn}>
            <AppIcon name="file" color={colors.white} size={20} />
          </View>
        </Pressable>
      </ScrollView>
      {solidTop ? <View style={[styles.scrim, { height: insets.top }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(246,244,238,0.96)',
  },
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 54,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.forestDeep,
  },
  heroGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -90,
    top: -70,
    backgroundColor: 'rgba(201,162,39,0.14)',
  },
  heroGlow2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    left: -70,
    bottom: -60,
    backgroundColor: 'rgba(44,138,128,0.25)',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  hello: { color: 'rgba(255,255,255,0.72)', fontSize: 12.5, fontWeight: '600' },
  heroTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  search: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingLeft: 16,
    paddingRight: 6,
    height: 54,
    ...shadows.float,
  },
  searchText: { flex: 1, color: colors.inkMuted, fontSize: 14.5 },
  searchMic: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { color: 'rgba(255,255,255,0.85)', fontSize: 11.5, fontWeight: '600' },
  services: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -34,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: 16,
    paddingHorizontal: 6,
    ...shadows.float,
    shadowOpacity: 0.1,
  },
  service: { flex: 1, alignItems: 'center' },
  serviceIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: { marginTop: 8, fontSize: 12.5, fontWeight: '800', color: colors.ink },
  serviceSub: { fontSize: 10, color: colors.inkMuted, marginTop: 2 },
  banner: {
    width: BANNER_W,
    height: 176,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.forest,
  },
  bannerArt: { position: 'absolute', right: -20, bottom: -24 },
  bannerBody: { flex: 1, padding: 20, justifyContent: 'center', maxWidth: '78%' },
  bannerTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201,162,39,0.25)',
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginBottom: 8,
  },
  bannerTagText: { color: '#f3d77a', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.2 },
  bannerTitle: {
    color: colors.white,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 25,
  },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 5, lineHeight: 16 },
  bannerCta: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  bannerCtaText: { color: colors.forestDeep, fontSize: 12, fontWeight: '800' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line },
  dotActive: { width: 20, backgroundColor: colors.forest },
  section: { marginTop: 28 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  cat: { width: '25%', alignItems: 'center' },
  catIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catImage: { width: 66, height: 66 },
  catName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.inkSoft,
    marginTop: 7,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  flash: { marginTop: 30, paddingTop: 18, overflow: 'hidden' },
  flashHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  flashBolt: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  flashSub: { fontSize: 12, color: colors.goldDeep, marginTop: 1, fontWeight: '600' },
  flashAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.forest,
    borderRadius: radii.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  flashAllText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  docCard: {
    width: 168,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadows.card,
  },
  docImg: { width: '100%', height: 150 },
  docOnline: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  docOnlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22b573' },
  docOnlineText: { fontSize: 10.5, fontWeight: '700', color: colors.ink },
  docRating: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.forestDeep,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  docRatingText: { color: colors.white, fontSize: 10.5, fontWeight: '800' },
  docName: { fontSize: 14, fontWeight: '800', color: colors.ink },
  docSpec: { fontSize: 11.5, color: colors.inkMuted, marginTop: 2 },
  docFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  docFee: { fontSize: 15, fontWeight: '800', color: colors.forest },
  docGo: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  rxCta: {
    marginHorizontal: 16,
    marginTop: 28,
    borderRadius: radii.xl,
    overflow: 'hidden',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rxTitle: { fontSize: 17, fontWeight: '800', color: colors.forestDeep },
  rxSub: { fontSize: 12.5, color: 'rgba(11,38,36,0.75)', marginTop: 4, lineHeight: 17 },
  rxBtn: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: colors.forestDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
