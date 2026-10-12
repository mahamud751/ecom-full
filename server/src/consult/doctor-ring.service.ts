import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PushService } from "../push/push.service";

/** How long the doctor's phone rings before the call counts as missed. */
const RING_SECONDS = 45;

/** How long the outcome of a ring stays readable for the caller's screen. */
const OUTCOME_SECONDS = 120;

type Ring = {
  ringAt: number;
  timer: ReturnType<typeof setTimeout>;
  /** A doctor's phone confirmed it received the ring (it is ringing). */
  delivered: boolean;
};

type Outcome = {
  reason: "accepted" | "declined" | "cancelled" | "missed";
  timer: ReturnType<typeof setTimeout>;
};

/**
 * What the patient's call screen shows, WhatsApp-style:
 *   calling     → ring sent, no doctor phone has confirmed it yet
 *   ringing     → a doctor phone is ringing
 *   unavailable → no doctor phone to ring (the Doctor Portal can still join)
 *   declined / missed / accepted / cancelled → how the last ring ended
 */
export type RingState =
  | "calling"
  | "ringing"
  | "unavailable"
  | Outcome["reason"];

type RingConsult = {
  id: string;
  consultNumber: string;
  doctorId: string;
  patientName: string;
  channelName: string;
  type: string;
};

/**
 * Patient → doctor ringing. When a patient enters the call room (app or
 * web), every phone signed in with the doctor's account gets a high-priority
 * `patient_call` data push and shows a full-screen incoming call, even when
 * the app is closed. The ring ends when the doctor joins (phone or Doctor
 * Portal), declines, the patient hangs up, or after RING_SECONDS (missed).
 *
 * State is in memory: the API runs as one process and a ring lives for
 * seconds. If the API restarts mid-ring, phones still stop at `expiresAt`.
 */
@Injectable()
export class DoctorRingService {
  private readonly log = new Logger("DoctorRing");
  private readonly rings = new Map<string, Ring>();
  private readonly outcomes = new Map<string, Outcome>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  /** Device tokens of phones signed in to the doctor's account. */
  private async doctorTokens(doctorId: string): Promise<string[]> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { email: true },
    });
    if (!doctor?.email) return [];
    // Doctors sign in to the app through a linked customer row with the
    // same email; that row owns the phone's device token.
    const customers = await this.prisma.customer.findMany({
      where: { email: doctor.email.toLowerCase(), isActive: true },
      select: { id: true },
    });
    return this.push.tokensForCustomers(customers.map((c) => c.id));
  }

  /** Rings the doctor's phones unless this consult is already ringing. */
  async ring(c: RingConsult): Promise<number> {
    if (!this.push.enabled || this.rings.has(c.id)) return 0;
    const tokens = await this.doctorTokens(c.doctorId);
    if (!tokens.length) return 0;
    this.clearOutcome(c.id);

    const ringAt = Date.now();
    const timer = setTimeout(() => {
      void this.stop(c.id, "missed", c.patientName).catch((e) =>
        this.log.error(`Missed-call timeout: ${e}`),
      );
    }, RING_SECONDS * 1000);
    this.rings.set(c.id, { ringAt, timer, delivered: false });

    const sent = await this.push.sendData(
      tokens,
      {
        type: "patient_call",
        consultId: c.id,
        consultNumber: c.consultNumber,
        ringId: String(ringAt),
        channel: c.channelName,
        mode: c.type === "AUDIO" ? "AUDIO" : "VIDEO",
        callerName: c.patientName || "Patient",
        expiresAt: String(ringAt + RING_SECONDS * 1000),
      },
      // A late delivery must never ring an old call.
      { ttlSeconds: RING_SECONDS },
    );
    if (!sent) this.clear(c.id);
    return sent;
  }

  /** Ends the ring (if any) and dismisses it on all the doctor's phones. */
  async stop(
    consultId: string,
    reason: "accepted" | "declined" | "cancelled" | "missed",
    patientName?: string,
  ): Promise<void> {
    const ring = this.rings.get(consultId);
    if (!ring) return;
    this.clear(consultId);
    this.setOutcome(consultId, reason);

    const c = await this.prisma.consultation.findUnique({
      where: { id: consultId },
      select: { doctorId: true, patientName: true },
    });
    if (!c) return;
    const tokens = await this.doctorTokens(c.doctorId);
    await this.push.sendData(
      tokens,
      {
        type: "call_end",
        role: "doctor",
        consultId,
        ringId: String(ring.ringAt),
        reason,
        callerName: patientName || c.patientName || "Patient",
      },
      { ttlSeconds: reason === "missed" ? 24 * 3600 : 60 },
    );
  }

  /** A doctor's phone received the ring and is now ringing. */
  markDelivered(consultId: string, ringId?: string) {
    const ring = this.rings.get(consultId);
    if (ring && (!ringId || ringId === String(ring.ringAt))) {
      ring.delivered = true;
    }
  }

  /** Where the patient's call to the doctor stands right now. */
  state(consultId: string): RingState {
    const ring = this.rings.get(consultId);
    if (ring) return ring.delivered ? "ringing" : "calling";
    return this.outcomes.get(consultId)?.reason ?? "unavailable";
  }

  private setOutcome(consultId: string, reason: Outcome["reason"]) {
    this.clearOutcome(consultId);
    const timer = setTimeout(
      () => this.outcomes.delete(consultId),
      OUTCOME_SECONDS * 1000,
    );
    this.outcomes.set(consultId, { reason, timer });
  }

  private clearOutcome(consultId: string) {
    const outcome = this.outcomes.get(consultId);
    if (outcome) clearTimeout(outcome.timer);
    this.outcomes.delete(consultId);
  }

  private clear(consultId: string) {
    const ring = this.rings.get(consultId);
    if (ring) clearTimeout(ring.timer);
    this.rings.delete(consultId);
  }
}
