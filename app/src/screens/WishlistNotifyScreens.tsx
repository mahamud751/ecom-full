/** Wishlist + product alert (notify) screens. */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import { thumbUrl } from '../config';
import {
  Badge,
  Button,
  Card,
  EmptyView,
  ErrorView,
  Field,
  IconTile,
  Loading,
  SmartImage,
} from '../components/ui';
import { ProductCard } from '../components/ProductCard';
import { useWishlist } from '../store/wishlist';
import { colors, formatPrice, radii } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

/* ── Wishlist ────────────────────────────────────────────────────── */

type WishItem = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  price: number;
  stock: number;
  inStock: boolean;
};

type WishProps = NativeStackScreenProps<RootParamList, 'Wishlist'>;

export function WishlistScreen({ navigation }: WishProps) {
  const ids = useWishlist(s => s.ids);
  const [items, setItems] = useState<WishItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!ids.length) {
      setItems([]);
      return;
    }
    http
      .post('/wishlist/status', { ids })
      .then(res => setItems(res.data.products ?? []))
      .catch(err => setError(apiErrorMessage(err)));
  }, [ids]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!items) return <Loading />;
  if (items.length === 0) {
    return (
      <View style={[styles.root, { justifyContent: 'center' }]}>
        <EmptyView
          icon="heart"
          title="Your wishlist is empty"
          hint="Tap the heart on any product to save it here."
          action={{ label: 'Explore products', onPress: () => navigation.navigate('Products', { title: 'All products' }) }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.count}>
        {items.length} saved item{items.length > 1 ? 's' : ''}
      </Text>
      <View style={styles.grid}>
        {items.map(i => (
          <ProductCard
            key={i.id}
            width="48.3%"
            product={{ ...i, stock: i.inStock ? Math.max(i.stock, 1) : 0 }}
            onPress={() => navigation.navigate('ProductDetail', { slug: i.slug })}
          />
        ))}
      </View>
    </ScrollView>
  );
}

/* ── Notifications (product alerts) ──────────────────────────────── */

type NotifyRow = {
  id: string;
  contact: string;
  status: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    image?: string | null;
    price: number;
  };
};

type NotifyProps = NativeStackScreenProps<RootParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: NotifyProps) {
  const [contact, setContact] = useState('');
  const [rows, setRows] = useState<NotifyRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!contact.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await http.get('/notify', {
        params: { contact: contact.trim() },
      });
      setRows(res.data.notifies ?? []);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={{ padding: 16 }}>
        <View style={styles.head}>
          <IconTile name="bell" size={44} color={colors.goldDeep} bg={colors.goldSoft} />
          <View style={{ flex: 1 }}>
            <Text style={styles.h3}>Back-in-stock alerts</Text>
            <Text style={styles.sub}>Use the email or phone you subscribed with.</Text>
          </View>
        </View>
        <Field
          icon="mail"
          value={contact}
          onChangeText={setContact}
          placeholder="you@email.com or 01XXXXXXXXX"
          autoCapitalize="none"
        />
        <Button label="Show my alerts" icon="search" onPress={() => void load()} loading={loading} />
      </Card>

      {error ? <Text style={styles.err}>{error}</Text> : null}
      {rows?.map(r => {
        const ready = r.status === 'READY';
        return (
          <Card
            key={r.id}
            style={styles.row}
            onPress={() => navigation.navigate('ProductDetail', { slug: r.product.slug })}
          >
            <SmartImage
              uri={r.product.image ? thumbUrl(r.product.image, 64) : null}
              style={styles.img}
              resizeMode="contain"
              icon="pill"
              iconSize={22}
            />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={2} style={styles.name}>
                {r.product.name}
              </Text>
              <View style={styles.rowFoot}>
                <Text style={styles.price}>{formatPrice(r.product.price)}</Text>
                <Badge label={ready ? 'Back in stock' : 'Watching'} tone={ready ? 'green' : 'gold'} dot />
              </View>
            </View>
          </Card>
        );
      })}
      {rows && rows.length === 0 ? (
        <EmptyView
          icon="bell"
          title="No alerts yet"
          hint="Subscribe on any out-of-stock product to get notified."
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  count: { fontSize: 12.5, fontWeight: '700', color: colors.inkMuted, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  h3: { fontSize: 16, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 12.5, color: colors.inkMuted, marginTop: 3 },
  row: { flexDirection: 'row', gap: 12, padding: 12, marginTop: 12, alignItems: 'center' },
  rowFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  img: { width: 64, height: 64, borderRadius: radii.md, backgroundColor: colors.surfaceAlt },
  name: { fontSize: 14, fontWeight: '700', color: colors.ink },
  price: { fontSize: 15, fontWeight: '800', color: colors.ink },
  err: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
});
