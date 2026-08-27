import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";

@ApiTags("admin")
@Controller("admin/launch")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminLaunchController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Launch checklist counts + env flags" })
  async checklist() {
    const [
      products,
      activeProducts,
      doctors,
      labTests,
      admins,
      pendingReviews,
      pendingOrders,
      vendors,
      riders,
      coupons,
      openTickets,
      refunds,
      settlements,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({
        where: { isActive: true, stock: { gt: 0 } },
      }),
      this.prisma.doctor.count({ where: { isActive: true } }),
      this.prisma.labTest.count({ where: { isActive: true } }),
      this.prisma.adminUser.count(),
      this.prisma.productReview.count({ where: { status: "PENDING" } }),
      this.prisma.order.count({
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
      }),
      this.prisma.vendor.count({ where: { status: "ACTIVE" } }),
      this.prisma.rider.count({ where: { isActive: true } }),
      this.prisma.coupon.count({ where: { isActive: true } }),
      this.prisma.supportTicket.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
      this.prisma.refundRequest.count(),
      this.prisma.doctorSettlement.count(),
    ]);

    return {
      products,
      activeProducts,
      doctors,
      labTests,
      admins,
      pendingReviews,
      pendingOrders,
      vendors,
      riders,
      coupons,
      openTickets,
      refunds,
      settlements,
      hasAgora: Boolean(
        process.env.AGORA_APP_ID && process.env.AGORA_APP_CERTIFICATE,
      ),
      hasDb: Boolean(process.env.DATABASE_URL),
    };
  }
}
