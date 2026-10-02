/** Account tab — profile hero, quick stats, shortcuts + legal links. */
import React, { useCallback } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AhonaMark } from '../components/Logo';
import { AppIcon, type IconName } from '../components/AppIcon';
import { tabBarSpace } from '../components/FluidTabBar';
import { Gradient, IconTile, ListRow } from '../components/ui';
import { useAuth } from '../store/auth';
import { useCart } from '../store/cart';
import { useWishlist } from '../store/wishlist';
import { colors, gradients, radii, shadows } from '../theme';
import type { TabScreenProps } from '../navigation/types';
import type { RootParamList } from '../navigation/types';

type Link = { label: string; sub?: string; icon: IconName; to: keyof RootParamList };

export function AccountScreen({ navigation }: TabScreenProps<'Account'>) {
  const insets = useSafeAreaInsets();
  const user = useAuth(s => s.user);
  const logout = useAuth(s => s.logout);
  const cartCount = useCart(s => s.count());
  const wishCount = useWishlist(s => s.ids.length);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, []),
  );

  // @ts-expect-error dynamic navigation target (all listed routes take no params)
  const go = (to: keyof RootParamList) => navigation.navigate(to);

  const quick: { label: string; icon: IconName; to: keyof RootParamList; tint: string; fg: string }[] = [
    { label: 'Orders', icon: 'box', to: 'MyOrders', tint: colors.brandLight, fg: colors.forest },
    { label: 'Track', icon: 'truck', to: 'TrackOrder', tint: colors.goldSoft, fg: colors.goldDeep },
    { label: 'Consults', icon: 'stethoscope', to: 'MyConsultations', tint: '#eef0fb', fg: '#4452a8' },
    { label: 'Lab tests', icon: 'flask', to: 'Lab', tint: '#fbe9ef', fg: '#b23a62' },
  ];

  const health: Link[] = [
    { label: 'My prescription', sub: 'View one issued after a consult', icon: 'file', to: 'PrescriptionRequest' },
    { label: 'Wishlist', sub: wishCount ? `${wishCount} saved item${wishCount > 1 ? 's' : ''}` : 'Save items for later', icon: 'heart', to: 'Wishlist' },
    { label: 'Product alerts', sub: 'Back-in-stock & price drops', icon: 'bell', to: 'Notifications' },
  ];

  const help: Link[] = [
    { label: 'Refund request', icon: 'refund', to: 'RefundRequest' },
    { label: 'Support', sub: 'We reply within minutes', icon: 'chat', to: 'Support' },
  ];

  const legal: { label: string; icon: IconName; topic: 'contact' | 'terms' | 'privacy' | 'compliance' }[] = [
    { label: 'Contact us', icon: 'mail', topic: 'contact' },
    { label: 'Terms of service', icon: 'file', topic: 'terms' },
    { label: 'Privacy policy', icon: 'shield', topic: 'privacy' },
    { label: 'Compliance', icon: 'info', topic: 'compliance' },
  ];

  const initials = user?.name
    ?.split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarSpace(insets) + 24 }}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
          <Gradient from={gradients.forest[0]} to={gradients.forest[1]} />
          <View style={styles.heroGlow} />
          <Text style={styles.heroLabel}>Account</Text>
          <View style={styles.profile}>
            {user ? (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            ) : (
              <AhonaMark size={60} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {user ? user.name : 'Welcome to Ahona'}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {user ? user.email : 'Sign in to sync orders & consults'}
              </Text>
            </View>
            <Pressable
              style={styles.authBtn}
              onPress={() => navigation.navigate(user ? 'Profile' : 'Auth')}
            >
              <Text style={styles.authBtnText}>{user ? 'Edit' : 'Sign in'}</Text>
            </Pressable>
          </View>
          <View style={styles.stats}>
            {[
              { n: cartCount, l: 'In cart', on: () => navigation.navigate('Cart') },
              { n: wishCount, l: 'Wishlist', on: () => navigation.navigate('Wishlist') },
            ].map((x, i) => (
              <Pressable key={x.l} onPress={x.on} style={[styles.stat, i > 0 && styles.statDivider]}>
                <Text style={styles.statN}>{x.n}</Text>
                <Text style={styles.statL}>{x.l}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.quick}>
          {quick.map(q => (
            <Pressable
              key={q.label}
              onPress={() => go(q.to)}
              style={({ pressed }) => [styles.quickItem, pressed && { transform: [{ scale: 0.95 }] }]}
            >
              <IconTile name={q.icon} size={50} color={q.fg} bg={q.tint} radius={17} />
              <Text style={styles.quickLabel}>{q.label}</Text>
            </Pressable>
          ))}
        </View>

        <Group title="Health & shopping">
          {health.map((l, i) => (
            <ListRow key={l.label} icon={l.icon} title={l.label} subtitle={l.sub} last={i === health.length - 1} onPress={() => go(l.to)} />
          ))}
        </Group>

        <Group title="Help">
          {help.map((l, i) => (
            <ListRow key={l.label} icon={l.icon} title={l.label} subtitle={l.sub} last={i === help.length - 1} onPress={() => go(l.to)} />
          ))}
        </Group>

        <Group title="About">
          {legal.map((l, i) => (
            <ListRow
              key={l.topic}
              icon={l.icon}
              title={l.label}
              last={i === legal.length - 1}
              onPress={() => navigation.navigate('Info', { topic: l.topic })}
            />
          ))}
        </Group>

        {user ? (
          <Group>
            <ListRow icon="logout" title="Log out" danger last onPress={() => void logout()} right={<View />} />
          </Group>
        ) : null}

        <View style={styles.footer}>
          <AppIcon name="shield" color={colors.inkFaint} size={14} />
          <Text style={styles.footerText}>Ahona · Licensed pharmacy · v1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 22, paddingHorizontal: 16 }}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <View style={styles.group}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 56,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    right: -80,
    top: -60,
    backgroundColor: 'rgba(201,162,39,0.14)',
  },
  heroLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.forestDeep },
  name: { fontSize: 20, fontWeight: '800', color: colors.white, letterSpacing: -0.3 },
  email: { fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  authBtn: {
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  authBtnText: { color: colors.forestDeep, fontWeight: '800', fontSize: 13 },
  stats: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 12,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.15)' },
  statN: { fontSize: 20, fontWeight: '800', color: colors.white },
  statL: { fontSize: 11.5, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  quick: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -36,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: 16,
    ...shadows.float,
    shadowOpacity: 0.1,
  },
  quickItem: { flex: 1, alignItems: 'center' },
  quickLabel: { fontSize: 12, fontWeight: '700', color: colors.ink, marginTop: 8 },
  groupTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadows.card,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 26,
  },
  footerText: { fontSize: 11.5, color: colors.inkFaint },
});
