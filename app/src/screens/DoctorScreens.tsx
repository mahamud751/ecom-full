/** Doctor profile + book consult form. */
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { http, apiErrorMessage } from '../api/client';
import { mediaUrl } from '../config';
import { AppIcon } from '../components/AppIcon';
import {
  Badge,
  Button,
  Card,
  ErrorView,
  Field,
  Loading,
} from '../components/ui';
import { useAuth } from '../store/auth';
import { colors, formatPrice, radii } from '../theme';
import type { DoctorDetail } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

/* ── Doctor detail ───────────────────────────────────────────────── */

type DetailProps = NativeStackScreenProps<RootParamList, 'DoctorDetail'>;

export function DoctorDetailScreen({ navigation, route }: DetailProps) {
  const { slug } = route.params;
  const insets = useSafeAreaInsets();
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    http
      .get(`/doctors/${slug}`)
      .then(res => setDoctor(res.data.doctor ?? res.data))
      .catch(err => setError(apiErrorMessage(err, 'Doctor not found')));
  }, [slug]);

  if (error) return <ErrorView message={error} />;
  if (!doctor) return <Loading />;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}
      >
        <View style={styles.heroWrap}>
          {doctor.image ? (
            <Image
              source={{ uri: mediaUrl(doctor.image) }}
              style={styles.hero}
            />
          ) : null}
          <View style={styles.heroOverlay}>
            <Text style={styles.heroName}>{doctor.name}</Text>
            <Text style={styles.heroSpec}>
              {doctor.specialty}
              {doctor.hospital ? ` · ${doctor.hospital}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>
              ★{' '}
              {typeof doctor.rating === 'number'
                ? doctor.rating.toFixed(1)
                : '—'}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{doctor.patients ?? '—'}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{doctor.experience ?? '—'}y</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{formatPrice(doctor.fee)}</Text>
            <Text style={styles.statLabel}>Consult fee</Text>
          </View>
        </View>

        <View style={styles.body}>
          {doctor.availableNow ? (
            <Badge label="Available now for instant consult" tone="green" />
          ) : null}
          {doctor.bio ? (
            <>
              <Text style={styles.h3}>About</Text>
              <Text style={styles.text}>{doctor.bio}</Text>
            </>
          ) : null}
          {doctor.languages ? (
            <Text style={styles.meta}>Languages: {doctor.languages}</Text>
          ) : null}
          {doctor.bmdcNumber ? (
            <Text style={styles.meta}>BMDC Reg: {doctor.bmdcNumber}</Text>
          ) : null}
          {doctor.scheduleSummary ? (
            <>
              <Text style={styles.h3}>Weekly schedule</Text>
              <Text style={styles.text}>{doctor.scheduleSummary}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}
      >
        <Button
          label={`Book consultation · ${formatPrice(doctor.fee)}`}
          onPress={() =>
            navigation.navigate('BookConsult', {
              doctorId: doctor.id,
              doctorName: doctor.name,
              slug,
            })
          }
        />
      </View>
    </View>
  );
}

/* ── Book consult ────────────────────────────────────────────────── */

type BookProps = NativeStackScreenProps<RootParamList, 'BookConsult'>;

export function BookConsultScreen({ navigation, route }: BookProps) {
  const { doctorId, doctorName, slug } = route.params;
  const insets = useSafeAreaInsets();
  const user = useAuth(s => s.user);

  const [patientName, setPatientName] = useState(user?.name ?? '');
  const [patientPhone, setPatientPhone] = useState(user?.phone ?? '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('FEMALE');
  const [symptoms, setSymptoms] = useState('');
  const [type, setType] = useState<'VIDEO' | 'AUDIO'>('VIDEO');
  const [booking, setBooking] = useState(false);

  // Slot booking (non-emergency doctors require a scheduled slot).
  const [slots, setSlots] = useState<NonNullable<DoctorDetail['nextSlots']>>(
    [],
  );
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [canInstant, setCanInstant] = useState(false);

  useEffect(() => {
    if (!slug) return;
    http
      .get(`/doctors/${slug}`)
      .then(res => {
        const d: DoctorDetail = res.data.doctor ?? res.data;
        setSlots(d.nextSlots ?? []);
        setCanInstant(Boolean(d.availableNow && d.emergencyAvailable));
      })
      .catch(() => {
        /* slot list is optional — fall back to instant attempt */
      });
  }, [slug]);

  async function book() {
    if (!patientName.trim() || !patientPhone.trim()) {
      Alert.alert('Missing details', 'Patient name and phone are required.');
      return;
    }
    if (!slotIso && !canInstant) {
      Alert.alert('Pick a time slot', 'Choose one of the available slots.');
      return;
    }
    setBooking(true);
    try {
      const res = await http.post('/consultations', {
        doctorId,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientAge: age ? Number(age) : undefined,
        patientGender: gender,
        symptoms: symptoms.trim() || undefined,
        type,
        scheduledAt: slotIso ?? undefined,
        instant: !slotIso,
      });
      const consult = res.data.consultation ?? res.data;
      navigation.replace('ConsultDetail', { id: consult.id });
    } catch (err) {
      Alert.alert('Booking failed', apiErrorMessage(err));
    } finally {
      setBooking(false);
    }
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 + insets.bottom }}
    >
      <Text style={styles.h2}>Book with {doctorName}</Text>
      <Text style={styles.sub}>
        {canInstant
          ? 'The doctor is online — instant consult or pick a slot.'
          : 'Pick a time slot for your consult.'}
      </Text>

      {slots.length > 0 ? (
        <>
          <Text style={styles.fieldLabel}>Available slots</Text>
          <View style={styles.slotWrap}>
            {slots.map(s => (
              <Pressable
                key={s.iso}
                onPress={() => setSlotIso(s.iso)}
                style={[styles.slotChip, slotIso === s.iso && styles.slotOn]}
              >
                <Text
                  style={[
                    styles.slotText,
                    slotIso === s.iso && { color: colors.white },
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {canInstant ? (
            <Pressable
              onPress={() => setSlotIso(null)}
              style={[
                styles.slotChip,
                !slotIso && styles.slotOn,
                { marginBottom: 4 },
              ]}
            >
              <Text
                style={[styles.slotText, !slotIso && { color: colors.white }]}
              >
                ⚡ Instant — talk now
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      <Card style={{ padding: 14, marginTop: 14, marginBottom: 12 }}>
        <Field
          label="Patient name"
          value={patientName}
          onChangeText={setPatientName}
        />
        <Field
          label="Phone"
          value={patientPhone}
          onChangeText={setPatientPhone}
          keyboardType="phone-pad"
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1.4 }}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['FEMALE', 'MALE', 'OTHER'].map(g => (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  style={[styles.gChip, gender === g && styles.gChipActive]}
                >
                  <Text
                    style={[
                      styles.gText,
                      gender === g && { color: colors.white },
                    ]}
                  >
                    {g.charAt(0) + g.slice(1).toLowerCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          <Field
            label="Symptoms / reason"
            value={symptoms}
            onChangeText={setSymptoms}
            placeholder="Describe the problem briefly"
            multiline
          />
        </View>
      </Card>

      <Text style={styles.fieldLabel}>Consult type</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
        {(['VIDEO', 'AUDIO'] as const).map(t => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            style={[styles.typeCard, type === t && styles.typeCardActive]}
          >
            <AppIcon
              name={t === 'VIDEO' ? 'video' : 'phone'}
              size={22}
              color={type === t ? colors.white : colors.forest}
            />
            <Text
              style={[styles.typeText, type === t && { color: colors.white }]}
            >
              {t === 'VIDEO' ? 'Video call' : 'Voice call'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button
        label="Confirm booking"
        loading={booking}
        onPress={() => void book()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  heroWrap: { position: 'relative' },
  hero: { width: '100%', height: 300 },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: 'rgba(12,42,40,0.55)',
  },
  heroName: { color: colors.white, fontSize: 20, fontWeight: '800' },
  heroSpec: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 15, fontWeight: '800', color: colors.forest },
  statLabel: { fontSize: 10.5, color: colors.inkMuted, marginTop: 2 },
  body: { paddingHorizontal: 16, gap: 10 },
  h3: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 8 },
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink },
  text: { fontSize: 13.5, lineHeight: 20, color: colors.ink },
  meta: { fontSize: 12.5, color: colors.inkMuted },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  sub: { fontSize: 13, color: colors.inkMuted, marginTop: 6 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 8,
  },
  gChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.surface,
  },
  gChipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  gText: { fontSize: 11.5, fontWeight: '600', color: colors.inkMuted },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 14,
  },
  typeCardActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 6,
  },
  slotWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  slotChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  slotOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  slotText: { fontSize: 12, fontWeight: '600', color: colors.ink },
});
