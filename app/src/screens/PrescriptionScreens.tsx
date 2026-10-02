/** Prescription lookup/view (prescriptions are issued after consults). */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import { AppIcon } from '../components/AppIcon';
import { AhonaMark } from '../components/Logo';
import { Button, Card, ErrorView, Field, Gradient, IconTile, Loading } from '../components/ui';
import { colors, gradients, radii, shadows } from '../theme';
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
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.intro}>
        <IconTile name="file" size={52} color={colors.goldDeep} bg={colors.goldSoft} />
        <View style={{ flex: 1 }}>
          <Text style={styles.h2}>My prescription</Text>
          <Text style={styles.sub}>
            Doctors issue prescriptions after your consult. Enter your
            consultation number to view it.
          </Text>
        </View>
      </View>
      <Card style={{ padding: 16 }}>
        <Field
          label="Consultation number"
          icon="stethoscope"
          value={consultNo}
          onChangeText={setConsultNo}
          placeholder="e.g. CSL-XXXXXX"
          autoCapitalize="characters"
          returnKeyType="search"
          onSubmitEditing={() => void lookup()}
        />
        <Button label="Look up" icon="search" loading={loading} onPress={() => void lookup()} />
      </Card>

      {error ? (
        <View style={styles.errBox}>
          <AppIcon name="info" color={colors.danger} size={18} />
          <Text style={styles.errText}>{error}</Text>
        </View>
      ) : null}
      {result?.hasRx && result.rxId ? (
        <Card
          style={styles.result}
          onPress={() => navigation.navigate('PrescriptionView', { id: result.rxId! })}
        >
          <IconTile name="check" size={46} color={colors.lime} bg={colors.successSoft} />
          <View style={{ flex: 1 }}>
            <Text style={styles.resultT}>Prescription ready</Text>
            <Text style={styles.sub}>Issued by {result.doctor ?? 'your doctor'}</Text>
          </View>
          <AppIcon name="chevronRight" color={colors.inkFaint} size={18} />
        </Card>
      ) : null}
      {result && !result.hasRx ? (
        <Card style={styles.result}>
          <IconTile name="clock" size={46} color={colors.goldDeep} bg={colors.goldSoft} />
          <View style={{ flex: 1 }}>
            <Text style={styles.resultT}>Not issued yet</Text>
            <Text style={styles.sub}>
              {result.doctor
                ? `${result.doctor} hasn't issued it yet.`
                : 'No prescription yet.'}{' '}
              It will appear here once your consult is complete.
            </Text>
          </View>
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
  if (error || !rx) return <ErrorView message={error ?? 'Not found'} />;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pad}>
        <View style={styles.padHead}>
          <Gradient from={gradients.forestSoft[0]} to={gradients.forest[1]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rxMark}>℞</Text>
            {rx.consultation?.doctor?.name ? (
              <Text style={styles.padDoc}>Dr. {rx.consultation.doctor.name.replace(/^Dr\.?\s*/i, '')}</Text>
            ) : null}
            {rx.createdAt ? (
              <Text style={styles.padDate}>{new Date(rx.createdAt).toLocaleDateString()}</Text>
            ) : null}
          </View>
          <AhonaMark size={40} />
        </View>

        <View style={{ padding: 18 }}>
          {rx.consultation?.patientName ? (
            <Block label="Patient">
              <Text style={styles.value}>{rx.consultation.patientName}</Text>
            </Block>
          ) : null}
          {rx.diagnosis ? (
            <Block label="Diagnosis">
              <Text style={styles.value}>{rx.diagnosis}</Text>
            </Block>
          ) : null}

          <Block label="Medicines">
            {rx.items?.map((it, i) => (
              <View key={i} style={[styles.item, i === 0 && { borderTopWidth: 0, paddingTop: 0 }]}>
                <View style={styles.itemNo}>
                  <Text style={styles.itemNoText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{it.medicineName ?? it.medicine}</Text>
                  <Text style={styles.itemMeta}>
                    {[it.dosage, it.frequency, it.duration].filter(Boolean).join(' · ') ||
                      'As directed'}
                  </Text>
                  {it.instructions ? (
                    <Text style={styles.itemNote}>{it.instructions}</Text>
                  ) : null}
                </View>
              </View>
            ))}
            {!rx.items?.length ? <Text style={styles.sub}>No items listed.</Text> : null}
          </Block>

          {rx.advice ? (
            <Block label="Advice">
              <Text style={styles.value}>{rx.advice}</Text>
            </Block>
          ) : null}
          {rx.followUp ? (
            <View style={styles.followUp}>
              <AppIcon name="calendar" color={colors.goldDeep} size={18} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Follow-up</Text>
                <Text style={styles.value}>{rx.followUp}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  intro: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 16 },
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: colors.inkMuted, marginTop: 3, lineHeight: 18 },
  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.dangerSoft,
  },
  errText: { flex: 1, color: colors.danger, fontSize: 13, fontWeight: '600' },
  result: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginTop: 14 },
  resultT: { fontSize: 15.5, fontWeight: '800', color: colors.ink },
  pad: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadows.card,
  },
  padHead: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  rxMark: { fontSize: 30, fontWeight: '800', color: colors.gold, fontFamily: 'serif' },
  padDoc: { color: colors.white, fontSize: 17, fontWeight: '800', marginTop: 2 },
  padDate: { color: 'rgba(255,255,255,0.7)', fontSize: 12.5, marginTop: 2 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  value: { fontSize: 14.5, lineHeight: 21, color: colors.ink },
  item: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  itemNo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNoText: { fontSize: 12, fontWeight: '800', color: colors.forest },
  itemName: { fontSize: 15, fontWeight: '800', color: colors.ink },
  itemMeta: { fontSize: 13, color: colors.forestMid, marginTop: 3, fontWeight: '600' },
  itemNote: { fontSize: 12.5, color: colors.inkMuted, marginTop: 3 },
  followUp: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.goldSoft,
  },
});
