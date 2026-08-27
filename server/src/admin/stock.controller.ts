import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser, JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ApiError } from "../common/utils";

@ApiTags("admin")
@Controller("admin/stock")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminStockController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Stock movements + low-stock alerts" })
  async list(@Query("productId") productId?: string) {
    const movements = await this.prisma.stockMovement.findMany({
      where: productId ? { productId } : undefined,
      include: { product: { select: { name: true, sku: true, stock: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const lowStock = await this.prisma.product.findMany({
      where: { isActive: true, stock: { lte: 10 } },
      orderBy: { stock: "asc" },
      take: 50,
      include: { category: true },
    });
    return { movements, lowStock };
  }

  @Post()
  @ApiOperation({ summary: "Record a stock movement (IN / OUT / ADJUST)" })
  async move(
    @CurrentUser() admin: AuthUser | undefined,
    @Body() body: Record<string, any>,
  ) {
    try {
      const productId = body.productId as string;
      const type = String(body.type || "ADJUST").toUpperCase(); // IN OUT ADJUST
      const quantity = Number(body.quantity);
      if (!productId || !quantity || !["IN", "OUT", "ADJUST"].includes(type)) {
        throw new ApiError(
          400,
          "productId, type (IN/OUT/ADJUST), quantity required",
        );
      }

      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) throw new ApiError(404, "Product not found");

      let nextStock = product.stock;
      if (type === "IN") nextStock = product.stock + Math.abs(quantity);
      else if (type === "OUT")
        nextStock = Math.max(0, product.stock - Math.abs(quantity));
      else nextStock = Math.max(0, quantity);

      const [movement] = await this.prisma.$transaction([
        this.prisma.stockMovement.create({
          data: {
            productId,
            variantId: body.variantId || null,
            type,
            quantity:
              type === "ADJUST"
                ? nextStock - product.stock
                : Math.abs(quantity),
            note: body.note || null,
            createdBy: admin?.name,
          },
        }),
        this.prisma.product.update({
          where: { id: productId },
          data: { stock: nextStock },
        }),
      ]);

      if (body.variantId) {
        await this.prisma.productVariant.update({
          where: { id: body.variantId },
          data: {
            stock:
              type === "ADJUST"
                ? nextStock
                : type === "IN"
                  ? { increment: Math.abs(quantity) }
                  : { decrement: Math.abs(quantity) },
          },
        });
      }

      // Fire back-in-stock alerts when stock becomes available
      let notified = 0;
      if (product.stock <= 0 && nextStock > 0) {
        const res = await this.prisma.productNotify.updateMany({
          where: {
            productId,
            type: "STOCK",
            status: "ACTIVE",
          },
          data: { status: "READY", notifiedAt: new Date() },
        });
        notified = res.count;
      }

      return { movement, stock: nextStock, stockAlertsReady: notified };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Stock update failed");
    }
  }
}
