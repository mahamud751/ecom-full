import {
  Body,
  Controller,
  Delete,
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

@ApiTags("admin")
@Controller("admin/riders")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminRidersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Riders list or single rider with stats" })
  async list(@Query("id") id?: string) {
    if (id) {
      const rider = await this.prisma.rider.findUnique({
        where: { id },
        include: {
          orders: {
            orderBy: { createdAt: "desc" },
            take: 100,
            include: { items: true },
          },
          _count: { select: { orders: true } },
        },
      });
      if (!rider) throw new ApiError(404, "Rider not found");

      const delivered = rider.orders.filter((o) => o.status === "DELIVERED");
      const active = rider.orders.filter((o) =>
        ["PROCESSING", "SHIPPED", "CONFIRMED"].includes(o.status),
      );
      let deliveryFees = 0;
      let riderEarned = 0;
      let gmv = 0;
      for (const o of delivered) {
        deliveryFees += o.deliveryFee || 0;
        riderEarned += Math.min(rider.perDelivery, o.deliveryFee || 0);
        gmv += o.total;
      }

      return {
        rider,
        stats: {
          totalOrders: rider._count.orders,
          delivered: delivered.length,
          active: active.length,
          cancelled: rider.orders.filter((o) => o.status === "CANCELLED")
            .length,
          deliveryFees,
          riderEarned,
          platformKept: Math.max(0, deliveryFees - riderEarned),
          gmv,
        },
      };
    }

    const riders = await this.prisma.rider.findMany({
      include: {
        orders: {
          where: { status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] } },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            deliveryFee: true,
          },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { name: "asc" },
    });

    const enriched = riders.map((r) => {
      const delivered = r.orders.filter((o) => o.status === "DELIVERED");
      const earned = delivered.reduce(
        (s, o) => s + Math.min(r.perDelivery, o.deliveryFee || 0),
        0,
      );
      return {
        ...r,
        deliveredCount: delivered.length,
        activeCount: r.orders.filter((o) =>
          ["PROCESSING", "SHIPPED"].includes(o.status),
        ).length,
        earnings: earned,
      };
    });

    return { riders: enriched };
  }

  @Post()
  @ApiOperation({ summary: "Create a rider" })
  async create(@Body() body: Record<string, any>) {
    try {
      const name = String(body.name || "").trim();
      const phone = String(body.phone || "").trim();
      if (!name || !phone) throw new ApiError(400, "Name and phone required");
      const rider = await this.prisma.rider.create({
        data: {
          name,
          phone,
          vehicleType: body.vehicleType || "Bike",
          zone: body.zone || null,
          nid: body.nid || null,
          address: body.address || null,
          perDelivery: Number(body.perDelivery ?? 40),
          notes: body.notes || null,
          isOnline: Boolean(body.isOnline),
          status: body.isOnline ? "AVAILABLE" : "OFFLINE",
        },
      });
      return { rider };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Create rider failed");
    }
  }

  @Patch()
  @ApiOperation({ summary: "Update a rider" })
  async update(@Body() body: Record<string, any>) {
    try {
      if (!body.id) throw new ApiError(400, "id required");
      const data: Record<string, unknown> = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.phone !== undefined) data.phone = body.phone;
      if (body.vehicleType !== undefined) data.vehicleType = body.vehicleType;
      if (body.zone !== undefined) data.zone = body.zone;
      if (body.nid !== undefined) data.nid = body.nid;
      if (body.address !== undefined) data.address = body.address;
      if (body.notes !== undefined) data.notes = body.notes;
      if (body.perDelivery !== undefined)
        data.perDelivery = Number(body.perDelivery);
      if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
      if (body.isOnline !== undefined) {
        data.isOnline = Boolean(body.isOnline);
        if (body.status === undefined) {
          data.status = body.isOnline ? "AVAILABLE" : "OFFLINE";
        }
      }
      if (body.status !== undefined) data.status = body.status;
      const rider = await this.prisma.rider.update({
        where: { id: body.id },
        data,
      });
      return { rider };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Update rider failed");
    }
  }

  @Delete()
  @ApiOperation({ summary: "Soft-delete a rider" })
  async remove(@Query("id") id: string) {
    if (!id) throw new ApiError(400, "id required");
    await this.prisma.rider.update({
      where: { id },
      data: { isActive: false, isOnline: false, status: "OFFLINE" },
    });
    return { success: true };
  }
}
