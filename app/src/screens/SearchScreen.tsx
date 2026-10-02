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
  ScrollView,
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
import { AppIcon, type IconName } from '../components/AppIcon';
import { Chip, EmptyView, IconTile, Loading, SmartImage } from '../components/ui';
import { colors, formatPrice, radii, shadows } from '../theme';
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

  const hitIcon = (t: Hit['type']): IconName =>
    t === 'doctor' ? 'stethoscope' : t === 'lab' ? 'flask' : 'pill';

  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        <View style={styles.field}>
          <AppIcon name="search" color={colors.forest} size={19} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Medicines, doctors…"
            placeholderTextColor={colors.inkFaint}
            returnKeyType="search"
            onSubmitEditing={() => void search(q)}
            style={styles.input}
          />
          {q.length > 0 ? (
            <Pressable onPress={() => setQ('')} hitSlop={8} style={styles.clear}>
              <AppIcon name="close" color={colors.inkMuted} size={13} strokeWidth={2.6} />
            </Pressable>
          ) : null}
          <View style={styles.fieldDivider} />
          <Pressable
            onPress={() => void toggleVoice()}
            style={[styles.iconBtn, listening && styles.iconBtnActive]}
            hitSlop={6}
            accessibilityLabel="Search by voice"
          >
            <AppIcon
              name="mic"
              color={listening ? colors.white : colors.forestMid}
              size={18}
              filled={listening}
            />
          </Pressable>
          <Pressable
            onPress={pickImage}
            style={styles.iconBtn}
            hitSlop={6}
            accessibilityLabel="Search by image"
          >
            <AppIcon name="camera" color={colors.forestMid} size={18} />
          </Pressable>
        </View>
        <Pressable
          onPress={() => void search(q)}
          style={({ pressed }) => [styles.goBtn, pressed && { opacity: 0.85 }]}
          accessibilityLabel="Search"
        >
          <AppIcon name="arrowRight" color={colors.white} size={20} strokeWidth={2.2} />
        </Pressable>
      </View>

      {listening ? (
        <View style={styles.listeningRow}>
          <View style={styles.pulse}>
            <AppIcon name="mic" color={colors.white} size={16} filled />
          </View>
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
          <Pressable onPress={clearImage} hitSlop={8} style={styles.clear}>
            <AppIcon name="close" color={colors.inkMuted} size={13} strokeWidth={2.6} />
          </Pressable>
        </View>
      ) : null}

      {showSugs && sugs.length > 0 ? (
        <View style={styles.sugList}>
          {sugs.slice(0, 8).map((s, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [
                styles.sugRow,
                i === Math.min(sugs.length, 8) - 1 && { borderBottomWidth: 0 },
                pressed && { backgroundColor: colors.surfaceAlt },
              ]}
              onPress={() => void search(s.label)}
            >
              {s.image ? (
                <SmartImage uri={mediaUrl(s.image)} style={styles.sugImg} icon="pill" iconSize={14} />
              ) : (
                <View style={styles.sugIcon}>
                  <AppIcon name="search" color={colors.inkMuted} size={14} />
                </View>
              )}
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
            icon="search"
            title="No results"
            hint={`Nothing matched “${q}”. Try another term.`}
          />
        ) : (
          <FlatList
            data={hits}
            keyExtractor={h => `${h.type}-${h.id}`}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={styles.resultCount}>
                {hits.length} result{hits.length > 1 ? 's' : ''}
              </Text>
            }
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.hit, pressed && { transform: [{ scale: 0.985 }] }]}
                onPress={() => openHit(item)}
              >
                <SmartImage
                  uri={item.image ? mediaUrl(item.image) : null}
                  style={styles.hitImg}
                  resizeMode="contain"
                  icon={hitIcon(item.type)}
                  iconSize={24}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.hitType}>
                    <AppIcon name={hitIcon(item.type)} color={colors.forestMid} size={11} />
                    <Text style={styles.hitTypeText}>{item.type}</Text>
                  </View>
                  <Text style={styles.hitTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text style={styles.hitSub} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>
                {typeof item.price === 'number' ? (
                  <Text style={styles.hitPrice}>{formatPrice(item.price)}</Text>
                ) : (
                  <AppIcon name="chevronRight" color={colors.inkFaint} size={18} />
                )}
              </Pressable>
            )}
          />
        )
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.blockTitle}>Popular searches</Text>
          <View style={styles.popular}>
            {POPULAR.map(p => (
              <Chip key={p} label={p} icon="search" onPress={() => { setQ(p); void search(p); }} />
            ))}
          </View>
          <Text style={[styles.blockTitle, { marginTop: 26 }]}>Search smarter</Text>
          <View style={styles.tips}>
            {[
              { icon: 'mic' as const, t: 'Say it', s: 'Tap the mic and speak a medicine name' },
              { icon: 'camera' as const, t: 'Snap it', s: 'Photograph a strip or box to find it' },
              { icon: 'stethoscope' as const, t: 'Find a doctor', s: 'Search by name or specialty' },
            ].map((x, i) => (
              <View key={x.t} style={[styles.tip, i > 0 && styles.tipDivider]}>
                <IconTile name={x.icon} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tipT}>{x.t}</Text>
                  <Text style={styles.tipS}>{x.s}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const POPULAR = ['Napa', 'Vitamin C', 'Sunscreen', 'Baby diaper', 'Seclo', 'Face wash', 'Protein'];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14 },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.forestMid,
    borderRadius: radii.lg,
    paddingLeft: 14,
    paddingRight: 5,
    height: 52,
  },
  input: { flex: 1, fontSize: 15, color: colors.ink, paddingVertical: 0, marginLeft: 4 },
  clear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.lineSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldDivider: { width: 1, height: 22, backgroundColor: colors.line, marginHorizontal: 4 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: { backgroundColor: colors.forest },
  goBtn: {
    width: 52,
    height: 52,
    backgroundColor: colors.forest,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  listeningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    backgroundColor: colors.brandLight,
    borderRadius: radii.md,
  },
  pulse: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningText: { fontSize: 13.5, color: colors.forest, fontWeight: '700' },
  imgPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadows.card,
  },
  imgPreview: { width: 48, height: 48, borderRadius: 10 },
  imgUploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  imgTip: { fontSize: 12.5, color: colors.inkMuted, flexShrink: 1 },
  sugList: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    overflow: 'hidden',
    ...shadows.card,
  },
  sugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  sugImg: { width: 34, height: 34, borderRadius: 8 },
  sugIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.lineSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sugLabel: { flex: 1, fontSize: 14, color: colors.ink, fontWeight: '500' },
  sugMeta: { fontSize: 12, color: colors.forestMid, fontWeight: '700' },
  resultCount: { fontSize: 12.5, fontWeight: '700', color: colors.inkMuted, marginBottom: 10 },
  hit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 10,
    marginBottom: 10,
    ...shadows.card,
  },
  hitImg: { width: 62, height: 62, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  hitType: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  hitTypeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.forestMid,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  hitTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, lineHeight: 19 },
  hitSub: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  hitPrice: { fontSize: 15, fontWeight: '800', color: colors.ink },
  blockTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: 12 },
  popular: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tips: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadows.card,
  },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  tipDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  tipT: { fontSize: 14, fontWeight: '700', color: colors.ink },
  tipS: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
});
