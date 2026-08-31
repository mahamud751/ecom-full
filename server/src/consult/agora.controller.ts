import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError } from "../common/utils";
import { buildRtcToken } from "./agora";
import { AuthUser, JwtAuthGuard, OptionalAuth } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";

@ApiTags("agora")
@Controller("agora")
export class AgoraController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("token")
  @UseGuards(JwtAuthGuard)
  @OptionalAuth()
  @ApiOperation({ summary: "Issue an Agora RTC token for a consult channel" })
  async token(
    @Body()
    body: {
      consultationId?: string;
      role?: "patient" | "doctor";
    },
    @CurrentUser() session?: AuthUser,
  ) {
    try {
      const { consultationId, role = "patient" } = body || {};

      if (!consultationId) {
        throw new ApiError(400, "consultationId is required");
      }

      const consultation = await this.prisma.consultation.findFirst({
        where: {
          OR: [{ id: consultationId }, { consultNumber: consultationId }],
        },
        include: { doctor: { select: { name: true } } },
      });

      if (!consultation) {
        throw new ApiError(404, "Consultation not found");
      }

      if (
        role === "doctor" &&
        (!session ||
          session.role !== "DOCTOR" ||
          session.sub !== consultation.doctorId)
      ) {
        throw new ApiError(
          401,
          "Only the assigned doctor may join as doctor",
        );
      }

      if (["CANCELLED", "COMPLETED"].includes(consultation.status)) {
        throw new ApiError(409, "Consultation has ended");
      }

      // Stable numeric UIDs per role — must match client join()
      const uid = role === "doctor" ? 1001 : 2001;

      const { token, appId, expireAt } = buildRtcToken({
        channelName: consultation.channelName,
        uid,
        role: "publisher",
        expireSeconds: 2 * 60 * 60,
      });

      /**
       * Do NOT force IN_CALL when patient only requests a token.
       * That hid the doctor's incoming-call modal (status left PENDING too briefly
       * or jumped to IN_CALL before doctor could accept).
       * Doctor "accept/join" sets IN_CALL; patient may wait in channel meanwhile.
       */
      if (role === "doctor" && consultation.status !== "IN_CALL") {
        await this.prisma.consultation.update({
          where: { id: consultation.id },
          data: {
            status: "IN_CALL",
            startedAt: consultation.startedAt ?? new Date(),
          },
        });
      } else if (
        role === "patient" &&
        consultation.status === "PENDING" &&
        !consultation.isEmergency
      ) {
        // Scheduled consult: patient joining after confirm
        await this.prisma.consultation.update({
          where: { id: consultation.id },
          data: {
            status: "IN_CALL",
            startedAt: consultation.startedAt ?? new Date(),
          },
        });
      }

      return {
        appId,
        token,
        channelName: consultation.channelName,
        uid,
        role,
        expireAt,
        consultType: consultation.type,
        consultationId: consultation.id,
        consultNumber: consultation.consultNumber,
        patientName: consultation.patientName,
        doctorName: consultation.doctor.name,
        isEmergency: consultation.isEmergency,
      };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error("Agora token error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to create Agora token";
      throw new ApiError(500, message);
    }
  }
}
