/** My consultations (by phone) + consult detail with call entry. */
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import {
  Badge,
  Button,
  Card,
  EmptyView,
  ErrorView,
  Field,
  Loading,
  statusLabel,
  statusTone,
} from '../components/ui';
import { storage } from '../lib/storage';
import { colors, formatPrice } from '../theme';
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
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.h2}>My consultations</Text>
      <Field
        label="Your phone number"
        value={phone}
        onChangeText={setPhone}
        placeholder="01XXXXXXXXX"
        keyboardType="phone-pad"
      />
      <Button
        label="Find my consultations"
        onPress={() => void load(phone)}
        loading={loading}
      />

      {error ? <Text style={styles.err}>{error}</Text> : null}
      {rows?.map(r => (
        <Card
          key={r.id}
          style={{ padding: 14, marginTop: 10 }}
          onPress={() => navigation.navigate('ConsultDetail', { id: r.id })}
        >
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text style={styles.consultNo}>{r.consultNumber}</Text>
            <Badge label={statusLabel(r.status)} tone={statusTone(r.status)} />
          </View>
          <Text style={styles.docName}>
            {r.doctor.name} · {r.doctor.specialty}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 4,
            }}
          >
            <Text style={styles.meta}>
              {r.type === 'AUDIO' ? 'Voice' : 'Video'} ·{' '}
              {new Date(r.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.fee}>{formatPrice(r.fee)}</Text>
          </View>
        </Card>
      ))}
      {rows && rows.length === 0 ? (
        <EmptyView
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
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={styles.consultNo}>{consult.consultNumber}</Text>
        <Badge
          label={statusLabel(consult.status)}
          tone={statusTone(consult.status)}
        />
      </View>

      <Card style={{ padding: 14, marginTop: 14 }}>
        <Text style={styles.h3}>{consult.doctor.name}</Text>
        <Text style={styles.meta}>{consult.doctor.specialty}</Text>
        <Text style={styles.meta}>Patient: {consult.patientName}</Text>
        {consult.symptoms ? (
          <Text style={styles.meta}>Symptoms: {consult.symptoms}</Text>
        ) : null}
        <Text style={styles.fee}>
          {formatPrice(consult.fee)} ·{' '}
          {consult.type === 'AUDIO' ? 'Voice call' : 'Video call'}
        </Text>
      </Card>

      {joinable ? (
        <Button
          label={
            consult.type === 'AUDIO' ? 'Join voice call' : 'Join video call'
          }
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

      {consult.status === 'PENDING' || consult.status === 'CONFIRMED' ? (
        <Button
          label="Cancel consultation"
          variant="outline"
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

      {consult.prescription ? (
        <Pressable
          onPress={() =>
            navigation.navigate('PrescriptionView', {
              id: consult.prescription!.id,
            })
          }
        >
          <Card style={{ padding: 14, marginTop: 14 }}>
            <Text style={styles.h3}>📝 Prescription ready</Text>
            {consult.prescription.diagnosis ? (
              <Text style={styles.meta}>
                Diagnosis: {consult.prescription.diagnosis}
              </Text>
            ) : null}
            <Text style={styles.viewLink}>Tap to view →</Text>
          </Card>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 12 },
  h3: { fontSize: 15, fontWeight: '700', color: colors.ink },
  consultNo: { fontSize: 16, fontWeight: '800', color: colors.forest },
  docName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 6,
  },
  meta: { fontSize: 12.5, color: colors.inkMuted, marginTop: 4 },
  fee: { fontSize: 14, fontWeight: '800', color: colors.forest, marginTop: 6 },
  err: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  viewLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.forestMid,
    marginTop: 8,
  },
});
