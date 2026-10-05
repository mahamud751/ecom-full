/**
 * Full-screen "Dr. X is calling" with Accept / Decline. Opened by an
 * incoming-call push while the app is open, or when the ringing
 * notification launches the app (locked phone / tap). Closes itself when the
 * ring ends: timeout, doctor cancelled, or answered on another phone.
 */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../components/AppIcon';
import { SmartImage } from '../components/ui';
import { mediaUrl } from '../config';
import { answerCall, useIncomingCall } from '../lib/calls';
import { colors } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootParamList, 'IncomingCall'>;

const ACCEPT_GREEN = '#22b573';

export function IncomingCallScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const call = route.params;
  const ringing = useIncomingCall(
    s =>
      s.call?.consultId === call.consultId && s.call.ringId === call.ringId,
  );

  // Ring timed out: leave on our own.
  useEffect(() => {
    const ms = call.expiresAt - Date.now();
    if (ms <= 0) {
      navigation.goBack();
      return;
    }
    const t = setTimeout(() => {
      useIncomingCall.setState(s =>
        s.call?.consultId === call.consultId ? { call: null } : s,
      );
      if (navigation.canGoBack()) navigation.goBack();
    }, ms);
    return () => clearTimeout(t);
  }, [call, navigation]);

  function decline() {
    void answerCall(call, 'decline');
    if (navigation.canGoBack()) navigation.goBack();
  }

  function accept() {
    // answerCall opens CallRoom; drop this screen from the stack first.
    if (navigation.canGoBack()) navigation.goBack();
    void answerCall(call, 'accept');
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 48 }]}>
      <Text style={styles.kicker}>
        {call.mode === 'AUDIO' ? 'Voice consultation' : 'Video consultation'}
      </Text>
      <View style={styles.ring2}>
        <View style={styles.ring1}>
          <SmartImage
            uri={call.doctorImage ? mediaUrl(call.doctorImage) : null}
            style={styles.avatar}
            icon="doctor"
            iconSize={48}
          />
        </View>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {call.doctorName}
      </Text>
      <Text style={styles.sub}>
        {ringing ? 'is calling you…' : 'Call ended'}
      </Text>

      <View style={[styles.actions, { bottom: insets.bottom + 56 }]}>
        <View style={styles.action}>
          <Pressable
            style={[styles.btn, { backgroundColor: colors.danger }]}
            onPress={decline}
            accessibilityLabel="Decline call"
          >
            <View style={{ transform: [{ rotate: '135deg' }] }}>
              <AppIcon name="phone" color={colors.white} size={30} filled />
            </View>
          </Pressable>
          <Text style={styles.label}>Decline</Text>
        </View>
        <View style={styles.action}>
          <Pressable
            style={[styles.btn, { backgroundColor: ACCEPT_GREEN }]}
            onPress={accept}
            disabled={!ringing}
            accessibilityLabel="Accept call"
          >
            <AppIcon
              name={call.mode === 'AUDIO' ? 'phone' : 'video'}
              color={colors.white}
              size={30}
              filled={call.mode === 'AUDIO'}
            />
          </Pressable>
          <Text style={styles.label}>Accept</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.forestDeep,
    alignItems: 'center',
  },
  kicker: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  ring2: {
    marginTop: 36,
    padding: 26,
    borderRadius: 160,
    backgroundColor: 'rgba(201,162,39,0.06)',
  },
  ring1: {
    padding: 20,
    borderRadius: 140,
    backgroundColor: 'rgba(201,162,39,0.12)',
  },
  avatar: { width: 132, height: 132, borderRadius: 66 },
  name: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 28,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 15, marginTop: 8 },
  actions: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  action: { alignItems: 'center', gap: 10 },
  btn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
});
