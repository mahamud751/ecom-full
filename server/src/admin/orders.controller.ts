import { Body, Controller, Get, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError } from "../common/utils";

@ApiTags("admin")
@Controller("admin/orders")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminOrdersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List orders (status / search)" })
  async list(@Query("status") status?: string, @Query("q") q?: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(q
          ? {
              OR: [
                { orderNumber: { contains: q, mode: "insensitive" } },
                { customerName: { contains: q, mode: "insensitive" } },
                { customerPhone: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        items: true,
        rider: true,
        vendor: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { orders };
  }

  @Patch()
  @ApiOperation({ summary: "Update order status / rider / payment" })
  async update(@Body() body: Record<string, any>) {
    try {
      if (!body.id) throw new ApiError(400, "id required");

      const data: Record<string, unknown> = {};
      if (body.status) {
        data.status = body.status;
        if (body.status === "SHIPPED") data.shippedAt = new Date();
        if (body.status === "DELIVERED") data.deliveredAt = new Date();
      }
      if (body.paymentStatus) data.paymentStatus = body.paymentStatus;
      if (body.riderId !== undefined) {
        data.riderId = body.riderId || null;
        if (body.riderId) {
          data.assignedAt = new Date();
          await this.prisma.rider.update({
            where: { id: body.riderId },
            data: { status: "BUSY" },
          });
        }
      }
      if (body.vendorId !== undefined) data.vendorId = body.vendorId || null;
      if (body.notes !== undefined) data.notes = body.notes;

      const order = await this.prisma.order.update({
        where: { id: body.id },
        data,
        include: { items: true, rider: true, vendor: true },
      });

      // Free rider on deliver/cancel
      if (
        order.riderId &&
        (order.status === "DELIVERED" || order.status === "CANCELLED")
      ) {
        await this.prisma.rider.update({
          where: { id: order.riderId },
          data: { status: "AVAILABLE" },
        });
      }

      return { order };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Update order failed");
    }
  }
}
