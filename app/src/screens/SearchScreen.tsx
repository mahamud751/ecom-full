/** Search with live suggestions + grouped results. */
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { http } from '../api/client';
import { mediaUrl } from '../config';
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

  async function search(term: string) {
    const query = term.trim();
    if (!query) return;
    setQ(query);
    setShowSugs(false);
    setSearching(true);
    try {
      const res = await http.get('/search', { params: { q: query } });
      setHits(res.data.hits ?? []);
    } catch {
      setHits([]);
    } finally {
      setSearching(false);
    }
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
        <Pressable onPress={() => void search(q)} style={styles.goBtn}>
          <Text style={styles.goText}>Search</Text>
        </Pressable>
      </View>

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
