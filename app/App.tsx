/**
 * Ahona — Health & Beauty
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import notifee from '@notifee/react-native';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { useAuth } from './src/store/auth';
import {
  handleForegroundMessage,
  handleInitialNotification,
  handleNotificationEvent,
} from './src/lib/calls';
import { registerForPush } from './src/lib/push';
import { colors } from './src/theme';

function App() {
  useEffect(() => {
    // Restore the session (refresh token → /auth/me) on cold start.
    void useAuth.getState().bootstrap();
    // Opened by a call notification (full-screen ring, tap, or Accept)?
    void handleInitialNotification();
    const offMessage = onMessage(getMessaging(), handleForegroundMessage);
    const offEvents = notifee.onForegroundEvent(event =>
      handleNotificationEvent(event, true),
    );
    return () => {
      offMessage();
      offEvents();
    };
  }, []);

  // Ring this phone only while a customer is signed in.
  const userId = useAuth(s => s.user?.id);
  useEffect(() => {
    if (!userId) return;
    let offRefresh: (() => void) | undefined;
    let cancelled = false;
    void registerForPush().then(off => {
      if (cancelled) off();
      else offRefresh = off;
    });
    return () => {
      cancelled = true;
      offRefresh?.();
    };
  }, [userId]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <RootNavigator />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
});

export default App;
