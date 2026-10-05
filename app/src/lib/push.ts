/**
 * Registers this phone for push (FCM) while a customer is signed in, so the
 * doctor can ring it even when the app is closed.
 */
import { Alert, Platform } from 'react-native';
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
  void maybeAskBatteryException();
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
 * so calls would never ring. Ask once to exempt the app.
 */
async function maybeAskBatteryException() {
  if (Platform.OS !== 'android' || storage.getBoolean(BATTERY_PROMPT_KEY)) {
    return;
  }
  if (!(await notifee.isBatteryOptimizationEnabled())) return;
  storage.set(BATTERY_PROMPT_KEY, true);
  Alert.alert(
    'Never miss a doctor’s call',
    'Allow Ahona to run in the background so your phone can ring when a doctor calls, even if the app is closed.',
    [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Allow',
        onPress: () => void notifee.openBatteryOptimizationSettings(),
      },
    ],
  );
}
