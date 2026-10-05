import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError, makeRefNumber } from "../common/utils";
import { pageParams } from "../common/pagination";
import { AuthUser, JwtAuthGuard, OptionalAuth } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { makeChannelName } from "./agora";
import type { ScheduleRow } from "../doctors/schedule";

type ConsultStatus =
  "PENDING" | "CONFIRMED" | "IN_CALL" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

@ApiTags("consultations")
@Controller("consultations")
export class ConsultationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List consultations by patient phone or doctorId" })
  async list(
    @Query("phone") phone?: string,
    @Query("doctorId") doctorId?: string,
    @Query("status") status?: string,
    @Query("emergency") emergency?: string,
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    const p = pageParams({ page, perPage }, { perPage: 50, maxPerPage: 100 });
    try {
      if (!phone?.trim() && !doctorId?.trim()) {
        throw new ApiError(400, "phone or doctorId is required");
      }

      const where: {
        patientPhone?: string;
        doctorId?: string;
        isEmergency?: boolean;
        status?: { in: ConsultStatus[] } | ConsultStatus;
      } = {};

      if (phone?.trim()) where.patientPhone = phone.trim();
      if (doctorId?.trim()) where.doctorId = doctorId.trim();
      if (emergency === "1" || emergency === "true") where.isEmergency = true;
      if (status?.trim()) {
        if (status === "active") {
          where.status = { in: ["PENDING", "CONFIRMED", "IN_CALL"] };
        } else {
          where.status = status as ConsultStatus;
        }
      }

      const consultations = await this.prisma.consultation.findMany({
        where,
        include: {
          doctor: {
            select: {
              id: true,
              slug: true,
              name: true,
              specialty: true,
              image: true,
              fee: true,
              hospital: true,
              isEmergency: true,
            },
          },
          prescription: {
            include: { items: { orderBy: { sortOrder: "asc" } } },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: p.skip,
        take: p.take + 1,
      });

      return {
        consultations: consultations.slice(0, p.take),
        page: p.page,
        hasMore: consultations.length > p.take,
      };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error("Consultations list error:", err);
      throw new ApiError(500, "Failed to load consultations");
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @OptionalAuth()
  @ApiOperation({
    summary: "Book a consult (emergency instant or scheduled slot)",
  })
  async create(
    @Body()
    body: {
      doctorId: string;
      patientName: string;
      patientPhone: string;
      patientAge?: number;
      patientGender?: string;
      symptoms?: string;
      type?: "VIDEO" | "AUDIO";
      scheduledAt?: string | null;
      instant?: boolean;
      emergency?: boolean;
    },
    @CurrentUser() session?: AuthUser,
  ) {
    try {
      const {
        doctorId,
        patientName,
        patientPhone,
        patientAge,
        patientGender,
        symptoms,
        type = "VIDEO",
        scheduledAt,
        instant,
        emergency,
      } = body || ({} as never);

      if (!doctorId || !patientName?.trim() || !patientPhone?.trim()) {
        throw new ApiError(400, "Doctor, patient name and phone are required");
      }

      const doctor = await this.prisma.doctor.findUnique({
        where: { id: doctorId },
        include: { schedules: true },
      });

      if (!doctor || !doctor.isActive) {
        throw new ApiError(404, "Doctor not found");
      }

      /**
       * Rules:
       * - EMERGENCY/INSTANT: only emergency doctors who are online → join immediately
       * - NORMAL: must schedule a slot (audio or video)
       */
      const wantsEmergency =
        Boolean(emergency) || Boolean(instant) || !scheduledAt;

      let isEmergencyConsult = false;
      let scheduled: Date | null = null;
      let fee = doctor.fee;

      if (wantsEmergency) {
        // Instant only for emergency-flagged doctors
        if (!doctor.isEmergency) {
          throw new ApiError(
            409,
            "This doctor requires a scheduled appointment. Please pick a time slot for audio/video consult.",
          );
        }
        if (!doctor.isOnline) {
          throw new ApiError(
            409,
            "Emergency doctor is offline right now. Please try another emergency doctor or schedule a normal consult.",
          );
        }
        isEmergencyConsult = true;
        scheduled = new Date();
        fee =
          typeof doctor.emergencyFee === "number" && doctor.emergencyFee > 0
            ? doctor.emergencyFee
            : doctor.fee;
      } else {
        // Normal scheduled path
        scheduled = new Date(scheduledAt!);
        if (Number.isNaN(scheduled.getTime())) {
          throw new ApiError(400, "Invalid schedule time");
        }
        if (scheduled.getTime() < Date.now() - 60_000) {
          throw new ApiError(400, "Cannot book a past slot");
        }
        // Optional: verify within weekly schedule for non-emergency
        const schedules: ScheduleRow[] = doctor.schedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          slotMins: s.slotMins,
          isActive: s.isActive,
        }));
        // Allow booking future slots even if currently offline
        if (schedules.length === 0) {
          throw new ApiError(409, "Doctor has no schedule configured");
        }
        isEmergencyConsult = false;
        fee = doctor.fee;
      }

      const consultNumber = makeRefNumber("CB");
      const channelName = makeChannelName(consultNumber);

      const consultation = await this.prisma.consultation.create({
        data: {
          consultNumber,
          doctorId: doctor.id,
          patientName: patientName.trim() || session?.name || "",
          patientPhone: patientPhone.trim(),
          patientAge:
            typeof patientAge === "number" && patientAge > 0
              ? Math.floor(patientAge)
              : null,
          patientGender: patientGender?.trim() || null,
          symptoms: symptoms?.trim() || null,
          type: type === "AUDIO" ? "AUDIO" : "VIDEO",
          // Emergency queue starts PENDING (doctor accepts); scheduled is CONFIRMED
          status: isEmergencyConsult ? "PENDING" : "CONFIRMED",
          isEmergency: isEmergencyConsult,
          scheduledAt: scheduled,
          channelName,
          fee,
        },
        include: {
          doctor: {
            select: {
              id: true,
              slug: true,
              name: true,
              specialty: true,
              image: true,
              fee: true,
              isEmergency: true,
            },
          },
        },
      });

      return {
        success: true,
        consultation: {
          id: consultation.id,
          consultNumber: consultation.consultNumber,
          status: consultation.status,
          type: consultation.type,
          fee: consultation.fee,
          isEmergency: consultation.isEmergency,
          scheduledAt: consultation.scheduledAt,
          channelName: consultation.channelName,
          doctor: consultation.doctor,
          patientName: consultation.patientName,
        },
      };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error("Book consultation error:", err);
      throw new ApiError(500, "Failed to book consultation");
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Consultation by id or consult number" })
  async detail(@Param("id") id: string) {
    try {
      const consultation = await this.prisma.consultation.findFirst({
        where: {
          OR: [{ id }, { consultNumber: id }],
        },
        include: {
          doctor: true,
          prescription: {
            include: { items: { orderBy: { sortOrder: "asc" } } },
          },
        },
      });

      if (!consultation) {
        throw new ApiError(404, "Consultation not found");
      }

      return { consultation };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error("Consultation get error:", err);
      throw new ApiError(500, "Failed to load consultation");
    }
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Consultation lifecycle: accept/start/join/complete/end/cancel",
  })
  async patch(
    @Param("id") id: string,
    @Body() body: { action?: string; status?: ConsultStatus },
  ) {
    try {
      const action = body?.action;

      const consultation = await this.prisma.consultation.findFirst({
        where: { OR: [{ id }, { consultNumber: id }] },
      });

      if (!consultation) {
        throw new ApiError(404, "Consultation not found");
      }

      let status = consultation.status;
      let startedAt = consultation.startedAt;
      let endedAt = consultation.endedAt;

      switch (action) {
        case "accept":
          if (["PENDING", "CONFIRMED"].includes(consultation.status)) {
            status = "CONFIRMED";
          }
          break;
        case "start":
        case "join":
          if (
            consultation.status !== "CANCELLED" &&
            consultation.status !== "COMPLETED"
          ) {
            status = "IN_CALL";
            if (!startedAt) startedAt = new Date();
          }
          break;
        case "complete":
        case "end":
          status = "COMPLETED";
          endedAt = new Date();
          if (!startedAt) startedAt = consultation.startedAt ?? new Date();
          break;
        case "cancel":
          if (!["COMPLETED", "IN_CALL"].includes(consultation.status)) {
            status = "CANCELLED";
            endedAt = new Date();
          }
          break;
        default:
          if (body?.status) {
            status = body.status;
          } else {
            throw new ApiError(400, "Unknown action");
          }
      }

      const updated = await this.prisma.consultation.update({
        where: { id: consultation.id },
        data: { status, startedAt, endedAt },
        include: {
          doctor: {
            select: {
              id: true,
              slug: true,
              name: true,
              specialty: true,
              image: true,
            },
          },
          prescription: {
            include: { items: { orderBy: { sortOrder: "asc" } } },
          },
        },
      });

      return { success: true, consultation: updated };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error("Consultation patch error:", err);
      throw new ApiError(500, "Failed to update consultation");
    }
  }
}
