/**
 * Incoming doctor calls over FCM (Messenger-style ringing).
 *
 * The server sends data-only, high-priority pushes:
 *   incoming_call → show a full-screen ringing notification (works with the
 *                   app closed or the phone locked) and, if the app is open,
 *                   the in-app IncomingCall screen
 *   call_end      → stop ringing (doctor cancelled, answered on another
 *                   phone, declined, or missed — missed also leaves a
 *                   "Missed call" notification)
 *
 * handleRemoteMessage / handleNotificationEvent run in index.js too, i.e.
 * headless with no UI, so they must not depend on React state.
 */
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  EventType,
  type Event,
} from '@notifee/react-native';
import type { RemoteMessage } from '@react-native-firebase/messaging';
import { create } from 'zustand';
import { http } from '../api/client';
import { mediaUrl } from '../config';
import { navigateWhenReady, navigationRef } from './navigation';

export type IncomingCall = {
  consultId: string;
  /** Identifies this ring (its start time); a consult can be rung again. */
  ringId: string;
  doctorName: string;
  doctorImage: string;
  channel: string;
  mode: 'VIDEO' | 'AUDIO';
  expiresAt: number;
};

const CALL_CHANNEL = 'incoming_calls';
const MISSED_CHANNEL = 'missed_calls';
const notificationId = (consultId: string) => `call-${consultId}`;

/** The call currently ringing in this app process, for the in-app screen. */
export const useIncomingCall = create<{ call: IncomingCall | null }>(() => ({
  call: null,
}));

async function ensureChannels() {
  await notifee.createChannel({
    id: CALL_CHANNEL,
    name: 'Incoming doctor calls',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: 'default',
    vibration: true,
    vibrationPattern: [400, 800, 400, 800],
  });
  await notifee.createChannel({
    id: MISSED_CHANNEL,
    name: 'Missed calls',
    importance: AndroidImportance.DEFAULT,
  });
}

function parseCall(data: Record<string, unknown> | undefined): IncomingCall | null {
  if (!data || data.type !== 'incoming_call' || !data.consultId) return null;
  return {
    consultId: String(data.consultId),
    ringId: String(data.ringId ?? ''),
    doctorName: String(data.doctorName ?? 'Your doctor'),
    doctorImage: String(data.doctorImage ?? ''),
    channel: String(data.channel ?? ''),
    mode: data.mode === 'AUDIO' ? 'AUDIO' : 'VIDEO',
    expiresAt: Number(data.expiresAt) || Date.now() + 30_000,
  };
}

async function showRinging(call: IncomingCall) {
  await ensureChannels();
  const remaining = call.expiresAt - Date.now();
  await notifee.displayNotification({
    id: notificationId(call.consultId),
    title: call.doctorName,
    body:
      call.mode === 'AUDIO'
        ? 'Incoming voice consultation'
        : 'Incoming video consultation',
    data: { type: 'incoming_call', ...stringify(call) },
    android: {
      channelId: CALL_CHANNEL,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      // Locked / screen off → opens the app full screen over the lock
      // screen; otherwise shows a heads-up with the buttons below.
      fullScreenAction: { id: 'default', launchActivity: 'default' },
      pressAction: { id: 'default', launchActivity: 'default' },
      actions: [
        { title: 'Decline', pressAction: { id: 'decline' } },
        {
          title: 'Accept',
          pressAction: { id: 'accept', launchActivity: 'default' },
        },
      ],
      ongoing: true,
      autoCancel: false,
      loopSound: true,
      lightUpScreen: true,
      timeoutAfter: Math.max(1000, remaining),
      ...(call.doctorImage
        ? { largeIcon: mediaUrl(call.doctorImage), circularLargeIcon: true }
        : {}),
    },
  });
}

function stringify(call: IncomingCall): Record<string, string> {
  return {
    consultId: call.consultId,
    ringId: call.ringId,
    doctorName: call.doctorName,
    doctorImage: call.doctorImage,
    channel: call.channel,
    mode: call.mode,
    expiresAt: String(call.expiresAt),
  };
}

/**
 * Stops the ring for this consult. With `ringId`, only if that is the ring
 * being shown: an "ended" message for an older ring must not silence a
 * newer one.
 */
async function stopRinging(consultId: string, ringId?: string) {
  const sameRing = (shown?: unknown) =>
    !ringId || !shown || String(shown) === ringId;
  const displayed = await notifee.getDisplayedNotifications();
  const shown = displayed.find(d => d.id === notificationId(consultId));
  if (!shown || sameRing(shown.notification.data?.ringId)) {
    await notifee.cancelNotification(notificationId(consultId));
  }
  const current = useIncomingCall.getState().call;
  if (current?.consultId === consultId && sameRing(current.ringId)) {
    useIncomingCall.setState({ call: null });
    if (navigationRef.isReady()) {
      const route = navigationRef.getCurrentRoute();
      if (route?.name === 'IncomingCall' && navigationRef.canGoBack()) {
        navigationRef.goBack();
      }
    }
  }
}

/** FCM message handler — foreground (onMessage) and background/closed. */
export async function handleRemoteMessage(message: RemoteMessage) {
  const data = message.data as Record<string, unknown> | undefined;
  const call = parseCall(data);
  if (call) {
    if (call.expiresAt <= Date.now()) return; // delivered too late
    await showRinging(call);
    useIncomingCall.setState({ call });
    return;
  }
  if (data?.type === 'call_end' && data.consultId) {
    const consultId = String(data.consultId);
    await stopRinging(consultId, data.ringId ? String(data.ringId) : undefined);
    if (data.reason === 'missed') {
      await ensureChannels();
      await notifee.displayNotification({
        id: `missed-${consultId}`,
        title: 'Missed call',
        body: `${String(data.doctorName ?? 'Your doctor')} tried to call you`,
        data: { type: 'missed_call', consultId },
        android: {
          channelId: MISSED_CHANNEL,
          pressAction: { id: 'missed', launchActivity: 'default' },
        },
      });
    }
  }
}

/** Accept or decline on the server; accept then opens the call screen. */
export async function answerCall(call: IncomingCall, answer: 'accept' | 'decline') {
  await stopRinging(call.consultId, call.ringId);
  try {
    await http.post(`/consultations/${call.consultId}/call/answer`, {
      answer,
      ringId: call.ringId || undefined,
    });
  } catch {
    // Already ended (cancelled / missed / answered elsewhere): nothing to join.
    return;
  }
  if (answer === 'accept') {
    navigateWhenReady('CallRoom', {
      consultationId: call.consultId,
      channel: call.channel,
      mode: call.mode,
    });
  }
}

/**
 * Notification taps and button presses (notifee). Background presses on
 * Decline are answered headlessly; Accept and taps open the app, which then
 * gets the same event via the initial notification / foreground listener.
 */
export async function handleNotificationEvent(
  { type, detail }: Event,
  inForeground: boolean,
) {
  const data = detail.notification?.data as Record<string, unknown> | undefined;
  if (type === EventType.DISMISSED) return;

  if (data?.type === 'missed_call' && type === EventType.PRESS) {
    navigateWhenReady('ConsultDetail', { id: String(data.consultId) });
    return;
  }

  const call = parseCall(data);
  if (!call) return;
  const action =
    type === EventType.ACTION_PRESS ? detail.pressAction?.id : 'default';
  if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) return;

  if (action === 'decline') {
    await answerCall(call, 'decline');
  } else if (action === 'accept') {
    if (inForeground) await answerCall(call, 'accept');
  } else if (inForeground && call.expiresAt > Date.now()) {
    useIncomingCall.setState({ call });
    navigateWhenReady('IncomingCall', call);
  }
}

/** Cold start from a call notification (full-screen, tap or Accept). */
export async function handleInitialNotification() {
  const initial = await notifee.getInitialNotification();
  if (!initial) return;
  const data = initial.notification.data as Record<string, unknown> | undefined;
  const call = parseCall(data);
  if (!call) {
    if (data?.type === 'missed_call') {
      navigateWhenReady('ConsultDetail', { id: String(data.consultId) });
    }
    return;
  }
  if (initial.pressAction.id === 'accept') {
    await answerCall(call, 'accept');
  } else if (call.expiresAt > Date.now()) {
    useIncomingCall.setState({ call });
    navigateWhenReady('IncomingCall', call);
  }
}

/** While the app is open: an incoming call also opens the ringing screen. */
export async function handleForegroundMessage(message: RemoteMessage) {
  await handleRemoteMessage(message);
  const call = parseCall(message.data as Record<string, unknown> | undefined);
  if (call && call.expiresAt > Date.now()) {
    navigateWhenReady('IncomingCall', call);
  }
}
