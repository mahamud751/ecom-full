import {
  Body,
  Controller,
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
    await this.setState(c.id, "RINGING", undefined, ringAt);
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
