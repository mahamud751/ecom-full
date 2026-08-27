import {
  Body,
  Controller,
  Delete,
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
@Controller("admin/variants")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminVariantsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: "Create a product variant" })
  async create(@Body() body: Record<string, any>) {
    try {
      if (!body.productId || !body.name) {
        throw new ApiError(400, "productId and name required");
      }
      if (body.isDefault) {
        await this.prisma.productVariant.updateMany({
          where: { productId: body.productId },
          data: { isDefault: false },
        });
      }
      const variant = await this.prisma.productVariant.create({
        data: {
          productId: body.productId,
          name: String(body.name).trim(),
          sku: body.sku || null,
          price: Number(body.price) || 0,
          comparePrice: body.comparePrice ? Number(body.comparePrice) : null,
          stock: Number(body.stock ?? 0),
          isDefault: Boolean(body.isDefault),
          isActive: body.isActive !== false,
          attributes: body.attributes ? JSON.stringify(body.attributes) : null,
        },
      });

      // Sync product price/stock from default variant if set
      if (variant.isDefault) {
        await this.prisma.product.update({
          where: { id: body.productId },
          data: { price: variant.price, stock: variant.stock },
        });
      }

      return { variant };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Create variant failed");
    }
  }

  @Patch()
  @ApiOperation({ summary: "Update a product variant" })
  async update(@Body() body: Record<string, any>) {
    try {
      if (!body.id) throw new ApiError(400, "id required");
      if (body.isDefault) {
        const existing = await this.prisma.productVariant.findUnique({
          where: { id: body.id },
        });
        if (existing) {
          await this.prisma.productVariant.updateMany({
            where: { productId: existing.productId },
            data: { isDefault: false },
          });
        }
      }
      const variant = await this.prisma.productVariant.update({
        where: { id: body.id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.sku !== undefined ? { sku: body.sku } : {}),
          ...(body.price !== undefined ? { price: Number(body.price) } : {}),
          ...(body.comparePrice !== undefined
            ? {
                comparePrice: body.comparePrice
                  ? Number(body.comparePrice)
                  : null,
              }
            : {}),
          ...(body.stock !== undefined ? { stock: Number(body.stock) } : {}),
          ...(body.isDefault !== undefined
            ? { isDefault: Boolean(body.isDefault) }
            : {}),
          ...(body.isActive !== undefined
            ? { isActive: Boolean(body.isActive) }
            : {}),
        },
      });
      return { variant };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Update variant failed");
    }
  }

  @Delete()
  @ApiOperation({ summary: "Delete a product variant" })
  async remove(@Query("id") id: string) {
    if (!id) throw new ApiError(400, "id required");
    await this.prisma.productVariant.delete({ where: { id } });
    return { success: true };
  }
}
