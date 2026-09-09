/** Search with live suggestions + grouped results, incl. image search. */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';
import Voice, {
  type SpeechErrorEvent,
  type SpeechResultsEvent,
} from '@react-native-voice/voice';
import { http } from '../api/client';
import { mediaUrl } from '../config';
import { AppIcon } from '../components/AppIcon';
import { EmptyView, Loading } from '../components/ui';
import { colors, formatPrice, radii } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootParamList, 'Search'>;

type Hit = {
  type: 'product' | 'doctor' | 'lab';
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  image?: string | null;
  price?: number;
};

type Suggestion = {
  type: string;
  label: string;
  href?: string;
  image?: string | null;
  meta?: string;
  slug?: string;
};

export function SearchScreen({ navigation }: Props) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [sugs, setSugs] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSugs, setShowSugs] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageTip, setImageTip] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [listening, setListening] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live suggestions (debounced)
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setSugs([]);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      http
        .get('/search/suggest', { params: { q: query } })
        .then(res => {
          setSugs(res.data.suggestions ?? []);
          setShowSugs(true);
        })
        .catch(() => setSugs([]));
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  const search = useCallback(async (term: string, mode: 'text' | 'voice' = 'text') => {
    const query = term.trim();
    if (!query) return;
    setQ(query);
    setImagePreview(null);
    setImageTip(null);
    setShowSugs(false);
    setSearching(true);
    try {
      const res = await http.get('/search', { params: { q: query, mode } });
      setHits(res.data.hits ?? []);
    } catch {
      setHits([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Voice search — on-device speech-to-text, then a normal query (mirrors web).
  useEffect(() => {
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const text = e.value?.[0]?.trim();
      if (text) void search(text, 'voice');
    };
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
      const text = e.value?.[0];
      if (text) setQ(text);
    };
    Voice.onSpeechEnd = () => setListening(false);
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      setListening(false);
      const code = e.error?.code ?? '';
      // 7 / "No match" and 6 / speech-timeout are benign (user said nothing).
      if (code !== '7' && code !== '6') {
        Alert.alert('Voice search', "Didn't catch that — try again.");
      }
    };
    return () => {
      Voice.destroy()
        .then(() => Voice.removeAllListeners())
        .catch(() => {});
    };
  }, [search]);

  async function toggleVoice() {
    if (listening) {
      try {
        await Voice.stop();
      } catch {
        /* ignore */
      }
      setListening(false);
      return;
    }
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone access',
          message: 'Ahona uses the mic to search by voice.',
          buttonPositive: 'Allow',
          buttonNegative: 'Not now',
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          'Microphone blocked',
          'Enable microphone access in Settings to use voice search.',
        );
        return;
      }
    }
    setShowSugs(false);
    setQ('');
    try {
      setListening(true);
      await Voice.start('en-US');
    } catch {
      setListening(false);
      Alert.alert('Voice search', 'Voice search is unavailable on this device.');
    }
  }

  async function searchByImage(asset: Asset) {
    if (!asset.uri) return;
    setShowSugs(false);
    setImagePreview(asset.uri);
    setUploadingImage(true);
    setSearching(true);
    try {
      const fd = new FormData();
      // React Native's FormData accepts this file-shape object for uploads.
      fd.append('file', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'photo.jpg',
      } as unknown as Blob);
      fd.append('hub', 'all');
      if (q.trim()) fd.append('hint', q.trim());

      const res = await http.post('/search/image', fd);
      setHits(res.data.hits ?? []);
      setImageTip(res.data.tip ?? null);
      if (res.data.derivedQuery) setQ(res.data.derivedQuery);
    } catch (err) {
      setHits([]);
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Image search failed. Please try again.';
      Alert.alert('Image search', message);
    } finally {
      setUploadingImage(false);
      setSearching(false);
    }
  }

  function pickImage() {
    Alert.alert('Search by image', 'Take a photo or choose one to match against our catalog.', [
      {
        text: 'Take Photo',
        onPress: () =>
          launchCamera({ mediaType: 'photo', quality: 0.8 }, res => {
            const asset = res.assets?.[0];
            if (asset) void searchByImage(asset);
          }),
      },
      {
        text: 'Choose from Gallery',
        onPress: () =>
          launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, res => {
            const asset = res.assets?.[0];
            if (asset) void searchByImage(asset);
          }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function clearImage() {
    setImagePreview(null);
    setImageTip(null);
  }

  function openHit(hit: Hit) {
    if (hit.type === 'product')
      navigation.navigate('ProductDetail', { slug: hit.slug });
    else if (hit.type === 'doctor')
      navigation.navigate('DoctorDetail', { slug: hit.slug });
    else if (hit.type === 'lab') navigation.navigate('Lab');
  }

  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        <TextInput
          autoFocus
          value={q}
          onChangeText={setQ}
          placeholder="Search medicines, doctors, tests…"
          placeholderTextColor={colors.inkMuted}
          returnKeyType="search"
          onSubmitEditing={() => void search(q)}
          style={styles.input}
        />
        <Pressable
          onPress={() => void toggleVoice()}
          style={[styles.iconBtn, listening && styles.iconBtnActive]}
          hitSlop={6}
          accessibilityLabel="Search by voice"
        >
          <AppIcon
            name="mic"
            color={listening ? colors.white : colors.forestMid}
            size={19}
            filled={listening}
          />
        </Pressable>
        <Pressable
          onPress={pickImage}
          style={styles.iconBtn}
          hitSlop={6}
          accessibilityLabel="Search by image"
        >
          <AppIcon name="camera" color={colors.forestMid} size={19} />
        </Pressable>
        <Pressable onPress={() => void search(q)} style={styles.goBtn}>
          <Text style={styles.goText}>Search</Text>
        </Pressable>
      </View>

      {listening ? (
        <View style={styles.listeningRow}>
          <ActivityIndicator size="small" color={colors.forest} />
          <Text style={styles.listeningText}>Listening… speak now</Text>
        </View>
      ) : null}

      {imagePreview ? (
        <View style={styles.imgPreviewRow}>
          <Image source={{ uri: imagePreview }} style={styles.imgPreview} />
          <View style={{ flex: 1 }}>
            {uploadingImage ? (
              <View style={styles.imgUploadingRow}>
                <ActivityIndicator size="small" color={colors.forest} />
                <Text style={styles.imgTip}>Searching catalog from your image…</Text>
              </View>
            ) : imageTip ? (
              <Text style={styles.imgTip} numberOfLines={2}>
                {imageTip}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={clearImage} hitSlop={8}>
            <Text style={styles.imgClear}>Clear</Text>
          </Pressable>
        </View>
      ) : null}

      {showSugs && sugs.length > 0 ? (
        <View style={styles.sugList}>
          {sugs.slice(0, 8).map((s, i) => (
            <Pressable
              key={i}
              style={styles.sugRow}
              onPress={() => void search(s.label)}
            >
              {s.image ? (
                <Image
                  source={{ uri: mediaUrl(s.image) }}
                  style={styles.sugImg}
                />
              ) : null}
              <Text style={styles.sugLabel} numberOfLines={1}>
                {s.label}
              </Text>
              {s.meta ? <Text style={styles.sugMeta}>{s.meta}</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {searching ? (
        <Loading />
      ) : hits ? (
        hits.length === 0 ? (
          <EmptyView
            title="No results"
            hint={`Nothing matched “${q}”. Try another term.`}
          />
        ) : (
          <FlatList
            data={hits}
            keyExtractor={h => `${h.type}-${h.id}`}
            contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
            renderItem={({ item }) => (
              <Pressable style={styles.hit} onPress={() => openHit(item)}>
                {item.image ? (
                  <Image
                    source={{ uri: mediaUrl(item.image) }}
                    style={styles.hitImg}
                  />
                ) : (
                  <View
                    style={[
                      styles.hitImg,
                      { backgroundColor: colors.brandSoft },
                    ]}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.hitTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text style={styles.hitSub}>{item.subtitle}</Text>
                  ) : null}
                </View>
                {typeof item.price === 'number' ? (
                  <Text style={styles.hitPrice}>{formatPrice(item.price)}</Text>
                ) : null}
              </Pressable>
            )}
          />
        )
      ) : (
        <EmptyView
          title="Search Ahona"
          hint="Medicines, beauty, doctors and lab tests — all in one place."
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  bar: { flexDirection: 'row', gap: 8, padding: 12 },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  goBtn: {
    backgroundColor: colors.forest,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  listeningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.forest,
  },
  listeningText: { fontSize: 12.5, color: colors.forest, fontWeight: '700' },
  imgPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  imgPreview: { width: 44, height: 44, borderRadius: 8 },
  imgUploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  imgTip: { fontSize: 12, color: colors.inkMuted, flexShrink: 1 },
  imgClear: { fontSize: 12.5, fontWeight: '700', color: colors.danger },
  sugList: {
    marginHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  sugImg: { width: 30, height: 30, borderRadius: 6 },
  sugLabel: { flex: 1, fontSize: 13.5, color: colors.ink },
  sugMeta: { fontSize: 12, color: colors.forestMid, fontWeight: '700' },
  hit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    marginBottom: 8,
  },
  hitImg: { width: 54, height: 54, borderRadius: 8 },
  hitTitle: { fontSize: 13.5, fontWeight: '600', color: colors.ink },
  hitSub: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  hitPrice: { fontSize: 14, fontWeight: '800', color: colors.forest },
});
