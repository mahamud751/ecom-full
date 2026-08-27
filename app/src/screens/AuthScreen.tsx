/** Login / register with the NestJS JWT endpoints. */
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BrandLogo } from '../components/Logo';
import { Button, Field } from '../components/ui';
import { useAuth } from '../store/auth';
import { colors } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootParamList, 'Auth'>;

export function AuthScreen({ navigation, route }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>(
    route.params?.mode ?? 'login',
  );
  const login = useAuth(s => s.login);
  const register = useAuth(s => s.register);
  const busy = useAuth(s => s.busy);
  const error = useAuth(s => s.error);
  const clearError = useAuth(s => s.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  async function submit() {
    if (mode === 'login') {
      const ok = await login(email.trim(), password);
      if (ok) navigation.goBack();
      else if (error) Alert.alert('Login failed', error);
    } else {
      if (!name.trim()) {
        Alert.alert('Missing name', 'Please enter your name.');
        return;
      }
      const ok = await register({
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      if (ok) navigation.goBack();
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <BrandLogo size={52} wordmark={false} />
          <Text style={styles.title}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </Text>
          <Text style={styles.sub}>
            {mode === 'login'
              ? 'Sign in to track orders and consult doctors.'
              : 'Join Ahona for faster checkout and consult history.'}
          </Text>
        </View>

        {mode === 'register' ? (
          <>
            <Field
              label="Full name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
            />
            <Field
              label="Phone (optional)"
              value={phone}
              onChangeText={setPhone}
              placeholder="01XXXXXXXXX"
              keyboardType="phone-pad"
            />
          </>
        ) : null}
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        {error ? <Text style={styles.err}>{error}</Text> : null}

        <Button
          label={mode === 'login' ? 'Sign in' : 'Create account'}
          loading={busy}
          onPress={() => void submit()}
          style={{ marginTop: 8 }}
        />

        <Pressable
          style={{ marginTop: 18, alignItems: 'center' }}
          onPress={() => {
            clearError();
            setMode(mode === 'login' ? 'register' : 'login');
          }}
        >
          <Text style={styles.switchText}>
            {mode === 'login'
              ? 'New to Ahona? Create an account'
              : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  inner: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 14 },
  sub: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  err: { color: colors.danger, fontSize: 13, marginBottom: 8 },
  switchText: { fontSize: 13.5, fontWeight: '600', color: colors.forestMid },
});
