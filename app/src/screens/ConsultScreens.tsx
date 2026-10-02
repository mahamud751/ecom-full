/** My consultations (by phone) + consult detail with call entry. */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import {
  Badge,
  Button,
  Card,
  EmptyView,
  ErrorView,
  Field,
  Gradient,
  IconTile,
  Loading,
  statusLabel,
  statusTone,
} from '../components/ui';
import { storage } from '../lib/storage';
import { AppIcon } from '../components/AppIcon';
import { colors, formatPrice, gradients, radii } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

type ConsultRow = {
  id: string;
  consultNumber: string;
  status: string;
  type: string;
  fee: number;
  scheduledAt?: string | null;
  createdAt: string;
  patientName: string;
  doctor: { name: string; specialty: string; slug: string };
  prescription?: { id: string } | null;
};

/* ── List ────────────────────────────────────────────────────────── */

type ListProps = NativeStackScreenProps<RootParamList, 'MyConsultations'>;

export function MyConsultationsScreen({ navigation }: ListProps) {
  const [phone, setPhone] = useState(
    storage.getString('htp_patient_phone') ?? '',
  );
  const [rows, setRows] = useState<ConsultRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: string) => {
    if (!p.trim()) return;
    setLoading(true);
    setError(null);
    try {
      storage.set('htp_patient_phone', p.trim());
      const res = await http.get('/consultations', {
        params: { phone: p.trim() },
      });
      setRows(res.data.consultations ?? []);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (phone.trim().length >= 8) void load(phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Card style={{ padding: 16 }}>
        <View style={styles.findHead}>
          <IconTile name="calendar" size={44} />
          <View style={{ flex: 1 }}>
            <Text style={styles.h3}>Find your consultations</Text>
            <Text style={styles.meta}>We look them up by the phone you booked with.</Text>
          </View>
        </View>
        <Field
          icon="phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="01XXXXXXXXX"
          keyboardType="phone-pad"
        />
        <Button
          label="Find consultations"
          icon="search"
          onPress={() => void load(phone)}
          loading={loading}
        />
      </Card>

      {error ? <Text style={styles.err}>{error}</Text> : null}
      {rows && rows.length > 0 ? (
        <Text style={styles.count}>
          {rows.length} consultation{rows.length > 1 ? 's' : ''}
        </Text>
      ) : null}
      {rows?.map(r => (
        <Card
          key={r.id}
          style={styles.row}
          onPress={() => navigation.navigate('ConsultDetail', { id: r.id })}
        >
          <IconTile
            name={r.type === 'AUDIO' ? 'phone' : 'video'}
            size={46}
            color={colors.forest}
            bg={colors.brandLight}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.docName} numberOfLines={1}>
              {r.doctor.name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {r.doctor.specialty} · {new Date(r.createdAt).toLocaleDateString()}
            </Text>
            <View style={styles.rowFoot}>
              <Badge label={statusLabel(r.status)} tone={statusTone(r.status)} />
              <Text style={styles.feeSm}>{formatPrice(r.fee)}</Text>
            </View>
          </View>
        </Card>
      ))}
      {rows && rows.length === 0 ? (
        <EmptyView
          icon="stethoscope"
          title="No consultations"
          hint="Booked consults for this phone will appear here."
        />
      ) : null}
    </ScrollView>
  );
}

/* ── Detail ──────────────────────────────────────────────────────── */

type DetailProps = NativeStackScreenProps<RootParamList, 'ConsultDetail'>;

type ConsultFull = ConsultRow & {
  channelName?: string;
  symptoms?: string | null;
  prescription?: {
    id: string;
    diagnosis?: string | null;
    items?: { medicine: string; dosage?: string | null }[];
  } | null;
};

export function ConsultDetailScreen({ navigation, route }: DetailProps) {
  const { id } = route.params;
  const [consult, setConsult] = useState<ConsultFull | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    http
      .get(`/consultations/${id}`)
      .then(res => setConsult(res.data.consultation))
      .catch(err => setError(apiErrorMessage(err)));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!consult) return <Loading />;

  const joinable = !['CANCELLED', 'COMPLETED'].includes(consult.status);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Gradient from={gradients.forestSoft[0]} to={gradients.forest[1]} />
        <View style={styles.heroTop}>
          <Text style={styles.heroNo}>{consult.consultNumber}</Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{statusLabel(consult.status)}</Text>
          </View>
        </View>
        <View style={styles.heroDoc}>
          <View style={styles.heroIcon}>
            <AppIcon name="stethoscope" color={colors.gold} size={26} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{consult.doctor.name}</Text>
            <Text style={styles.heroSpec}>{consult.doctor.specialty}</Text>
          </View>
        </View>
        <View style={styles.heroMeta}>
          <View style={styles.heroMetaItem}>
            <AppIcon name={consult.type === 'AUDIO' ? 'phone' : 'video'} color={colors.white} size={15} />
            <Text style={styles.heroMetaText}>
              {consult.type === 'AUDIO' ? 'Voice call' : 'Video call'}
            </Text>
          </View>
          <View style={styles.heroMetaItem}>
            <AppIcon name="wallet" color={colors.white} size={15} />
            <Text style={styles.heroMetaText}>{formatPrice(consult.fee)}</Text>
          </View>
        </View>
      </View>

      <Card style={{ padding: 16, marginTop: 14 }}>
        <Text style={styles.cap}>PATIENT</Text>
        <Text style={styles.h3}>{consult.patientName}</Text>
        {consult.symptoms ? (
          <>
            <Text style={[styles.cap, { marginTop: 14 }]}>SYMPTOMS</Text>
            <Text style={styles.body}>{consult.symptoms}</Text>
          </>
        ) : null}
      </Card>

      {joinable ? (
        <Button
          label={consult.type === 'AUDIO' ? 'Join voice call' : 'Join video call'}
          icon={consult.type === 'AUDIO' ? 'phone' : 'video'}
          size="lg"
          style={{ marginTop: 16 }}
          onPress={() =>
            navigation.navigate('CallRoom', {
              consultationId: consult.id,
              channel: consult.channelName ?? consult.consultNumber,
              mode: consult.type === 'AUDIO' ? 'AUDIO' : 'VIDEO',
            })
          }
        />
      ) : null}

      {consult.prescription ? (
        <Card
          style={styles.rxCard}
          onPress={() =>
            navigation.navigate('PrescriptionView', { id: consult.prescription!.id })
          }
        >
          <IconTile name="file" size={46} color={colors.goldDeep} bg={colors.goldSoft} />
          <View style={{ flex: 1 }}>
            <Text style={styles.h3}>Prescription ready</Text>
            {consult.prescription.diagnosis ? (
              <Text style={styles.meta} numberOfLines={1}>
                {consult.prescription.diagnosis}
              </Text>
            ) : (
              <Text style={styles.meta}>Tap to view your prescription</Text>
            )}
          </View>
          <AppIcon name="chevronRight" color={colors.inkFaint} size={18} />
        </Card>
      ) : null}

      {consult.status === 'PENDING' || consult.status === 'CONFIRMED' ? (
        <Button
          label="Cancel consultation"
          variant="ghost"
          style={{ marginTop: 10 }}
          onPress={async () => {
            try {
              await http.patch(`/consultations/${consult.id}`, {
                action: 'cancel',
              });
              load();
            } catch (err) {
              setError(apiErrorMessage(err));
            }
          }}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  findHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  h3: { fontSize: 16, fontWeight: '800', color: colors.ink },
  count: { fontSize: 12.5, fontWeight: '700', color: colors.inkMuted, marginTop: 20, marginBottom: 2 },
  row: { flexDirection: 'row', gap: 14, padding: 14, marginTop: 10, alignItems: 'center' },
  rowFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  docName: { fontSize: 15, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 12.5, color: colors.inkMuted, marginTop: 3 },
  feeSm: { fontSize: 14, fontWeight: '800', color: colors.ink },
  err: { color: colors.danger, fontSize: 13, marginTop: 12, textAlign: 'center' },
  hero: { borderRadius: radii.xl, overflow: 'hidden', padding: 18 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroNo: { color: 'rgba(255,255,255,0.7)', fontSize: 12.5, fontWeight: '700', letterSpacing: 1 },
  heroBadge: {
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '800', color: colors.forestDeep },
  heroDoc: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: { color: colors.white, fontSize: 19, fontWeight: '800' },
  heroSpec: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  heroMeta: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  cap: { fontSize: 11, fontWeight: '700', color: colors.inkMuted, letterSpacing: 1, marginBottom: 4 },
  body: { fontSize: 14, color: colors.inkSoft, lineHeight: 20 },
  rxCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginTop: 14 },
});
