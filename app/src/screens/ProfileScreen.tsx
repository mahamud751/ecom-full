/** Profile — view & update name/phone, change password. */
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import { Button, Card, EmptyView, Field, IconTile } from '../components/ui';
import { useAuth } from '../store/auth';
import { colors, radii } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const user = useAuth(s => s.user);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? '');
    setPhone(user.phone ?? '');
  }, [user]);

  if (!user) {
    return (
      <EmptyView
        title="Sign in required"
        hint="Login to manage your profile."
      />
    );
  }

  async function save() {
    setSaving(true);
    try {
      const res = await http.patch('/auth/profile', {
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        ...(curPw && newPw
          ? { currentPassword: curPw, newPassword: newPw }
          : {}),
      });
      useAuth.setState({ user: res.data.user ?? user });
      setCurPw('');
      setNewPw('');
      Alert.alert('Saved', 'Your profile was updated.');
    } catch (err) {
      Alert.alert('Update failed', apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!deletePw) {
      Alert.alert('Password required', 'Enter your password to confirm.');
      return;
    }
    Alert.alert(
      'Delete account?',
      'This permanently removes your profile, saved addresses and personal details. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void deleteAccount() },
      ],
    );
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await http.delete('/auth/account', { data: { password: deletePw } });
      await useAuth.getState().logout();
      navigation.popToTop();
    } catch (err) {
      Alert.alert('Could not delete account', apiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  const initials = user.name
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.head}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.cardHead}>
          <IconTile name="user" size={34} />
          <Text style={styles.h3}>Personal details</Text>
        </View>
        <Field label="Email" icon="mail" value={user.email} editable={false} style={{ color: colors.inkMuted }} />
        <Field label="Full name" icon="user" value={name} onChangeText={setName} />
        <Field label="Phone" icon="phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardHead}>
          <IconTile name="shield" size={34} />
          <Text style={styles.h3}>Change password</Text>
        </View>
        <Field label="Current password" value={curPw} onChangeText={setCurPw} secureTextEntry />
        <Field label="New password" value={newPw} onChangeText={setNewPw} secureTextEntry />
      </Card>

      <Button label="Save changes" icon="check" loading={saving} onPress={() => void save()} />
      <Button
        label="Sign out"
        icon="logout"
        variant="ghost"
        style={{ marginTop: 6 }}
        onPress={() => {
          void useAuth.getState().logout();
          navigation.popToTop();
        }}
      />

      <View style={styles.danger}>
        <View style={styles.cardHead}>
          <IconTile name="trash" size={34} color={colors.danger} bg={colors.surface} />
          <Text style={[styles.h3, { color: colors.danger }]}>Delete account</Text>
        </View>
        <Text style={styles.dangerHint}>
          This permanently removes your profile, saved addresses and personal
          details. This cannot be undone.
        </Text>
        <Field label="Confirm your password" value={deletePw} onChangeText={setDeletePw} secureTextEntry />
        <Button label="Delete my account" variant="danger" loading={deleting} onPress={confirmDelete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  head: { alignItems: 'center', marginBottom: 20, marginTop: 4 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 30,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.goldSoft,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: colors.gold },
  name: { fontSize: 21, fontWeight: '800', color: colors.ink, marginTop: 12, letterSpacing: -0.3 },
  email: { fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  card: { padding: 16, marginBottom: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  h3: { fontSize: 16, fontWeight: '800', color: colors.ink },
  danger: {
    marginTop: 26,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: '#f6cfd5',
  },
  dangerHint: {
    fontSize: 12.5,
    color: colors.inkSoft,
    marginTop: -6,
    marginBottom: 14,
    lineHeight: 18,
  },
});
