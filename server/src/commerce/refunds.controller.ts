import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError, makeRefNumber } from "../common/utils";

@ApiTags("refunds")
@Controller("refunds")
export class RefundsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({
    summary: "Create a refund request (verified by order phone)",
  })
  async create(
    @Body()
    body: {
      orderNumber?: string;
      phone?: string;
      reason?: string;
      details?: string;
      refundAmount?: number;
      images?: string[];
    },
  ) {
    try {
      const orderNumber = String(body?.orderNumber || "").trim();
      const phone = String(body?.phone || "").trim();
      const reason = String(body?.reason || "").trim();
      if (!orderNumber || !phone || !reason) {
        throw new ApiError(400, "Order number, phone and reason required");
      }

      const order = await this.prisma.order.findUnique({
        where: { orderNumber },
      });
      if (!order) {
        throw new ApiError(404, "Order not found");
      }
      const digits = phone.replace(/\D/g, "");
      const orderDigits = order.customerPhone.replace(/\D/g, "");
      if (
        !orderDigits.endsWith(digits.slice(-10)) &&
        !orderDigits.includes(digits)
      ) {
        throw new ApiError(403, "Phone does not match this order");
      }
      if (["CANCELLED"].includes(order.status)) {
        throw new ApiError(400, "Cannot refund a cancelled order");
      }

      const existing = await this.prisma.refundRequest.findFirst({
        where: {
          orderId: order.id,
          status: { in: ["REQUESTED", "APPROVED"] },
        },
      });
      if (existing) {
        throw new ApiError(409, "A refund request already exists", {
          requestNo: existing.requestNo,
        });
      }

      const requestNo = makeRefNumber("RF");
      const refund = await this.prisma.refundRequest.create({
        data: {
          requestNo,
          orderId: order.id,
          reason,
          details: body?.details?.trim() || null,
          refundAmount:
            body?.refundAmount != null
              ? Number(body.refundAmount)
              : order.total,
          images: body?.images || [],
          status: "REQUESTED",
        },
      });

      return { success: true, refund };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Failed to create refund request");
    }
  }

  @Get()
  @ApiOperation({
    summary: "Look up refund(s) by request number or order number",
  })
  async lookup(
    @Query("request") requestNo?: string,
    @Query("order") orderNumber?: string,
  ) {
    try {
      if (requestNo) {
        const refund = await this.prisma.refundRequest.findUnique({
          where: { requestNo },
          include: {
            order: { select: { orderNumber: true, total: true, status: true } },
          },
        });
        if (!refund) {
          throw new ApiError(404, "Not found");
        }
        return { refund };
      }
      if (orderNumber) {
        const order = await this.prisma.order.findUnique({
          where: { orderNumber },
        });
        if (!order) {
          return { refunds: [] };
        }
        const refunds = await this.prisma.refundRequest.findMany({
          where: { orderId: order.id },
          orderBy: { createdAt: "desc" },
        });
        return { refunds };
      }
      throw new ApiError(400, "request or order required");
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Failed");
    }
  }
}
