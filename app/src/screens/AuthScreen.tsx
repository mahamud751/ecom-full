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
import { AhonaMark } from '../components/Logo';
import { AppIcon } from '../components/AppIcon';
import { Button, Field, Gradient } from '../components/ui';
import { useAuth } from '../store/auth';
import { colors, gradients, radii, shadows } from '../theme';
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

  const switchTo = (m: 'login' | 'register') => {
    clearError();
    setMode(m);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <Gradient from={gradients.forest[0]} to={gradients.forest[1]} />
          <View style={styles.brandGlow} />
          <AhonaMark size={60} />
          <Text style={styles.title}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </Text>
          <Text style={styles.sub}>
            {mode === 'login'
              ? 'Sign in to track orders and consult doctors.'
              : 'Faster checkout and your full consult history.'}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.segment}>
            {(['login', 'register'] as const).map(m => (
              <Pressable
                key={m}
                onPress={() => switchTo(m)}
                style={[styles.segBtn, mode === m && styles.segBtnOn]}
              >
                <Text style={[styles.segText, mode === m && styles.segTextOn]}>
                  {m === 'login' ? 'Sign in' : 'Register'}
                </Text>
              </Pressable>
            ))}
          </View>

          {mode === 'register' ? (
            <>
              <Field label="Full name" icon="user" value={name} onChangeText={setName} placeholder="Your name" />
              <Field
                label="Phone (optional)"
                icon="phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="01XXXXXXXXX"
                keyboardType="phone-pad"
              />
            </>
          ) : null}
          <Field
            label="Email"
            icon="mail"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            icon="shield"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          {error ? (
            <View style={styles.errBox}>
              <AppIcon name="info" color={colors.danger} size={16} />
              <Text style={styles.err}>{error}</Text>
            </View>
          ) : null}

          <Button
            label={mode === 'login' ? 'Sign in' : 'Create account'}
            size="lg"
            loading={busy}
            onPress={() => void submit()}
            style={{ marginTop: 6 }}
          />
        </View>

        <Pressable
          style={{ marginTop: 20, alignItems: 'center' }}
          onPress={() => switchTo(mode === 'login' ? 'register' : 'login')}
        >
          <Text style={styles.switchText}>
            {mode === 'login' ? 'New to Ahona? ' : 'Already have an account? '}
            <Text style={styles.switchLink}>
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  inner: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  brand: {
    borderRadius: radii.xxl,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 24,
  },
  brandGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -90,
    right: -60,
    backgroundColor: 'rgba(201,162,39,0.16)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    marginTop: 16,
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    marginTop: -18,
    marginHorizontal: 8,
    padding: 18,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadows.float,
    shadowOpacity: 0.1,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.lineSoft,
    borderRadius: radii.md,
    padding: 4,
    marginBottom: 18,
  },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: radii.sm, alignItems: 'center' },
  segBtnOn: { backgroundColor: colors.surface, ...shadows.card },
  segText: { fontSize: 14, fontWeight: '700', color: colors.inkMuted },
  segTextOn: { color: colors.forest },
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.dangerSoft,
    marginBottom: 10,
  },
  err: { flex: 1, color: colors.danger, fontSize: 13, fontWeight: '600' },
  switchText: { fontSize: 14, color: colors.inkMuted },
  switchLink: { fontWeight: '800', color: colors.forest },
});
