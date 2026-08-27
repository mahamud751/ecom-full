import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError, slugify } from "../common/utils";

type ScheduleInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMins?: number;
  isActive?: boolean;
};

@ApiTags("admin")
@Controller("admin/doctors")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminDoctorsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Doctors list with earnings or single detail" })
  async list(@Query("id") id?: string) {
    if (id) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { id },
        include: {
          schedules: { orderBy: { dayOfWeek: "asc" } },
          consultations: {
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
              prescription: { select: { id: true } },
            },
          },
          _count: { select: { consultations: true } },
        },
      });
      if (!doctor) throw new ApiError(404, "Doctor not found");

      const completed = doctor.consultations.filter(
        (c) => c.status === "COMPLETED",
      );
      const cut = (doctor.platformCutPct ?? 20) / 100;
      let gross = 0;
      let platform = 0;
      let doctorShare = 0;
      for (const c of completed) {
        gross += c.fee;
        platform += c.fee * cut;
        doctorShare += c.fee * (1 - cut);
      }

      const byStatus: Record<string, number> = {};
      for (const c of doctor.consultations) {
        byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      }

      return {
        doctor,
        earnings: {
          completedCount: completed.length,
          gross,
          platform,
          doctorShare,
          platformCutPct: doctor.platformCutPct,
          byStatus,
        },
      };
    }

    const doctors = await this.prisma.doctor.findMany({
      include: {
        schedules: { orderBy: { dayOfWeek: "asc" } },
        consultations: {
          where: { status: "COMPLETED" },
          select: { fee: true },
        },
        _count: { select: { consultations: true } },
      },
      orderBy: { name: "asc" },
    });

    const enriched = doctors.map((d) => {
      const cut = (d.platformCutPct ?? 20) / 100;
      const gross = d.consultations.reduce((s, c) => s + c.fee, 0);
      const platform = gross * cut;
      const doctorShare = gross - platform;
      const { consultations, ...rest } = d;
      return {
        ...rest,
        completedConsults: consultations.length,
        earnings: { gross, platform, doctorShare },
      };
    });

    return { doctors: enriched };
  }

  @Post()
  @ApiOperation({ summary: "Create a doctor (with schedules)" })
  async create(@Body() body: Record<string, any>) {
    try {
      const name = String(body.name || "").trim();
      if (!name || !body.specialty)
        throw new ApiError(400, "name and specialty required");
      let slug = slugify(body.slug || name);
      if (await this.prisma.doctor.findUnique({ where: { slug } })) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
      const doctor = await this.prisma.doctor.create({
        data: {
          name,
          slug,
          specialty: body.specialty,
          image:
            body.image ||
            "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80",
          experience: Number(body.experience ?? 5),
          fee: Number(body.fee ?? 299),
          hospital: body.hospital || null,
          languages: body.languages || "Bangla, English",
          bio: body.bio || null,
          bmdcNumber: body.bmdcNumber || null,
          phone: body.phone || null,
          email: body.email || null,
          platformCutPct: Number(body.platformCutPct ?? 20),
          isOnline: Boolean(body.isOnline),
          isActive: body.isActive !== false,
          schedules: body.schedules
            ? {
                create: (body.schedules as ScheduleInput[]).map((s) => ({
                  dayOfWeek: s.dayOfWeek,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  slotMins: s.slotMins ?? 30,
                  isActive: s.isActive !== false,
                })),
              }
            : {
                create: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
                  dayOfWeek,
                  startTime: "09:00",
                  endTime: "18:00",
                  slotMins: 30,
                })),
              },
        },
        include: { schedules: true },
      });
      return { doctor };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Create doctor failed");
    }
  }

  @Patch()
  @ApiOperation({ summary: "Update a doctor (full schedule replace)" })
  async update(@Body() body: Record<string, any>) {
    try {
      if (!body.id) throw new ApiError(400, "id required");

      // Full schedule replace
      if (Array.isArray(body.schedules)) {
        await this.prisma.doctorSchedule.deleteMany({
          where: { doctorId: body.id },
        });
        await this.prisma.doctorSchedule.createMany({
          data: (body.schedules as ScheduleInput[]).map((s) => ({
            doctorId: body.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            slotMins: s.slotMins ?? 30,
            isActive: s.isActive !== false,
          })),
        });
      }

      const doctor = await this.prisma.doctor.update({
        where: { id: body.id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.specialty !== undefined
            ? { specialty: body.specialty }
            : {}),
          ...(body.image !== undefined ? { image: body.image } : {}),
          ...(body.experience !== undefined
            ? { experience: Number(body.experience) }
            : {}),
          ...(body.fee !== undefined ? { fee: Number(body.fee) } : {}),
          ...(body.hospital !== undefined ? { hospital: body.hospital } : {}),
          ...(body.languages !== undefined
            ? { languages: body.languages }
            : {}),
          ...(body.bio !== undefined ? { bio: body.bio } : {}),
          ...(body.bmdcNumber !== undefined
            ? { bmdcNumber: body.bmdcNumber }
            : {}),
          ...(body.phone !== undefined ? { phone: body.phone } : {}),
          ...(body.email !== undefined ? { email: body.email } : {}),
          ...(body.platformCutPct !== undefined
            ? { platformCutPct: Number(body.platformCutPct) }
            : {}),
          ...(body.isOnline !== undefined
            ? { isOnline: Boolean(body.isOnline) }
            : {}),
          ...(body.isActive !== undefined
            ? { isActive: Boolean(body.isActive) }
            : {}),
          ...(body.patients !== undefined ? { patients: body.patients } : {}),
          ...(body.rating !== undefined ? { rating: Number(body.rating) } : {}),
        },
        include: { schedules: { orderBy: { dayOfWeek: "asc" } } },
      });
      return { doctor };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Update doctor failed");
    }
  }

  @Delete()
  @ApiOperation({ summary: "Soft-delete a doctor" })
  async remove(@Query("id") id: string) {
    if (!id) throw new ApiError(400, "id required");
    // Soft-delete: hide from public, keep history
    await this.prisma.doctor.update({
      where: { id },
      data: { isActive: false, isOnline: false },
    });
    return { success: true };
  }
}
