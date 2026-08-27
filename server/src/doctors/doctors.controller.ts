import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { DoctorsService } from "./doctors.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";

@ApiTags("doctors")
@Controller("doctors")
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "List doctors (filter by specialty/q/available/emergency)",
  })
  async list(
    @Query("specialty") specialty?: string,
    @Query("q") q?: string,
    @Query("available") available?: string,
    @Query("emergency") emergency?: string,
  ) {
    const doctors = await this.doctorsService.listDoctors({
      specialty,
      q,
      availableOnly: available === "1" || available === "true",
      emergencyOnly: emergency === "1" || emergency === "true",
    });
    return { doctors, count: doctors.length };
  }

  @Get(":slug")
  @ApiOperation({ summary: "Doctor detail with schedule + bookable slots" })
  async detail(@Param("slug") slug: string) {
    const doctor = await this.doctorsService.getDoctorBySlug(slug);
    return { doctor };
  }

  @Patch(":slug")
  @UseGuards(JwtAuthGuard)
  @Roles("DOCTOR", "ADMIN")
  @ApiOperation({ summary: "Update doctor (toggle online) — doctor portal" })
  async patch(
    @Param("slug") slug: string,
    @Body() body: { isOnline?: boolean },
  ) {
    const doctor = await this.prisma.doctor.findUnique({ where: { slug } });
    if (!doctor) throw new NotFoundException("Doctor not found");

    const data: { isOnline?: boolean } = {};
    if (typeof body?.isOnline === "boolean") data.isOnline = body.isOnline;

    const updated = await this.prisma.doctor.update({
      where: { id: doctor.id },
      data,
    });
    return { success: true, isOnline: updated.isOnline };
  }
}
