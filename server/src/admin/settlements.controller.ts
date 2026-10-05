import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError } from "../common/utils";
import { pageParams, pagination } from "../common/pagination";

@ApiTags("admin")
@Controller("admin/settlements")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminSettlementsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List doctor settlements" })
  async list(@Query("page") page?: string, @Query("perPage") perPage?: string) {
    const p = pageParams({ page, perPage }, { perPage: 100 });
    const settlements = await this.prisma.doctorSettlement.findMany({
      include: {
        doctor: {
          select: { id: true, name: true, specialty: true, image: true },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: p.skip,
      take: p.take,
    });
    const total = await this.prisma.doctorSettlement.count();
    return { settlements, pagination: pagination(p, total) };
  }

  /** Generate draft settlements for a period from completed consults */
  @Post()
  @ApiOperation({ summary: "Generate draft settlements for a period" })
  async generate(@Body() body: Record<string, any>) {
    try {
      const periodStart = body.periodStart
        ? new Date(body.periodStart)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const periodEnd = body.periodEnd ? new Date(body.periodEnd) : new Date();

      // Summed per doctor in the database — a month of consults can be large.
      const groups = await this.prisma.consultation.groupBy({
        by: ["doctorId"],
        where: {
          status: "COMPLETED",
          createdAt: { gte: periodStart, lte: periodEnd },
        },
        _sum: { fee: true },
        _count: { _all: true },
      });
      const doctors = await this.prisma.doctor.findMany({
        where: { id: { in: groups.map((g) => g.doctorId) } },
        select: { id: true, platformCutPct: true },
      });
      const cutById = new Map(
        doctors.map((d) => [d.id, (d.platformCutPct ?? 20) / 100]),
      );

      const byDoctor = groups.map((g) => {
        const gross = Number(g._sum.fee) || 0;
        const platform = gross * (cutById.get(g.doctorId) ?? 0.2);
        return {
          doctorId: g.doctorId,
          count: g._count._all,
          gross,
          platform,
          share: gross - platform,
        };
      });

      const created: Record<string, unknown>[] = [];
      for (const row of byDoctor) {
        const settlementNo = `STL-${Date.now().toString(36).toUpperCase()}-${row.doctorId.slice(-4)}`;
        const s = await this.prisma.doctorSettlement.create({
          data: {
            settlementNo,
            doctorId: row.doctorId,
            periodStart,
            periodEnd,
            consultCount: row.count,
            grossFees: Math.round(row.gross * 100) / 100,
            platformCut: Math.round(row.platform * 100) / 100,
            doctorShare: Math.round(row.share * 100) / 100,
            status: "DRAFT",
          },
        });
        created.push(s);
      }

      return { created: created.length, settlements: created };
    } catch (e) {
      console.error(e);
      throw new ApiError(500, "Settlement generation failed");
    }
  }

  @Patch()
  @ApiOperation({ summary: "Update settlement status / note" })
  async update(@Body() body: Record<string, any>) {
    try {
      if (!body.id) throw new ApiError(400, "id required");
      const settlement = await this.prisma.doctorSettlement.update({
        where: { id: body.id },
        data: {
          ...(body.status ? { status: body.status } : {}),
          ...(body.status === "PAID" ? { paidAt: new Date() } : {}),
          ...(body.note !== undefined ? { note: body.note } : {}),
        },
        include: { doctor: { select: { name: true } } },
      });
      return { settlement };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Update failed");
    }
  }
}
