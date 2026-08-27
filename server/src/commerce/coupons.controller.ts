import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError } from "../common/utils";

@ApiTags("coupons")
@Controller("coupons")
export class CouponsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("validate")
  @ApiOperation({ summary: "Validate a coupon against a subtotal" })
  async validate(@Body() body: { code?: string; subtotal?: number }) {
    try {
      const code = String(body?.code || "")
        .trim()
        .toUpperCase();
      const subtotal = Number(body?.subtotal || 0);
      if (!code) {
        throw new ApiError(400, "Coupon code required");
      }

      const coupon = await this.prisma.coupon.findUnique({ where: { code } });
      if (!coupon || !coupon.isActive) {
        throw new ApiError(404, "Invalid coupon");
      }
      const now = new Date();
      if (coupon.startsAt && coupon.startsAt > now) {
        throw new ApiError(400, "Coupon not active yet");
      }
      if (coupon.endsAt && coupon.endsAt < now) {
        throw new ApiError(400, "Coupon expired");
      }
      if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
        throw new ApiError(400, "Coupon usage limit reached");
      }
      if (subtotal < coupon.minOrder) {
        throw new ApiError(400, `Minimum order ৳${coupon.minOrder}`);
      }

      let discount =
        coupon.type === "FIXED"
          ? coupon.value
          : (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount != null) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
      discount = Math.min(discount, subtotal);
      discount = Math.round(discount * 100) / 100;

      return {
        valid: true,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
        description: coupon.description,
      };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Validation failed");
    }
  }
}
