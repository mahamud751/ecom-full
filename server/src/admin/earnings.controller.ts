import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError } from "../common/utils";

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

      // ── Doctor consults (full doctor include) ─────────────────
      const completedConsults = await this.prisma.consultation.findMany({
        where: { status: "COMPLETED" },
        include: { doctor: true },
      });

      let doctorGross = 0;
      let doctorPlatform = 0;
      let doctorPayout = 0;
      const doctorMap = new Map<
        string,
        {
          id: string;
          name: string;
          specialty: string;
          consults: number;
          gross: number;
          platform: number;
          doctorShare: number;
        }
      >();

      for (const c of completedConsults) {
        const fee = Number(c.fee) || 0;
        const cutPct = c.doctor.platformCutPct ?? 20;
        const cut = cutPct / 100;
        const platform = fee * cut;
        const share = fee - platform;
        doctorGross += fee;
        doctorPlatform += platform;
        doctorPayout += share;

        const row = doctorMap.get(c.doctorId) || {
          id: c.doctor.id,
          name: c.doctor.name,
          specialty: c.doctor.specialty,
          consults: 0,
          gross: 0,
          platform: 0,
          doctorShare: 0,
        };
        row.consults += 1;
        row.gross += fee;
        row.platform += platform;
        row.doctorShare += share;
        doctorMap.set(c.doctorId, row);
      }

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

      // ── Riders ─────────────────────────────────────────────────
      const deliveredWithRider = await this.prisma.order.findMany({
        where: { status: "DELIVERED", riderId: { not: null } },
        include: { rider: true },
      });

      let deliveryFeesCollected = 0;
      let riderPayoutTotal = 0;
      const riderMap = new Map<
        string,
        {
          id: string;
          name: string;
          phone: string;
          zone: string | null;
          deliveries: number;
          deliveryFees: number;
          riderEarned: number;
          platformKept: number;
        }
      >();

      for (const o of deliveredWithRider) {
        if (!o.rider) continue;
        const fee = Number(o.deliveryFee) || 0;
        const perDelivery = o.rider.perDelivery ?? 40;
        const earned = Math.min(perDelivery, fee);
        const kept = Math.max(0, fee - earned);
        deliveryFeesCollected += fee;
        riderPayoutTotal += earned;

        const row = riderMap.get(o.rider.id) || {
          id: o.rider.id,
          name: o.rider.name,
          phone: o.rider.phone,
          zone: o.rider.zone,
          deliveries: 0,
          deliveryFees: 0,
          riderEarned: 0,
          platformKept: 0,
        };
        row.deliveries += 1;
        row.deliveryFees += fee;
        row.riderEarned += earned;
        row.platformKept += kept;
        riderMap.set(o.rider.id, row);
      }

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
          completedConsults: completedConsults.length,
          activeConsults,
          allConsults,
          gross: doctorGross,
          platform: doctorPlatform,
          doctorPayout,
          leaders: Array.from(doctorMap.values()).sort(
            (a, b) => b.gross - a.gross,
          ),
        },
        lab: {
          bookingCount: labAgg._count._all,
          revenue: labRevenue,
          reportReadyCount: labReady._count._all,
          reportReadyRevenue: labReady._sum.total ?? 0,
        },
        riders: {
          deliveryCount: deliveredWithRider.length,
          deliveryFeesCollected,
          riderPayoutTotal,
          platformMargin: Math.max(0, deliveryFeesCollected - riderPayoutTotal),
          leaders: Array.from(riderMap.values()).sort(
            (a, b) => b.riderEarned - a.riderEarned,
          ),
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
