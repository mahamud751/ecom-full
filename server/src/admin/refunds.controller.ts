import { Body, Controller, Get, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError } from "../common/utils";
import { pageParams, pagination } from "../common/pagination";

@ApiTags("admin")
@Controller("admin/refunds")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminRefundsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List refund requests" })
  async list(
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    const p = pageParams({ page, perPage }, { perPage: 100 });
    const where = status ? { status: status as never } : undefined;
    const refunds = await this.prisma.refundRequest.findMany({
      where,
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
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: p.skip,
      take: p.take,
    });
    const total = await this.prisma.refundRequest.count({ where });
    return { refunds, pagination: pagination(p, total) };
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
