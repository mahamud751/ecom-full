import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError } from "../common/utils";
import { doctorCompletedStats, riderDeliveryStats } from "./payout-stats";

@ApiTags("admin")
@Controller("admin/earnings")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminEarningsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Platform-wide earnings breakdown" })
  async earnings() {
    try {
      // ── Ecommerce ──────────────────────────────────────────────
      const [ecomAll, ecomPaid, ecomDelivered, ecomByStatus] =
        await Promise.all([
          this.prisma.order.aggregate({
            where: { status: { not: "CANCELLED" } },
            _sum: { total: true, deliveryFee: true, subtotal: true },
            _count: { _all: true },
          }),
          this.prisma.order.aggregate({
            where: { paymentStatus: "PAID", status: { not: "CANCELLED" } },
            _sum: { total: true },
            _count: { _all: true },
          }),
          this.prisma.order.aggregate({
            where: { status: "DELIVERED" },
            _sum: { total: true, deliveryFee: true },
            _count: { _all: true },
          }),
          this.prisma.order.groupBy({
            by: ["status"],
            _sum: { total: true },
            _count: { _all: true },
          }),
        ]);

      // ── Doctor consults (summed per doctor in the database) ──────
      const doctorStats = await doctorCompletedStats(this.prisma);
      const statDoctors = await this.prisma.doctor.findMany({
        where: { id: { in: [...doctorStats.keys()] } },
        select: { id: true, name: true, specialty: true, platformCutPct: true },
      });

      let doctorGross = 0;
      let doctorPlatform = 0;
      let doctorPayout = 0;
      let completedConsultCount = 0;
      const doctorLeaders = statDoctors.map((d) => {
        const st = doctorStats.get(d.id)!;
        const platform = st.gross * ((d.platformCutPct ?? 20) / 100);
        const doctorShare = st.gross - platform;
        doctorGross += st.gross;
        doctorPlatform += platform;
        doctorPayout += doctorShare;
        completedConsultCount += st.consults;
        return {
          id: d.id,
          name: d.name,
          specialty: d.specialty,
          consults: st.consults,
          gross: st.gross,
          platform,
          doctorShare,
        };
      });

      const [activeConsults, allConsults] = await Promise.all([
        this.prisma.consultation.count({
          where: { status: { in: ["PENDING", "CONFIRMED", "IN_CALL"] } },
        }),
        this.prisma.consultation.count(),
      ]);

      // ── Lab ────────────────────────────────────────────────────
      const [labAgg, labReady] = await Promise.all([
        this.prisma.labBooking.aggregate({
          where: { status: { not: "CANCELLED" } },
          _sum: { total: true },
          _count: { _all: true },
        }),
        this.prisma.labBooking.aggregate({
          where: { status: "REPORT_READY" },
          _sum: { total: true },
          _count: { _all: true },
        }),
      ]);

      // ── Riders (summed per rider in the database) ──────────────
      const riderStats = await riderDeliveryStats(this.prisma);
      const statRiders = await this.prisma.rider.findMany({
        where: { id: { in: riderStats.map((r) => r.riderId) } },
        select: { id: true, name: true, phone: true, zone: true },
      });
      const riderById = new Map(statRiders.map((r) => [r.id, r]));

      let deliveryFeesCollected = 0;
      let riderPayoutTotal = 0;
      let riderDeliveryCount = 0;
      const riderLeaders = riderStats.flatMap((st) => {
        const r = riderById.get(st.riderId);
        if (!r) return [];
        deliveryFeesCollected += st.deliveryFees;
        riderPayoutTotal += st.riderEarned;
        riderDeliveryCount += st.deliveries;
        return [
          {
            id: r.id,
            name: r.name,
            phone: r.phone,
            zone: r.zone,
            deliveries: st.deliveries,
            deliveryFees: st.deliveryFees,
            riderEarned: st.riderEarned,
            platformKept: Math.max(0, st.deliveryFees - st.riderEarned),
          },
        ];
      });

      const ecomRevenue = ecomAll._sum.total ?? 0;
      const labRevenue = labAgg._sum.total ?? 0;
      const platformEarnings =
        ecomRevenue +
        doctorPlatform +
        labRevenue +
        Math.max(0, deliveryFeesCollected - riderPayoutTotal);

      return {
        summary: {
          totalGross:
            ecomRevenue + doctorGross + labRevenue + deliveryFeesCollected,
          platformEarnings,
          ecomRevenue,
          doctorGross,
          doctorPlatform,
          doctorPayout,
          labRevenue,
          deliveryFeesCollected,
          riderPayoutTotal,
          deliveryMargin: Math.max(0, deliveryFeesCollected - riderPayoutTotal),
        },
        ecom: {
          orderCount: ecomAll._count._all,
          revenue: ecomRevenue,
          subtotal: ecomAll._sum.subtotal ?? 0,
          deliveryFees: ecomAll._sum.deliveryFee ?? 0,
          paidCount: ecomPaid._count._all,
          paidRevenue: ecomPaid._sum.total ?? 0,
          deliveredCount: ecomDelivered._count._all,
          deliveredRevenue: ecomDelivered._sum.total ?? 0,
          byStatus: ecomByStatus.map((s) => ({
            status: s.status,
            count: s._count._all,
            total: s._sum.total ?? 0,
          })),
        },
        doctors: {
          completedConsults: completedConsultCount,
          activeConsults,
          allConsults,
          gross: doctorGross,
          platform: doctorPlatform,
          doctorPayout,
          leaders: doctorLeaders.sort((a, b) => b.gross - a.gross),
        },
        lab: {
          bookingCount: labAgg._count._all,
          revenue: labRevenue,
          reportReadyCount: labReady._count._all,
          reportReadyRevenue: labReady._sum.total ?? 0,
        },
        riders: {
          deliveryCount: riderDeliveryCount,
          deliveryFeesCollected,
          riderPayoutTotal,
          platformMargin: Math.max(0, deliveryFeesCollected - riderPayoutTotal),
          leaders: riderLeaders.sort((a, b) => b.riderEarned - a.riderEarned),
        },
      };
    } catch (e) {
      console.error("Earnings error:", e);
      throw new ApiError(
        500,
        e instanceof Error
          ? `Earnings failed: ${e.message}`
          : "Earnings failed",
      );
    }
  }
}
