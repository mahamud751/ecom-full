/** Doctor profile + book consult form. */
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { type IconName } from '../components/AppIcon';
import {
  Button,
  Card,
  Chip,
  ErrorView,
  Field,
  Gradient,
  IconButton,
  IconTile,
  Loading,
  SmartImage,
} from '../components/ui';
import { useAuth } from '../store/auth';
import { colors, formatPrice, gradients, radii, shadows } from '../theme';
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

  const stats: { icon: IconName; v: string; l: string }[] = [
    { icon: 'star', v: typeof doctor.rating === 'number' ? doctor.rating.toFixed(1) : '—', l: 'Rating' },
    { icon: 'user', v: doctor.patients ?? '—', l: 'Patients' },
    { icon: 'clock', v: doctor.experience ? `${doctor.experience} yrs` : '—', l: 'Experience' },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        <View style={styles.heroWrap}>
          <SmartImage
            uri={doctor.image ? mediaUrl(doctor.image) : null}
            style={styles.hero}
            icon="doctor"
            iconSize={80}
          />
          <Gradient from="rgba(8,26,25,0)" to="rgba(8,26,25,0.85)" angle="vertical" />
          <View style={styles.heroOverlay}>
            {doctor.availableNow ? (
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Online now</Text>
              </View>
            ) : null}
            <Text style={styles.heroName}>{doctor.name}</Text>
            <Text style={styles.heroSpec}>
              {doctor.specialty}
              {doctor.designation ? ` · ${doctor.designation}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.stats}>
            {stats.map((st, i) => (
              <View key={st.l} style={[styles.stat, i > 0 && styles.statDivider]}>
                <AppIcon
                  name={st.icon}
                  color={st.icon === 'star' ? colors.goldStar : colors.forestMid}
                  filled={st.icon === 'star'}
                  size={18}
                />
                <Text style={styles.statVal}>{st.v}</Text>
                <Text style={styles.statLabel}>{st.l}</Text>
              </View>
            ))}
          </View>

          {doctor.hospital ? (
            <View style={styles.infoRow}>
              <IconTile name="hospital" size={38} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Practices at</Text>
                <Text style={styles.infoVal}>{doctor.hospital}</Text>
              </View>
            </View>
          ) : null}

          {doctor.bio ? (
            <>
              <Text style={styles.h3}>About</Text>
              <Text style={styles.text}>{doctor.bio}</Text>
            </>
          ) : null}

          {doctor.education || doctor.languages || doctor.bmdcNumber ? (
            <View style={styles.facts}>
              {doctor.education ? (
                <Fact icon="file" label="Education" value={doctor.education} />
              ) : null}
              {doctor.languages ? (
                <Fact icon="chat" label="Languages" value={doctor.languages} />
              ) : null}
              {doctor.bmdcNumber ? (
                <Fact icon="shield" label="BMDC reg." value={doctor.bmdcNumber} />
              ) : null}
            </View>
          ) : null}

          {doctor.scheduleSummary ? (
            <>
              <Text style={styles.h3}>Weekly schedule</Text>
              <View style={styles.schedule}>
                <AppIcon name="calendar" color={colors.forest} size={18} />
                <Text style={[styles.text, { flex: 1 }]}>{doctor.scheduleSummary}</Text>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <IconButton name="back" onPress={() => navigation.goBack()} />
      </View>

      <View style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}>
        <View style={{ flex: 0.8 }}>
          <Text style={styles.feeLabel}>Consult fee</Text>
          <Text style={styles.feeVal}>{formatPrice(doctor.fee)}</Text>
        </View>
        <Button
          label="Book consultation"
          icon="video"
          onPress={() =>
            navigation.navigate('BookConsult', {
              doctorId: doctor.id,
              doctorName: doctor.name,
              slug,
            })
          }
          style={{ flex: 1.4 }}
        />
      </View>
    </View>
  );
}

function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <AppIcon name={icon} color={colors.forestMid} size={16} />
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factVal} numberOfLines={2}>
        {value}
      </Text>
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
  const [day, setDay] = useState<string | null>(null);

  type Slot = (typeof slots)[number];
  const slotDay = (sl: Slot) => sl.dateLabel ?? sl.label.split(' · ')[0];
  const slotTime = (sl: Slot) => sl.timeLabel ?? sl.label.split(' · ')[1] ?? sl.label;
  const days = Array.from(new Set(slots.map(slotDay)));
  const activeDay = day ?? days[0];

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
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 110 + insets.bottom }}
      >
        <View style={styles.bookHead}>
          <IconTile name="stethoscope" size={50} />
          <View style={{ flex: 1 }}>
            <Text style={styles.h2}>{doctorName}</Text>
            <Text style={styles.sub}>
              {canInstant
                ? 'Online now — talk instantly or pick a slot.'
                : 'Pick a time slot for your consult.'}
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Consult type</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 22 }}>
          {(['VIDEO', 'AUDIO'] as const).map(t => {
            const on = type === t;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[styles.typeCard, on && styles.typeCardActive]}
              >
                {on ? <Gradient from={gradients.forestSoft[0]} to={gradients.forest[1]} /> : null}
                <View style={[styles.typeIcon, on && { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
                  <AppIcon name={t === 'VIDEO' ? 'video' : 'phone'} size={22} color={on ? colors.white : colors.forest} />
                </View>
                <Text style={[styles.typeText, on && { color: colors.white }]}>
                  {t === 'VIDEO' ? 'Video call' : 'Voice call'}
                </Text>
                <Text style={[styles.typeSub, on && { color: 'rgba(255,255,255,0.7)' }]}>
                  {t === 'VIDEO' ? 'Face to face' : 'Audio only'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {slots.length > 0 || canInstant ? (
          <>
            <Text style={styles.label}>When</Text>
            <View style={styles.slotWrap}>
              {canInstant ? (
                <Pressable
                  onPress={() => setSlotIso(null)}
                  style={[styles.slotChip, styles.slotInstant, !slotIso && styles.slotOn]}
                >
                  <AppIcon name="bolt" color={!slotIso ? colors.gold : colors.goldDeep} size={14} filled />
                  <Text style={[styles.slotText, !slotIso && { color: colors.white }]}>
                    Instant — talk now
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {days.length > 0 ? (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
                >
                  {days.map(d => (
                    <Chip key={d} label={d} active={d === activeDay} onPress={() => setDay(d)} />
                  ))}
                </ScrollView>
                <View style={styles.timeGrid}>
                  {slots
                    .filter(sl => slotDay(sl) === activeDay)
                    .map(sl => {
                      const on = slotIso === sl.iso;
                      return (
                        <Pressable
                          key={sl.iso}
                          onPress={() => setSlotIso(sl.iso)}
                          style={[styles.timeChip, on && styles.slotOn]}
                        >
                          <Text style={[styles.slotText, on && { color: colors.white }]}>
                            {slotTime(sl)}
                          </Text>
                        </Pressable>
                      );
                    })}
                </View>
              </>
            ) : null}
          </>
        ) : null}

        <Text style={[styles.label, { marginTop: 10 }]}>Patient</Text>
        <Card style={{ padding: 16 }}>
          <Field label="Patient name" icon="user" value={patientName} onChangeText={setPatientName} />
          <Field label="Phone" icon="phone" value={patientPhone} onChangeText={setPatientPhone} keyboardType="phone-pad" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 90 }}>
              <Field label="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderSeg}>
                {['FEMALE', 'MALE', 'OTHER'].map(g => (
                  <Pressable
                    key={g}
                    onPress={() => setGender(g)}
                    style={[styles.gChip, gender === g && styles.gChipActive]}
                  >
                    <Text style={[styles.gText, gender === g && { color: colors.forest }]}>
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
          <Field
            label="Symptoms / reason"
            value={symptoms}
            onChangeText={setSymptoms}
            placeholder="Describe the problem briefly"
            multiline
            style={{ minHeight: 84, textAlignVertical: 'top' }}
          />
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}>
        <Button
          label={slotIso || !canInstant ? 'Confirm booking' : 'Start consult now'}
          icon={type === 'VIDEO' ? 'video' : 'phone'}
          size="lg"
          loading={booking}
          onPress={() => void book()}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  heroWrap: { position: 'relative', height: 380 },
  hero: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 36,
    paddingHorizontal: 20,
  },
  livePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3ddc97' },
  liveText: { color: colors.white, fontSize: 11.5, fontWeight: '700' },
  heroName: { color: colors.white, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  heroSpec: { color: 'rgba(255,255,255,0.82)', fontSize: 14, marginTop: 4 },
  topBar: { position: 'absolute', left: 16 },
  sheet: {
    marginTop: -24,
    backgroundColor: colors.ivory,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingVertical: 14,
    ...shadows.card,
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.line },
  statVal: { fontSize: 16, fontWeight: '800', color: colors.ink, marginTop: 2 },
  statLabel: { fontSize: 11, color: colors.inkMuted },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  infoLabel: { fontSize: 11.5, color: colors.inkMuted },
  infoVal: { fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 1 },
  h3: { fontSize: 17, fontWeight: '800', color: colors.ink, marginTop: 22, marginBottom: 8 },
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  text: { fontSize: 14, lineHeight: 21, color: colors.inkSoft },
  facts: { flexDirection: 'row', gap: 10, marginTop: 16 },
  fact: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  factLabel: { fontSize: 11, color: colors.inkMuted, marginTop: 6 },
  factVal: { fontSize: 12.5, fontWeight: '700', color: colors.ink, marginTop: 2 },
  schedule: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: colors.brandSoft,
    borderRadius: radii.md,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadows.float,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
  },
  feeLabel: { fontSize: 11.5, color: colors.inkMuted, fontWeight: '600' },
  feeVal: { fontSize: 21, fontWeight: '800', color: colors.ink },
  bookHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  sub: { fontSize: 13, color: colors.inkMuted, marginTop: 3 },
  label: { fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: 10 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkSoft,
    marginBottom: 7,
  },
  genderSeg: {
    flexDirection: 'row',
    backgroundColor: colors.lineSoft,
    borderRadius: radii.md,
    padding: 3,
    height: 50,
  },
  gChip: { flex: 1, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  gChipActive: { backgroundColor: colors.surface, ...shadows.card },
  gText: { fontSize: 12.5, fontWeight: '700', color: colors.inkMuted },
  typeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    overflow: 'hidden',
  },
  typeCardActive: { borderColor: colors.forest, ...shadows.glow },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: 12 },
  typeSub: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  slotWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  slotInstant: { backgroundColor: colors.goldSoft, borderColor: '#ecdca6' },
  slotOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  slotText: { fontSize: 12.5, fontWeight: '700', color: colors.ink },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  timeChip: {
    width: '31.5%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingVertical: 11,
  },
});
