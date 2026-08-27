/** Prescription lookup/view (prescriptions are issued after consults). */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import { Badge, Button, Card, Field, Loading } from '../components/ui';
import { colors } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

/* ── Request / lookup by consult number ──────────────────────────── */

type ReqProps = NativeStackScreenProps<RootParamList, 'PrescriptionRequest'>;

export function PrescriptionRequestScreen({ navigation }: ReqProps) {
  const [consultNo, setConsultNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    hasRx: boolean;
    rxId?: string;
    doctor?: string;
  } | null>(null);

  async function lookup() {
    if (!consultNo.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await http.get(`/consultations/${consultNo.trim()}`);
      const c = res.data.consultation;
      if (c.prescription) {
        setResult({
          hasRx: true,
          rxId: c.prescription.id,
          doctor: c.doctor?.name,
        });
      } else {
        setResult({ hasRx: false, doctor: c.doctor?.name });
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Consultation not found'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.h2}>My prescription</Text>
      <Text style={styles.sub}>
        Prescriptions are issued by the doctor after your consultation. Enter
        your consultation number to view it.
      </Text>
      <Field
        label="Consultation number"
        value={consultNo}
        onChangeText={setConsultNo}
        placeholder="e.g. CSL-XXXXXX"
        autoCapitalize="characters"
      />
      <Button label="Look up" loading={loading} onPress={() => void lookup()} />

      {error ? <Text style={styles.err}>{error}</Text> : null}
      {result?.hasRx && result.rxId ? (
        <Card style={{ padding: 14, marginTop: 14 }}>
          <Badge label="Prescription ready" tone="green" />
          <Text style={styles.info}>
            Issued by {result.doctor ?? 'your doctor'}.
          </Text>
          <Button
            label="View prescription"
            style={{ marginTop: 10 }}
            onPress={() =>
              navigation.navigate('PrescriptionView', { id: result.rxId! })
            }
          />
        </Card>
      ) : null}
      {result && !result.hasRx ? (
        <Card style={{ padding: 14, marginTop: 14 }}>
          <Badge label="Not issued yet" tone="gold" />
          <Text style={styles.info}>
            {result.doctor
              ? `${result.doctor} hasn't issued the prescription yet.`
              : 'No prescription yet.'}{' '}
            It will appear here once your consult is complete.
          </Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

/* ── View ────────────────────────────────────────────────────────── */

type ViewProps = NativeStackScreenProps<RootParamList, 'PrescriptionView'>;

type RxDetail = {
  id: string;
  diagnosis?: string | null;
  advice?: string | null;
  followUp?: string | null;
  createdAt?: string;
  items?: {
    medicineName?: string;
    medicine?: string;
    dosage?: string | null;
    frequency?: string | null;
    duration?: string | null;
    instructions?: string | null;
  }[];
  consultation?: {
    doctor?: { name?: string } | null;
    patientName?: string;
  } | null;
};

export function PrescriptionViewScreen({ route }: ViewProps) {
  const { id } = route.params;
  const [rx, setRx] = useState<RxDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await http.get(`/prescriptions/${id}`);
        setRx(res.data.prescription ?? res.data);
      } catch (err) {
        setError(apiErrorMessage(err, 'Prescription not found'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Loading />;
  if (error || !rx) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{error ?? 'Not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.h2}>Prescription</Text>
      {rx.consultation?.doctor?.name ? (
        <Text style={styles.sub}>Dr. {rx.consultation.doctor.name}</Text>
      ) : null}
      {rx.consultation?.patientName ? (
        <Text style={styles.sub}>Patient: {rx.consultation.patientName}</Text>
      ) : null}

      {rx.diagnosis ? (
        <Card style={{ padding: 14, marginTop: 12 }}>
          <Text style={styles.label}>Diagnosis</Text>
          <Text style={styles.value}>{rx.diagnosis}</Text>
        </Card>
      ) : null}

      <Card style={{ padding: 14, marginTop: 12 }}>
        <Text style={styles.label}>Medicines</Text>
        {rx.items?.map((it, i) => (
          <View key={i} style={styles.item}>
            <Text style={styles.itemName}>
              {it.medicineName ?? it.medicine}
            </Text>
            <Text style={styles.itemMeta}>
              {[it.dosage, it.frequency, it.duration]
                .filter(Boolean)
                .join(' · ') || 'As directed'}
            </Text>
            {it.instructions ? (
              <Text style={styles.itemMeta}>{it.instructions}</Text>
            ) : null}
          </View>
        ))}
        {!rx.items?.length ? (
          <Text style={styles.sub}>No items listed.</Text>
        ) : null}
      </Card>

      {rx.advice ? (
        <Card style={{ padding: 14, marginTop: 12 }}>
          <Text style={styles.label}>Advice</Text>
          <Text style={styles.value}>{rx.advice}</Text>
        </Card>
      ) : null}
      {rx.followUp ? (
        <Card style={{ padding: 14, marginTop: 12 }}>
          <Text style={styles.label}>Follow-up</Text>
          <Text style={styles.value}>{rx.followUp}</Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 13, color: colors.inkMuted, marginTop: 4 },
  err: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  info: { fontSize: 13, color: colors.ink, marginTop: 10 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkMuted,
    marginBottom: 6,
  },
  value: { fontSize: 14, lineHeight: 20, color: colors.ink },
  item: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  itemMeta: { fontSize: 12.5, color: colors.inkMuted, marginTop: 2 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ivory,
  },
});
