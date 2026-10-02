/** Doctors tab — hero, specialty filter, doctor cards. */
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { http, apiErrorMessage } from '../api/client';
import { mediaUrl } from '../config';
import { AppIcon } from '../components/AppIcon';
import { tabBarSpace } from '../components/FluidTabBar';
import {
  Chip,
  EmptyView,
  ErrorView,
  Gradient,
  Loading,
  SmartImage,
} from '../components/ui';
import { colors, formatPrice, gradients, radii, shadows } from '../theme';
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
  const insets = useSafeAreaInsets();
  const [doctors, setDoctors] = useState<DoctorCard[] | null>(null);
  const [spec, setSpec] = useState('All');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    http
      .get('/doctors', { params: spec === 'All' ? {} : { specialty: spec } })
      .then(res => setDoctors(res.data.doctors ?? []))
      .catch(err => setError(apiErrorMessage(err)));
  }, [spec]);

  useEffect(() => {
    load();
  }, [load]);

  const onlineCount = doctors?.filter(d => d.availableNow).length ?? 0;

  const header = (
    <View>
      <View style={styles.hero}>
        <Gradient from={gradients.forestSoft[0]} to={gradients.forest[1]} />
        <View style={styles.heroGlow} />
        <View style={{ flex: 1 }}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>
              {onlineCount > 0 ? `${onlineCount} doctors online now` : 'Consult from home'}
            </Text>
          </View>
          <Text style={styles.heroTitle}>See a specialist{'\n'}in minutes</Text>
          <Text style={styles.heroSub}>Video or audio · Digital prescription</Text>
        </View>
        <View style={styles.heroIcon}>
          <AppIcon name="stethoscope" color={colors.gold} size={40} strokeWidth={1.6} />
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {SPECIALTIES.map(s => (
          <Chip key={s} label={s} active={spec === s} onPress={() => setSpec(s)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Doctors</Text>
        <Pressable
          onPress={() => navigation.navigate('MyConsultations')}
          style={styles.myBtn}
        >
          <AppIcon name="calendar" color={colors.forest} size={16} />
          <Text style={styles.myBtnText}>My consults</Text>
        </Pressable>
      </View>

      {error ? (
        <ErrorView message={error} onRetry={load} />
      ) : !doctors ? (
        <Loading />
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={d => d.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingBottom: tabBarSpace(insets) + 20 }}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.985 }] }]}
              onPress={() => navigation.navigate('DoctorDetail', { slug: item.slug })}
            >
              <View>
                <SmartImage
                  uri={item.image ? mediaUrl(item.image) : null}
                  style={styles.img}
                  icon="doctor"
                />
                {item.availableNow ? <View style={styles.onlineDot} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.spec} numberOfLines={1}>
                  {item.specialty}
                  {item.designation ? ` · ${item.designation}` : ''}
                </Text>
                <View style={styles.metaRow}>
                  <View style={styles.meta}>
                    <AppIcon name="star" color={colors.goldStar} size={13} filled />
                    <Text style={styles.metaStrong}>
                      {typeof item.rating === 'number' ? item.rating.toFixed(1) : '4.8'}
                    </Text>
                  </View>
                  {item.experience ? (
                    <View style={styles.meta}>
                      <AppIcon name="clock" color={colors.inkMuted} size={13} />
                      <Text style={styles.metaText}>{item.experience} yrs</Text>
                    </View>
                  ) : null}
                  {item.patients ? (
                    <View style={styles.meta}>
                      <AppIcon name="user" color={colors.inkMuted} size={13} />
                      <Text style={styles.metaText}>{item.patients}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.cardFoot}>
                  <View>
                    <Text style={styles.feeLabel}>Consult fee</Text>
                    <Text style={styles.fee}>{formatPrice(item.fee)}</Text>
                  </View>
                  <View style={[styles.bookBtn, item.availableNow && styles.bookBtnLive]}>
                    <AppIcon
                      name="video"
                      color={item.availableNow ? colors.white : colors.forest}
                      size={15}
                    />
                    <Text
                      style={[styles.bookText, item.availableNow && { color: colors.white }]}
                    >
                      {item.availableNow ? 'Consult now' : 'Book'}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyView
              icon="stethoscope"
              title="No doctors found"
              hint="Try another specialty."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.6 },
  myBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brandLight,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  myBtnText: { fontSize: 12.5, fontWeight: '700', color: colors.forest },
  hero: {
    marginHorizontal: 16,
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
    top: -60,
    backgroundColor: 'rgba(201,162,39,0.16)',
  },
  livePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3ddc97' },
  liveText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
    lineHeight: 27,
    letterSpacing: -0.4,
  },
  heroSub: { color: 'rgba(255,255,255,0.72)', fontSize: 12.5, marginTop: 6 },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 18 },
  card: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    ...shadows.card,
  },
  img: { width: 92, height: 112, borderRadius: radii.md },
  onlineDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22b573',
    borderWidth: 2.5,
    borderColor: colors.surface,
  },
  name: { fontSize: 16, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },
  spec: { fontSize: 12.5, color: colors.forestMid, marginTop: 2, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaStrong: { fontSize: 12, fontWeight: '800', color: colors.ink },
  metaText: { fontSize: 12, color: colors.inkMuted },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 8,
  },
  feeLabel: { fontSize: 10.5, color: colors.inkMuted },
  fee: { fontSize: 16, fontWeight: '800', color: colors.ink },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brandLight,
    borderRadius: radii.pill,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  bookBtnLive: { backgroundColor: colors.forest },
  bookText: { fontSize: 12.5, fontWeight: '800', color: colors.forest },
});
