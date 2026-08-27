/** Refund request, support ticket, and static info pages. */
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { http, apiErrorMessage } from '../api/client';
import { BRAND } from '../config';
import { Button, Card, Field } from '../components/ui';
import { colors, radii } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootParamList } from '../navigation/types';

/* ── Refund request ──────────────────────────────────────────────── */

type RefundProps = NativeStackScreenProps<RootParamList, 'RefundRequest'>;

const REFUND_REASONS = [
  'Product damaged on delivery',
  'Wrong product delivered',
  'Product expired',
  'Order placed by mistake',
  'Other',
];

export function RefundRequestScreen({ navigation }: RefundProps) {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState(REFUND_REASONS[0]);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!orderNumber.trim() || !phone.trim()) {
      Alert.alert('Missing details', 'Order number and phone are required.');
      return;
    }
    setSending(true);
    try {
      const res = await http.post('/refunds', {
        orderNumber: orderNumber.trim(),
        phone: phone.trim(),
        reason,
        details: details.trim() || undefined,
      });
      const ref = res.data.refund?.refundNumber ?? res.data.refundNumber;
      Alert.alert(
        'Request submitted',
        `Your refund request${
          ref ? ` (${ref})` : ''
        } is under review. We'll call you within 24h.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert('Request failed', apiErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.h2}>Request a refund</Text>
      <Text style={styles.sub}>
        Verified against the phone number used on the order.
      </Text>
      <Card style={{ padding: 14, marginTop: 14 }}>
        <Field
          label="Order number"
          value={orderNumber}
          onChangeText={setOrderNumber}
          placeholder="CHB-XXXXXX"
          autoCapitalize="characters"
        />
        <Field
          label="Phone used on order"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <Text style={styles.fieldLabel}>Reason</Text>
        {REFUND_REASONS.map(r => (
          <Pressable key={r} style={styles.optRow} onPress={() => setReason(r)}>
            <View style={[styles.radio, reason === r && styles.radioOn]} />
            <Text style={styles.optText}>{r}</Text>
          </Pressable>
        ))}
        <View style={{ marginTop: 10 }}>
          <Field
            label="Details (optional)"
            value={details}
            onChangeText={setDetails}
            multiline
            placeholder="Tell us more…"
          />
        </View>
      </Card>
      <Button
        label="Submit refund request"
        loading={sending}
        onPress={() => void submit()}
        style={{ marginTop: 14 }}
      />
    </ScrollView>
  );
}

/* ── Support ─────────────────────────────────────────────────────── */

type SupportProps = NativeStackScreenProps<RootParamList, 'Support'>;

export function SupportScreen({ navigation }: SupportProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!name.trim() || !phone.trim() || !subject.trim() || !message.trim()) {
      Alert.alert(
        'Missing details',
        'Name, phone, subject and message are required.',
      );
      return;
    }
    setSending(true);
    try {
      const res = await http.post('/support', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
        orderNumber: orderNumber.trim() || undefined,
      });
      const ticketNo = res.data.ticket?.ticketNo;
      Alert.alert(
        'Ticket created',
        `We've logged your request${
          ticketNo ? ` (${ticketNo})` : ''
        }. Support will reach out shortly.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert('Failed', apiErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.h2}>Contact support</Text>
      <View style={styles.quickRow}>
        <Pressable
          style={styles.quick}
          onPress={() => void Linking.openURL(`tel:${BRAND.supportPhone}`)}
        >
          <Text style={styles.quickIcon}>📞</Text>
          <Text style={styles.quickText}>Call us</Text>
        </Pressable>
        <Pressable
          style={styles.quick}
          onPress={() => void Linking.openURL(`mailto:${BRAND.supportEmail}`)}
        >
          <Text style={styles.quickIcon}>✉️</Text>
          <Text style={styles.quickText}>Email us</Text>
        </Pressable>
      </View>

      <Card style={{ padding: 14, marginTop: 14 }}>
        <Field label="Your name" value={name} onChangeText={setName} />
        <Field
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <Field
          label="Email (optional)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Field
          label="Order number (optional)"
          value={orderNumber}
          onChangeText={setOrderNumber}
          autoCapitalize="characters"
        />
        <Field label="Subject" value={subject} onChangeText={setSubject} />
        <Field
          label="Message"
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder="How can we help?"
        />
      </Card>
      <Button
        label="Send message"
        loading={sending}
        onPress={() => void submit()}
        style={{ marginTop: 14 }}
      />
    </ScrollView>
  );
}

/* ── Static info pages ───────────────────────────────────────────── */

type InfoProps = NativeStackScreenProps<RootParamList, 'Info'>;

const INFO_CONTENT: Record<
  InfoProps['route']['params']['topic'],
  { title: string; paragraphs: string[] }
> = {
  contact: {
    title: 'Contact us',
    paragraphs: [
      `${BRAND.name} — Health & Beauty, Bangladesh.`,
      `Phone: ${BRAND.supportPhone}`,
      `Email: ${BRAND.supportEmail}`,
      'Support hours: 9 AM – 10 PM, 7 days a week.',
      'For urgent medicine orders, call us directly — we prioritize the phone line.',
    ],
  },
  terms: {
    title: 'Terms of service',
    paragraphs: [
      'By using Ahona you agree to purchase genuine, licensed products for personal use.',
      'Prescription medicines require a valid prescription; our pharmacist verifies before dispatch.',
      'Cash on delivery is our default payment method. Orders are confirmed by phone.',
      'Consultations are for guidance and do not replace in-person emergency care. In an emergency, call national emergency services.',
      'Ahona may cancel orders that violate these terms or applicable law.',
    ],
  },
  privacy: {
    title: 'Privacy policy',
    paragraphs: [
      'We collect only what we need to serve you: name, phone, address, and order/consult history.',
      'Health information shared during consultations is visible only to the consulting doctor and our licensed pharmacist.',
      'We never sell your personal data. Delivery partners see only what they need to deliver.',
      'You may request deletion of your account data by contacting support.',
    ],
  },
  compliance: {
    title: 'Compliance',
    paragraphs: [
      'Ahona operates as a licensed pharmacy under Bangladesh DGDA regulations.',
      'All medicines are sourced from authorized distributors with batch traceability.',
      'Prescription-only medicines are dispensed strictly against verified prescriptions.',
      'Our doctors are BMDC-registered; registration numbers are shown on each profile.',
    ],
  },
};

export function InfoScreen({ route }: InfoProps) {
  const { topic } = route.params;
  const content = INFO_CONTENT[topic];
  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 18 }}>
      <Text style={styles.h2}>{content.title}</Text>
      {content.paragraphs.map((p, i) => (
        <Text key={i} style={styles.para}>
          {p}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 13, color: colors.inkMuted, marginTop: 4 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 8,
  },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.line,
  },
  radioOn: { borderColor: colors.forest, backgroundColor: colors.forest },
  optText: { fontSize: 13.5, color: colors.ink },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  quick: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 16,
  },
  quickIcon: { fontSize: 24 },
  quickText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.forest,
    marginTop: 6,
  },
  para: { fontSize: 14, lineHeight: 22, color: colors.ink, marginTop: 12 },
});
