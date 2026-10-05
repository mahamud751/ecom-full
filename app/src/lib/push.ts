/**
 * Registers this phone for push (FCM) while a customer is signed in, so the
 * doctor can ring it even when the app is closed.
 */
import { Alert, Linking, Platform } from 'react-native';
import notifee from '@notifee/react-native';
import {
  getMessaging,
  getToken,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import { http } from '../api/client';
import { storage } from './storage';

const BATTERY_PROMPT_KEY = 'push_battery_prompt_shown';

async function sendToken(token: string) {
  await http.post('/devices', { token, platform: Platform.OS });
}

/**
 * Asks for notification permission, registers the token and keeps it
 * current. Returns an unsubscribe for the token-refresh listener.
 */
export async function registerForPush(): Promise<() => void> {
  await notifee.requestPermission();
  const messaging = getMessaging();
  try {
    await sendToken(await getToken(messaging));
  } catch {
    // Offline or no Play Services; the refresh listener retries later.
  }
  return onTokenRefresh(messaging, token => {
    void sendToken(token).catch(() => undefined);
  });
}

/** Logout: this phone must stop ringing for the signed-out account. */
export async function unregisterFromPush() {
  try {
    const token = await getToken(getMessaging());
    await http.delete('/devices', { data: { token } });
  } catch {
    /* best effort */
  }
}

/**
 * Xiaomi/Oppo/Vivo/Realme battery savers block pushes for swiped-away apps,
 * so calls would never ring. Ask once, where a doctor's call is expected
 * (the consultation screen), to exempt the app.
 */
export async function askBatteryExceptionOnce() {
  if (Platform.OS !== 'android' || storage.getBoolean(BATTERY_PROMPT_KEY)) {
    return;
  }
  if (!(await notifee.isBatteryOptimizationEnabled())) return;
  storage.set(BATTERY_PROMPT_KEY, true);
  Alert.alert(
    'Never miss a doctor’s call',
    'So your phone rings when the doctor calls, even with Ahona closed: open Settings → Battery (App battery usage) → choose "Unrestricted".',
    [
      { text: 'Not now', style: 'cancel' },
      // Ahona's own app-info page (the generic battery list is easy to
      // mis-tap and some phones open the wrong app from it).
      { text: 'Open settings', onPress: () => void Linking.openSettings() },
    ],
  );
}
