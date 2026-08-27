import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError } from "../common/utils";

@ApiTags("admin")
@Controller("admin/coupons")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminCouponsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List coupons" })
  async list() {
    const coupons = await this.prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { coupons };
  }

  @Post()
  @ApiOperation({ summary: "Create a coupon" })
  async create(@Body() body: Record<string, any>) {
    try {
      const code = String(body.code || "")
        .trim()
        .toUpperCase();
      if (!code || body.value == null)
        throw new ApiError(400, "code and value required");
      const coupon = await this.prisma.coupon.create({
        data: {
          code,
          description: body.description || null,
          type: body.type === "FIXED" ? "FIXED" : "PERCENT",
          value: Number(body.value),
          minOrder: Number(body.minOrder ?? 0),
          maxDiscount:
            body.maxDiscount != null ? Number(body.maxDiscount) : null,
          usageLimit: body.usageLimit != null ? Number(body.usageLimit) : null,
          isActive: body.isActive !== false,
          endsAt: body.endsAt ? new Date(body.endsAt) : null,
        },
      });
      return { coupon };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Create failed");
    }
  }

  @Patch()
  @ApiOperation({ summary: "Update a coupon" })
  async update(@Body() body: Record<string, any>) {
    try {
      if (!body.id) throw new ApiError(400, "id required");
      const coupon = await this.prisma.coupon.update({
        where: { id: body.id },
        data: {
          ...(body.isActive !== undefined
            ? { isActive: Boolean(body.isActive) }
            : {}),
          ...(body.description !== undefined
            ? { description: body.description }
            : {}),
          ...(body.value !== undefined ? { value: Number(body.value) } : {}),
          ...(body.minOrder !== undefined
            ? { minOrder: Number(body.minOrder) }
            : {}),
          ...(body.usageLimit !== undefined
            ? {
                usageLimit:
                  body.usageLimit != null ? Number(body.usageLimit) : null,
              }
            : {}),
        },
      });
      return { coupon };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Update failed");
    }
  }
}
