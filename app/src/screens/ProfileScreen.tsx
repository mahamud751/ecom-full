/** Profile — view & update name/phone, change password. */
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import { Button, Card, EmptyView, Field } from '../components/ui';
import { useAuth } from '../store/auth';
import { colors } from '../theme';
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

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16 }}>
      <Card style={{ padding: 14, marginBottom: 12 }}>
        <Text style={styles.h3}>Personal details</Text>
        <Field label="Email" value={user.email} editable={false} />
        <Field label="Full name" value={name} onChangeText={setName} />
        <Field
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </Card>

      <Card style={{ padding: 14, marginBottom: 16 }}>
        <Text style={styles.h3}>Change password</Text>
        <Field
          label="Current password"
          value={curPw}
          onChangeText={setCurPw}
          secureTextEntry
        />
        <Field
          label="New password"
          value={newPw}
          onChangeText={setNewPw}
          secureTextEntry
        />
      </Card>

      <Button
        label="Save changes"
        loading={saving}
        onPress={() => void save()}
      />
      <Button
        label="Sign out"
        variant="outline"
        style={{ marginTop: 10 }}
        onPress={() => {
          void useAuth.getState().logout();
          navigation.popToTop();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  h3: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 12 },
});
