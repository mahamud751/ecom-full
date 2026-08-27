import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError } from "../common/utils";

@ApiTags("admin")
@Controller("admin/dashboard")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminDashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Dashboard stats, recent orders and consults" })
  async stats() {
    try {
      const [
        products,
        lowStock,
        orders,
        pendingOrders,
        revenueAgg,
        doctors,
        consultations,
        labTests,
        labBookings,
        vendors,
        riders,
        onlineRiders,
      ] = await Promise.all([
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.product.count({
          where: { stock: { lte: 10 }, isActive: true },
        }),
        this.prisma.order.count(),
        this.prisma.order.count({
          where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } },
        }),
        this.prisma.order.aggregate({
          where: { status: { not: "CANCELLED" } },
          _sum: { total: true },
        }),
        this.prisma.doctor.count({ where: { isActive: true } }),
        this.prisma.consultation.count({
          where: { status: { in: ["PENDING", "CONFIRMED", "IN_CALL"] } },
        }),
        this.prisma.labTest.count({ where: { isActive: true } }),
        this.prisma.labBooking.count({
          where: {
            status: {
              in: ["PENDING", "CONFIRMED", "SAMPLE_COLLECTED", "PROCESSING"],
            },
          },
        }),
        this.prisma.vendor.count({ where: { status: "ACTIVE" } }),
        this.prisma.rider.count({ where: { isActive: true } }),
        this.prisma.rider.count({
          where: { isOnline: true, status: "AVAILABLE" },
        }),
      ]);

      const recentOrders = await this.prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { items: true, rider: true },
      });

      const recentConsults = await this.prisma.consultation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { doctor: { select: { name: true, specialty: true } } },
      });

      return {
        stats: {
          products,
          lowStock,
          orders,
          pendingOrders,
          revenue: revenueAgg._sum.total || 0,
          doctors,
          activeConsults: consultations,
          labTests,
          activeLabBookings: labBookings,
          vendors,
          riders,
          onlineRiders,
        },
        recentOrders,
        recentConsults,
      };
    } catch (e) {
      console.error(e);
      throw new ApiError(500, "Dashboard failed");
    }
  }
}
