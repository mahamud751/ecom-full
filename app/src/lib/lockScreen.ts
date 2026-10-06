/**
 * Show the app over the lock screen only while a doctor's call is ringing or
 * live (native CallLockScreen module, Android). Off otherwise, so a locked
 * phone never reveals the app.
 */
import { NativeModules, Platform } from 'react-native';

export function setCallOverLockScreen(enabled: boolean) {
  if (Platform.OS !== 'android') return;
  NativeModules.CallLockScreen?.setEnabled(enabled);
}
