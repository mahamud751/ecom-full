import { Body, Controller, Delete, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError } from "../common/utils";

@ApiTags("notify")
@Controller("notify")
export class NotifyController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List product alerts by contact/productId" })
  async list(
    @Query("contact") contact?: string,
    @Query("productId") productId?: string,
    @Query("status") status?: string,
  ) {
    try {
      const c = contact?.trim();
      if (!c && !productId) {
        throw new ApiError(400, "contact or productId required");
      }

      const notifies = await this.prisma.productNotify.findMany({
        where: {
          ...(c ? { contact: c } : {}),
          ...(productId ? { productId } : {}),
          ...(status ? { status } : { status: { in: ["ACTIVE", "READY"] } }),
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              price: true,
              stock: true,
              comparePrice: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return { notifies };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Failed to load notifies");
    }
  }

  @Post()
  @ApiOperation({ summary: "Create a stock/price-drop alert" })
  async create(
    @Body()
    body: {
      productId?: string;
      contact?: string;
      type?: string;
      contactType?: string;
      targetPrice?: number;
      note?: string;
    },
  ) {
    try {
      const productId = String(body?.productId || "");
      const contact = String(body?.contact || "").trim();
      const type = body?.type === "PRICE" ? "PRICE" : "STOCK";
      const contactType =
        contact.includes("@") || body?.contactType === "email"
          ? "email"
          : "phone";
      const targetPrice =
        type === "PRICE" && body?.targetPrice != null
          ? Number(body.targetPrice)
          : null;

      if (!productId || !contact) {
        throw new ApiError(400, "productId and contact (phone/email) required");
      }

      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product || !product.isActive) {
        throw new ApiError(404, "Product not found");
      }

      // Already in stock for STOCK alerts
      if (type === "STOCK" && product.stock > 0) {
        throw new ApiError(
          409,
          "Product is already in stock — add to cart instead",
        );
      }

      // Dedupe active alerts
      const existing = await this.prisma.productNotify.findFirst({
        where: {
          productId,
          contact,
          type,
          status: "ACTIVE",
        },
      });
      if (existing) {
        return {
          success: true,
          notify: existing,
          message: "You already have an active alert for this product",
        };
      }

      const notify = await this.prisma.productNotify.create({
        data: {
          productId,
          type,
          contact,
          contactType,
          targetPrice,
          status: "ACTIVE",
          note: body?.note || null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              price: true,
              stock: true,
            },
          },
        },
      });

      return {
        success: true,
        notify,
        message:
          type === "STOCK"
            ? "We'll notify you when this is back in stock"
            : "We'll notify you if the price drops",
      };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Failed to create alert");
    }
  }

  @Delete()
  @ApiOperation({ summary: "Cancel an alert by id" })
  async cancel(@Query("id") id?: string) {
    try {
      if (!id) {
        throw new ApiError(400, "id required");
      }
      await this.prisma.productNotify.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      return { success: true };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Failed to cancel");
    }
  }
}
