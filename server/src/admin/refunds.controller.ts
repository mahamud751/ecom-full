import { Body, Controller, Get, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError } from "../common/utils";

@ApiTags("admin")
@Controller("admin/refunds")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminRefundsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List refund requests" })
  async list(@Query("status") status?: string) {
    const refunds = await this.prisma.refundRequest.findMany({
      where: status ? { status: status as never } : undefined,
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            total: true,
            status: true,
            paymentStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { refunds };
  }

  @Patch()
  @ApiOperation({ summary: "Update refund status / amount / note" })
  async update(@Body() body: Record<string, any>) {
    try {
      if (!body.id) throw new ApiError(400, "id required");
      const status = body.status as string | undefined;

      const refund = await this.prisma.refundRequest.update({
        where: { id: body.id },
        data: {
          ...(status ? { status } : {}),
          ...(body.adminNote !== undefined
            ? { adminNote: body.adminNote }
            : {}),
          ...(body.refundAmount !== undefined
            ? { refundAmount: Number(body.refundAmount) }
            : {}),
        },
        include: { order: true },
      });

      if (status === "REFUNDED" || status === "APPROVED") {
        await this.prisma.order.update({
          where: { id: refund.orderId },
          data: {
            paymentStatus:
              status === "REFUNDED" ? "REFUNDED" : refund.order.paymentStatus,
            ...(status === "REFUNDED" ? { status: "CANCELLED" } : {}),
          },
        });
      }

      return { refund };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Update failed");
    }
  }
}
