import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError, slugify } from "../common/utils";
import { pageParams, pagination } from "../common/pagination";

@ApiTags("admin")
@Controller("admin/products")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminProductsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List products (search / category / low stock)" })
  async list(
    @Query("q") q?: string,
    @Query("categoryId") categoryId?: string,
    @Query("lowStock") lowStockFlag?: string,
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    const lowStock = lowStockFlag === "1";
    const p = pageParams({ page, perPage }, { perPage: 200 });
    const where: Prisma.ProductWhereInput = {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(lowStock ? { stock: { lte: 10 } } : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          vendor: true,
          variants: { orderBy: { createdAt: "asc" } },
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: p.skip,
        take: p.take,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, pagination: pagination(p, total) };
  }

  @Post()
  @ApiOperation({ summary: "Create a product" })
  async create(@Body() body: Record<string, any>) {
    try {
      const name = String(body.name || "").trim();
      if (!name || !body.categoryId) {
        throw new ApiError(400, "Name and category required");
      }

      let slug = slugify(body.slug || name);
      const exists = await this.prisma.product.findUnique({
        where: { slug },
      });
      if (exists) slug = `${slug}-${Date.now().toString(36)}`;

      const product = await this.prisma.product.create({
        data: {
          name,
          slug,
          description: body.description || name,
          shortDesc: body.shortDesc || null,
          image:
            body.image ||
            "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80",
          images: body.images || [],
          price: Number(body.price) || 0,
          comparePrice: body.comparePrice ? Number(body.comparePrice) : null,
          stock: Number(body.stock ?? 0),
          sku: body.sku || null,
          unit: body.unit || "pcs",
          isFeatured: Boolean(body.isFeatured),
          isFlashSale: Boolean(body.isFlashSale),
          expressDelivery: body.expressDelivery !== false,
          isActive: body.isActive !== false,
          isMedicine: Boolean(body.isMedicine),
          requiresRx: Boolean(body.requiresRx),
          tags: body.tags || [],
          section: body.section || null,
          categoryId: body.categoryId,
          brandId: body.brandId || null,
          vendorId: body.vendorId || null,
        },
        include: { category: true, brand: true, variants: true },
      });

      return { product };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Create product failed");
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Product detail with variants and movements" })
  async one(@Param("id") id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        vendor: true,
        variants: true,
        stockMovements: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!product) throw new ApiError(404, "Not found");
    return { product };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a product" })
  async update(@Param("id") id: string, @Body() body: Record<string, any>) {
    try {
      const data: Record<string, unknown> = {};
      const fields = [
        "name",
        "description",
        "shortDesc",
        "image",
        "sku",
        "unit",
        "section",
        "categoryId",
        "brandId",
        "vendorId",
      ] as const;
      for (const f of fields) {
        if (body[f] !== undefined) data[f] = body[f] === "" ? null : body[f];
      }
      if (body.slug) data.slug = slugify(body.slug);
      if (body.price !== undefined) data.price = Number(body.price);
      if (body.comparePrice !== undefined)
        data.comparePrice = body.comparePrice
          ? Number(body.comparePrice)
          : null;
      if (body.stock !== undefined) data.stock = Number(body.stock);
      if (body.images) data.images = body.images;
      if (body.tags) data.tags = body.tags;
      for (const b of [
        "isFeatured",
        "isFlashSale",
        "expressDelivery",
        "isActive",
        "isMedicine",
        "requiresRx",
      ] as const) {
        if (body[b] !== undefined) data[b] = Boolean(body[b]);
      }

      const product = await this.prisma.product.update({
        where: { id },
        data,
        include: { category: true, brand: true, variants: true },
      });
      return { product };
    } catch (e) {
      console.error(e);
      throw new ApiError(500, "Update failed");
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete a product" })
  async remove(@Param("id") id: string) {
    try {
      await this.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return { success: true };
    } catch {
      throw new ApiError(500, "Delete failed");
    }
  }
}
