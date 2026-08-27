/** Wishlist + product alert (notify) screens. */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import { mediaUrl } from '../config';
import {
  Badge,
  Button,
  Card,
  EmptyView,
  ErrorView,
  Field,
  Loading,
} from '../components/ui';
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
  const toggle = useWishlist(s => s.toggle);
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
      <EmptyView
        title="Your wishlist is empty"
        hint="Tap the heart on any product to save it here."
      />
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 14 }}>
      {items.map(i => (
        <Card
          key={i.id}
          style={{
            flexDirection: 'row',
            gap: 12,
            padding: 12,
            marginBottom: 10,
          }}
          onPress={() => navigation.navigate('ProductDetail', { slug: i.slug })}
        >
          {i.image ? (
            <Image source={{ uri: mediaUrl(i.image) }} style={styles.img} />
          ) : (
            <View style={[styles.img, { backgroundColor: colors.brandSoft }]} />
          )}
          <View style={{ flex: 1 }}>
            <Text numberOfLines={2} style={styles.name}>
              {i.name}
            </Text>
            <Text style={styles.price}>{formatPrice(i.price)}</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 4,
              }}
            >
              {i.inStock ? (
                <Badge label="In stock" tone="green" />
              ) : (
                <Badge label="Out of stock" tone="red" />
              )}
              <Pressable onPress={() => toggle(i.id)} hitSlop={8}>
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          </View>
        </Card>
      ))}
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
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.h2}>Product alerts</Text>
      <Text style={styles.sub}>
        Enter the email/phone you used to subscribe to back-in-stock alerts.
      </Text>
      <Field
        label="Email or phone"
        value={contact}
        onChangeText={setContact}
        placeholder="you@email.com"
      />
      <Button
        label="Load alerts"
        onPress={() => void load()}
        loading={loading}
      />

      {error ? <Text style={styles.err}>{error}</Text> : null}
      {rows?.map(r => (
        <Card
          key={r.id}
          style={{ flexDirection: 'row', gap: 12, padding: 12, marginTop: 10 }}
          onPress={() =>
            navigation.navigate('ProductDetail', { slug: r.product.slug })
          }
        >
          {r.product.image ? (
            <Image
              source={{ uri: mediaUrl(r.product.image) }}
              style={styles.img}
            />
          ) : (
            <View style={[styles.img, { backgroundColor: colors.brandSoft }]} />
          )}
          <View style={{ flex: 1 }}>
            <Text numberOfLines={2} style={styles.name}>
              {r.product.name}
            </Text>
            <Text style={styles.price}>{formatPrice(r.product.price)}</Text>
            <Badge
              label={r.status === 'READY' ? 'Back in stock!' : 'Watching'}
              tone={r.status === 'READY' ? 'green' : 'gold'}
            />
          </View>
        </Card>
      ))}
      {rows && rows.length === 0 ? (
        <EmptyView
          title="No alerts yet"
          hint="Subscribe on any out-of-stock product to get notified."
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 13, color: colors.inkMuted, marginTop: 6, marginBottom: 14 },
  img: { width: 64, height: 64, borderRadius: 10 },
  name: { fontSize: 13.5, fontWeight: '600', color: colors.ink },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.forest,
    marginTop: 4,
  },
  remove: { fontSize: 12, color: colors.danger, fontWeight: '600' },
  err: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
});
