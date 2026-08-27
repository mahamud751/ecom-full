import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError } from "../common/utils";

@ApiTags("admin")
@Controller("admin/settlements")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminSettlementsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List doctor settlements" })
  async list() {
    const settlements = await this.prisma.doctorSettlement.findMany({
      include: {
        doctor: {
          select: { id: true, name: true, specialty: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { settlements };
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

      const consults = await this.prisma.consultation.findMany({
        where: {
          status: "COMPLETED",
          createdAt: { gte: periodStart, lte: periodEnd },
        },
        include: { doctor: true },
      });

      const byDoctor = new Map<
        string,
        {
          doctorId: string;
          count: number;
          gross: number;
          platform: number;
          share: number;
        }
      >();

      for (const c of consults) {
        const cut = (c.doctor.platformCutPct ?? 20) / 100;
        const fee = c.fee || 0;
        const platform = fee * cut;
        const share = fee - platform;
        const row = byDoctor.get(c.doctorId) || {
          doctorId: c.doctorId,
          count: 0,
          gross: 0,
          platform: 0,
          share: 0,
        };
        row.count += 1;
        row.gross += fee;
        row.platform += platform;
        row.share += share;
        byDoctor.set(c.doctorId, row);
      }

      const created: Record<string, unknown>[] = [];
      for (const row of byDoctor.values()) {
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
