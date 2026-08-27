/** Account tab — profile summary + shortcuts + legal links. */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AhonaMark } from '../components/Logo';
import { useAuth } from '../store/auth';
import { useCart } from '../store/cart';
import { colors, radii } from '../theme';
import type { TabScreenProps } from '../navigation/types';
import type { RootParamList } from '../navigation/types';

export function AccountScreen({ navigation }: TabScreenProps<'Account'>) {
  const user = useAuth(s => s.user);
  const logout = useAuth(s => s.logout);
  const cartCount = useCart(s => s.count());

  const links: {
    label: string;
    icon: string;
    to: keyof RootParamList;
  }[] = [
    { label: 'My orders', icon: '📦', to: 'MyOrders' },
    { label: 'Track an order', icon: '🚚', to: 'TrackOrder' },
    { label: 'My consultations', icon: '🩺', to: 'MyConsultations' },
    { label: 'Prescription request', icon: '📝', to: 'PrescriptionRequest' },
    { label: 'Lab tests', icon: '🧪', to: 'Lab' },
    { label: 'Wishlist', icon: '❤️', to: 'Wishlist' },
    { label: 'Product alerts', icon: '🔔', to: 'Notifications' },
    { label: 'Refund request', icon: '↩️', to: 'RefundRequest' },
    { label: 'Support', icon: '💬', to: 'Support' },
  ];

  const legal: {
    label: string;
    topic: 'contact' | 'terms' | 'privacy' | 'compliance';
  }[] = [
    { label: 'Contact us', topic: 'contact' },
    { label: 'Terms of service', topic: 'terms' },
    { label: 'Privacy policy', topic: 'privacy' },
    { label: 'Compliance', topic: 'compliance' },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={styles.profileCard}>
          <AhonaMark size={48} />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user ? user.name : 'Guest'}</Text>
            <Text style={styles.profileSub}>
              {user ? user.email : 'Sign in to sync orders & consults'}
            </Text>
          </View>
          <Pressable
            style={styles.authBtn}
            onPress={() => {
              if (user) navigation.navigate('Profile');
              else navigation.navigate('Auth');
            }}
          >
            <Text style={styles.authBtnText}>
              {user ? 'Profile' : 'Sign in'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.section}>My Ahona</Text>
        <View style={styles.grid}>
          {links.map(l => (
            <Pressable
              key={l.label}
              style={styles.tile}
              // @ts-expect-error dynamic navigation target
              onPress={() => navigation.navigate(l.to)}
            >
              <Text style={styles.tileIcon}>{l.icon}</Text>
              <Text style={styles.tileLabel}>{l.label}</Text>
            </Pressable>
          ))}
          <Pressable
            style={styles.tile}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.tileIcon}>🛒</Text>
            <Text style={styles.tileLabel}>
              Cart{cartCount ? ` (${cartCount})` : ''}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Information</Text>
        {legal.map(l => (
          <Pressable
            key={l.topic}
            style={styles.row}
            onPress={() => navigation.navigate('Info', { topic: l.topic })}
          >
            <Text style={styles.rowLabel}>{l.label}</Text>
            <Text style={styles.rowArrow}>›</Text>
          </Pressable>
        ))}

        {user ? (
          <Pressable style={styles.logout} onPress={() => void logout()}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ivory },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  profileName: { fontSize: 17, fontWeight: '800', color: colors.ink },
  profileSub: { fontSize: 12.5, color: colors.inkMuted, marginTop: 2 },
  authBtn: {
    backgroundColor: colors.forest,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  authBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  section: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.inkMuted,
    marginTop: 22,
    marginBottom: 10,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tileIcon: { fontSize: 22 },
  tileLabel: {
    fontSize: 11.5,
    color: colors.ink,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 8,
  },
  rowLabel: { fontSize: 14, color: colors.ink, fontWeight: '500' },
  rowArrow: { fontSize: 18, color: colors.inkMuted },
  logout: {
    marginTop: 24,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: { color: colors.danger, fontWeight: '700' },
});
