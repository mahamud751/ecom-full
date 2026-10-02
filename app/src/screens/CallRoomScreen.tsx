/**
 * Agora call room (react-native-agora v4).
 * Patient joins the consult channel with the stable uid (2001) issued by
 * POST /agora/token. Video or audio depending on the consult type.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  VideoSourceType,
  createAgoraRtcEngine,
  type IRtcEngine,
} from 'react-native-agora';
import { http, apiErrorMessage } from '../api/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../components/AppIcon';
import { colors } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootParamList, 'CallRoom'>;

type TokenData = {
  appId: string;
  token: string;
  channelName: string;
  uid: number;
  consultType: 'VIDEO' | 'AUDIO';
  doctorName: string;
};

export function CallRoomScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { consultationId, mode } = route.params;
  const engineRef = useRef<IRtcEngine | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Connecting…');
  const [remoteUid, setRemoteUid] = useState<number | undefined>(undefined);
  const [, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let engine: IRtcEngine | null = null;

    async function start() {
      try {
        const res = await http.post('/agora/token', {
          consultationId,
          role: 'patient',
        });
        const data = res.data as TokenData;
        if (cancelled) return;
        setTokenData(data);

        engine = createAgoraRtcEngine();
        engineRef.current = engine;
        engine.initialize({
          appId: data.appId,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });

        engine.registerEventHandler({
          onJoinChannelSuccess: () => {
            setJoined(true);
            setStatus('Connected — waiting for the doctor');
          },
          onUserJoined: (_conn, uid) => {
            setRemoteUid(uid);
            setStatus(`In call with ${data.doctorName}`);
          },
          onUserOffline: () => {
            setRemoteUid(undefined);
            setStatus('Doctor left the call');
          },
          onError: err => {
            setStatus(`Call error (${err})`);
          },
        });

        if (data.consultType !== 'AUDIO') {
          engine.enableVideo();
          engine.setupLocalVideo({
            sourceType: VideoSourceType.VideoSourceCameraPrimary,
          });
          engine.startPreview();
        } else {
          engine.enableAudio();
        }

        engine.joinChannel(data.token, data.channelName, data.uid, {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        });
      } catch (err) {
        if (!cancelled)
          setError(apiErrorMessage(err, 'Could not start the call'));
      }
    }

    void start();

    return () => {
      cancelled = true;
      try {
        engineRef.current?.leaveChannel();
        engineRef.current?.release();
      } catch {
        /* engine may already be torn down */
      }
      engineRef.current = null;
    };
  }, [consultationId]);

  function toggleMic() {
    const next = !micOn;
    setMicOn(next);
    engineRef.current?.muteLocalAudioStream(!next);
  }

  function endCall() {
    void http
      .patch(`/consultations/${consultationId}`, { action: 'end' })
      .catch(() => undefined);
    navigation.goBack();
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.statusText}>{error}</Text>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isVideo = mode === 'VIDEO' && tokenData?.consultType !== 'AUDIO';

  return (
    <View style={styles.root}>
      {isVideo ? (
        remoteUid !== undefined ? (
          <RtcSurfaceView canvas={{ uid: remoteUid }} style={styles.remote} />
        ) : (
          <View style={[styles.remote, styles.waiting]}>
            <ActivityIndicator color={colors.gold} size="large" />
            <Text style={styles.waitingText}>{status}</Text>
          </View>
        )
      ) : (
        <View style={[styles.remote, styles.waiting]}>
          <View style={styles.ring2}>
            <View style={styles.ring1}>
              <View style={styles.audioAvatar}>
                <AppIcon name="stethoscope" color={colors.gold} size={44} strokeWidth={1.6} />
              </View>
            </View>
          </View>
          <Text style={styles.audioTitle}>Voice consultation</Text>
          <Text style={styles.waitingText}>{status}</Text>
        </View>
      )}

      {isVideo ? (
        <View style={styles.localWrap}>
          <RtcSurfaceView canvas={{ uid: 0 }} style={styles.local} />
        </View>
      ) : null}

      <View style={[styles.controls, { bottom: insets.bottom + 28 }]}>
        <View style={styles.ctlItem}>
          <Pressable
            style={[styles.ctlBtn, !micOn && styles.ctlBtnOff]}
            onPress={toggleMic}
            accessibilityLabel={micOn ? 'Mute' : 'Unmute'}
          >
            <AppIcon
              name={micOn ? 'mic' : 'micOff'}
              color={micOn ? colors.white : colors.forestDeep}
              size={26}
            />
          </Pressable>
          <Text style={styles.ctlLabel}>{micOn ? 'Mute' : 'Unmute'}</Text>
        </View>
        <View style={styles.ctlItem}>
          <Pressable style={styles.endBtn} onPress={endCall} accessibilityLabel="End call">
            <View style={{ transform: [{ rotate: '135deg' }] }}>
              <AppIcon name="phone" color={colors.white} size={28} filled />
            </View>
          </Pressable>
          <Text style={styles.ctlLabel}>End</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.forestDeep },
  center: {
    flex: 1,
    backgroundColor: colors.forestDeep,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  remote: { flex: 1 },
  waiting: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  waitingText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  ring2: { padding: 22, borderRadius: 120, backgroundColor: 'rgba(201,162,39,0.06)' },
  ring1: { padding: 18, borderRadius: 100, backgroundColor: 'rgba(201,162,39,0.1)' },
  audioAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioTitle: { color: colors.white, fontSize: 20, fontWeight: '800', marginTop: 12 },
  localWrap: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 110,
    height: 150,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  local: { width: '100%', height: '100%' },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  ctlItem: { alignItems: 'center', gap: 8 },
  ctlLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },
  ctlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctlBtnOff: { backgroundColor: colors.white },
  endBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  statusText: { color: colors.white, fontSize: 15, textAlign: 'center' },
});
