import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { PushService } from "../push/push.service";
import { AuthUser, JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ApiError } from "../common/utils";
import { DoctorRingService } from "./doctor-ring.service";

/** How long the patient's phone rings before the call counts as missed. */
const RING_SECONDS = 30;

/**
 * The ways a stored phone number may be written for the same SIM:
 * 01712345678, 8801712345678, +8801712345678, 1712345678.
 */
function phoneVariants(raw: string): string[] {
  const digits = raw.replace(/\D/g, "");
  const core = digits.slice(-10);
  if (core.length < 10) return [raw.trim()];
  return [raw.trim(), digits, core, `0${core}`, `880${core}`, `+880${core}`];
}

/**
 * Doctor → patient ringing (Messenger-style). The doctor starts a ring; every
 * phone signed in to an account with the consultation's patient phone gets a
 * high-priority data push and shows a full-screen incoming call, even when
 * the app is closed. Accept joins the existing Agora call; decline, cancel or
 * a RING_SECONDS timeout end the ring and dismiss it on all the patient's
 * phones.
 */
@ApiTags("consultations")
@Controller("consultations/:id/call")
export class CallRingController {
  private readonly log = new Logger("CallRing");

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly doctorRing: DoctorRingService,
  ) {}

  private async consultation(id: string) {
    const c = await this.prisma.consultation.findFirst({
      where: { OR: [{ id }, { consultNumber: id }] },
      include: { doctor: { select: { name: true, image: true } } },
    });
    if (!c) throw new ApiError(404, "Consultation not found");
    return c;
  }

  private async patientTokens(patientPhone: string) {
    const customers = await this.prisma.customer.findMany({
      where: { phone: { in: phoneVariants(patientPhone) }, isActive: true },
      select: { id: true },
    });
    return this.push.tokensForCustomers(customers.map((c) => c.id));
  }

  /**
   * Moves the ring to `callState`. With `ringAt`, only if that exact ring
   * (identified by its start time) is still RINGING, so a stale timer or a
   * late answer can't end a newer ring.
   */
  private async setState(
    id: string,
    callState: string,
    ringAt?: Date,
    at = new Date(),
  ) {
    const res = await this.prisma.consultation.updateMany({
      where: {
        id,
        ...(ringAt ? { callState: "RINGING", callStateAt: ringAt } : {}),
      },
      data: { callState, callStateAt: at },
    });
    return res.count > 0;
  }

  /** Tells every phone of the patient to stop this ring (and why). */
  private async dismiss(
    c: { id: string; patientPhone: string; doctor: { name: string } },
    ringAt: Date,
    reason: "cancelled" | "declined" | "missed" | "accepted",
  ) {
    const tokens = await this.patientTokens(c.patientPhone);
    await this.push.sendData(
      tokens,
      {
        type: "call_end",
        consultId: c.id,
        ringId: String(ringAt.getTime()),
        reason,
        doctorName: c.doctor.name,
      },
      { ttlSeconds: reason === "missed" ? 24 * 3600 : 60 },
    );
  }

  @Post("ring")
  @UseGuards(JwtAuthGuard)
  @Roles("DOCTOR")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Doctor rings the patient's phone(s)" })
  async ring(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const c = await this.consultation(id);
    if (c.doctorId !== user.sub) {
      throw new ApiError(403, "Not your consultation");
    }
    if (["CANCELLED", "COMPLETED"].includes(c.status)) {
      throw new ApiError(409, "Consultation has ended");
    }
    if (!this.push.enabled) {
      throw new ApiError(503, "Push notifications are not configured");
    }

    const tokens = await this.patientTokens(c.patientPhone);
    if (!tokens.length) {
      return {
        success: false,
        devices: 0,
        message: "Patient has no signed-in phone to ring",
      };
    }

    const ringAt = new Date();
    // A new ring is "calling" until one of the patient's phones confirms it.
    await this.prisma.consultation.update({
      where: { id: c.id },
      data: { callState: "RINGING", callStateAt: ringAt, callDeliveredAt: null },
    });
    const sent = await this.push.sendData(
      tokens,
      {
        type: "incoming_call",
        consultId: c.id,
        consultNumber: c.consultNumber,
        ringId: String(ringAt.getTime()),
        channel: c.channelName,
        mode: c.type === "AUDIO" ? "AUDIO" : "VIDEO",
        doctorName: c.doctor.name,
        doctorImage: c.doctor.image ?? "",
        expiresAt: String(ringAt.getTime() + RING_SECONDS * 1000),
      },
      // A late delivery must never ring an old call.
      { ttlSeconds: RING_SECONDS },
    );

    // Missed-call timeout. In-process: if the API restarts mid-ring the
    // phone still stops by itself at expiresAt.
    setTimeout(() => {
      void (async () => {
        if (await this.setState(c.id, "MISSED", ringAt)) {
          await this.dismiss(c, ringAt, "missed");
        }
      })().catch((e) => this.log.error(`Missed-call timeout: ${e}`));
    }, RING_SECONDS * 1000);

    return { success: sent > 0, devices: sent, ringSeconds: RING_SECONDS };
  }

  @Post("cancel")
  @UseGuards(JwtAuthGuard)
  @Roles("DOCTOR")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Doctor stops ringing before the patient answers" })
  async cancel(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const c = await this.consultation(id);
    if (c.doctorId !== user.sub) {
      throw new ApiError(403, "Not your consultation");
    }
    if (
      c.callState === "RINGING" &&
      c.callStateAt &&
      (await this.setState(c.id, "CANCELLED", c.callStateAt))
    ) {
      await this.dismiss(c, c.callStateAt, "cancelled");
    }
    return { success: true };
  }

  /**
   * Delivery receipt: a patient's phone got the `incoming_call` push and is
   * ringing, so the Doctor Portal moves from "Calling…" to "Ringing…".
   * Unauthenticated like `answer` (a closed app has no session); it only
   * marks a ring that is still RINGING.
   */
  @Post("received")
  @ApiOperation({ summary: "Patient's phone confirms the doctor's call is ringing" })
  async received(@Param("id") id: string, @Body() body: { ringId?: string }) {
    const ringAt = new Date(Number(body?.ringId));
    if (Number.isNaN(ringAt.getTime())) {
      throw new ApiError(400, "ringId is required");
    }
    await this.prisma.consultation.updateMany({
      where: {
        OR: [{ id }, { consultNumber: id }],
        callState: "RINGING",
        callStateAt: ringAt,
        callDeliveredAt: null,
      },
      data: { callDeliveredAt: new Date() },
    });
    return { success: true };
  }

  /**
   * Delivery receipt: the doctor's phone got the `patient_call` push and is
   * ringing, so the patient's screen moves from "Calling…" to "Ringing…".
   */
  @Post("ringing")
  @UseGuards(JwtAuthGuard)
  @Roles("DOCTOR")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Doctor's phone confirms a patient's call is ringing" })
  async ringing(
    @Param("id") id: string,
    @Body() body: { ringId?: string },
    @CurrentUser() user: AuthUser,
  ) {
    const c = await this.consultation(id);
    if (c.doctorId !== user.sub) {
      throw new ApiError(403, "Not your consultation");
    }
    this.doctorRing.markDelivered(c.id, body?.ringId);
    return { success: true };
  }

  /**
   * The patient's view of their call to the doctor: who they are calling and
   * whether it is calling, ringing, declined or unanswered. Unauthenticated
   * like `answer` (guest consults have no session); ids are unguessable.
   */
  @Get("status")
  @ApiOperation({ summary: "Ring status of a patient's call to the doctor" })
  async status(@Param("id") id: string) {
    const c = await this.prisma.consultation.findFirst({
      where: { OR: [{ id }, { consultNumber: id }] },
      include: {
        doctor: {
          select: { name: true, image: true, specialty: true, isOnline: true },
        },
      },
    });
    if (!c) throw new ApiError(404, "Consultation not found");
    return {
      state: this.doctorRing.state(c.id),
      doctor: {
        name: c.doctor.name,
        image: c.doctor.image,
        specialty: c.doctor.specialty,
        isOnline: c.doctor.isOnline,
      },
    };
  }

  /**
   * Doctor's answer to a patient's call on their phone. Accept stops the
   * ring on the doctor's other phones (the app then fetches a doctor token
   * and joins); decline only stops the ring — the patient keeps waiting and
   * the Doctor Portal can still take the call.
   */
  @Post("doctor-answer")
  @UseGuards(JwtAuthGuard)
  @Roles("DOCTOR")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Doctor accepts or declines a patient's call" })
  async doctorAnswer(
    @Param("id") id: string,
    @Body() body: { answer?: "accept" | "decline" },
    @CurrentUser() user: AuthUser,
  ) {
    const c = await this.consultation(id);
    if (c.doctorId !== user.sub) {
      throw new ApiError(403, "Not your consultation");
    }
    if (["CANCELLED", "COMPLETED"].includes(c.status)) {
      throw new ApiError(409, "Consultation has ended");
    }
    await this.doctorRing.stop(
      c.id,
      body?.answer === "accept" ? "accepted" : "declined",
    );
    return {
      success: true,
      consultation: {
        id: c.id,
        channel: c.channelName,
        mode: c.type === "AUDIO" ? "AUDIO" : "VIDEO",
      },
    };
  }

  /**
   * Patient's answer. Unauthenticated on purpose: a closed app answering
   * from the notification has no session yet. Only a call that is still
   * RINGING can be answered, and consultation ids are unguessable cuids.
   */
  @Post("answer")
  @ApiOperation({ summary: "Patient accepts or declines a ringing call" })
  async answer(
    @Param("id") id: string,
    @Body() body: { answer?: "accept" | "decline"; ringId?: string },
  ) {
    const c = await this.consultation(id);
    const accept = body?.answer === "accept";
    // The ring being answered: the one the phone was shown, else the
    // current one.
    const ringAt = body?.ringId
      ? new Date(Number(body.ringId))
      : c.callState === "RINGING"
        ? c.callStateAt
        : null;
    const changed =
      ringAt &&
      !Number.isNaN(ringAt.getTime()) &&
      (await this.setState(c.id, accept ? "ACCEPTED" : "DECLINED", ringAt));
    if (!changed) {
      throw new ApiError(409, "This call is no longer ringing");
    }
    // Stop the ring on the patient's other phones too.
    await this.dismiss(c, ringAt, accept ? "accepted" : "declined");
    return {
      success: true,
      consultation: {
        id: c.id,
        channel: c.channelName,
        mode: c.type === "AUDIO" ? "AUDIO" : "VIDEO",
      },
    };
  }
}
