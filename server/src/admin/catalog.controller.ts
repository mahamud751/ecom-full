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
import { ApiError, slugify } from "../common/utils";

/** Unified catalog CRUD for brands & categories via ?type=brand|category */
@ApiTags("admin")
@Controller("admin/catalog")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminCatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List brands / categories / vendors" })
  async list(@Query("type") type?: string) {
    const t = type || "all";

    if (t === "brand") {
      const brands = await this.prisma.brand.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      });
      return { brands };
    }
    if (t === "category") {
      const categories = await this.prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { sortOrder: "asc" },
      });
      return { categories };
    }

    const [brands, categories, vendors] = await Promise.all([
      this.prisma.brand.findMany({ orderBy: { name: "asc" } }),
      this.prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
      this.prisma.vendor.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return { brands, categories, vendors };
  }

  @Post()
  @ApiOperation({ summary: "Create brand or category" })
  async create(@Body() body: Record<string, any>) {
    try {
      const type = body.type as string;
      const name = String(body.name || "").trim();
      if (!name || !type) throw new ApiError(400, "type and name required");

      if (type === "brand") {
        let slug = slugify(body.slug || name);
        const exists = await this.prisma.brand.findUnique({ where: { slug } });
        if (exists) slug = `${slug}-${Date.now().toString(36)}`;
        const brand = await this.prisma.brand.create({
          data: {
            name,
            slug,
            logo: body.logo || body.image || null,
            isActive: body.isActive !== false,
          },
        });
        return { brand };
      }

      if (type === "category") {
        let slug = slugify(body.slug || name);
        const exists = await this.prisma.category.findUnique({
          where: { slug },
        });
        if (exists) slug = `${slug}-${Date.now().toString(36)}`;
        const category = await this.prisma.category.create({
          data: {
            name,
            slug,
            description: body.description || null,
            image: body.image || body.logo || null,
            color: body.color || "#E6F9F1",
            sortOrder: Number(body.sortOrder ?? 0),
            isActive: body.isActive !== false,
            parentId: body.parentId || null,
          },
        });
        return { category };
      }

      throw new ApiError(400, "Unknown type");
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Create failed");
    }
  }

  @Patch()
  @ApiOperation({ summary: "Update brand or category" })
  async update(@Body() body: Record<string, any>) {
    try {
      const { type, id } = body;
      if (!type || !id) throw new ApiError(400, "type and id required");

      if (type === "brand") {
        const brand = await this.prisma.brand.update({
          where: { id },
          data: {
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.logo !== undefined ? { logo: body.logo } : {}),
            ...(body.isActive !== undefined
              ? { isActive: Boolean(body.isActive) }
              : {}),
          },
        });
        return { brand };
      }
      if (type === "category") {
        const category = await this.prisma.category.update({
          where: { id },
          data: {
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.description !== undefined
              ? { description: body.description }
              : {}),
            ...(body.image !== undefined ? { image: body.image } : {}),
            ...(body.color !== undefined ? { color: body.color } : {}),
            ...(body.sortOrder !== undefined
              ? { sortOrder: Number(body.sortOrder) }
              : {}),
            ...(body.isActive !== undefined
              ? { isActive: Boolean(body.isActive) }
              : {}),
          },
        });
        return { category };
      }
      throw new ApiError(400, "Unknown type");
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Update failed");
    }
  }

  @Delete()
  @ApiOperation({ summary: "Soft-deactivate brand or category" })
  async remove(@Query("type") type: string, @Query("id") id: string) {
    if (!type || !id) throw new ApiError(400, "type and id required");
    if (type === "brand") {
      await this.prisma.brand.update({
        where: { id },
        data: { isActive: false },
      });
    } else if (type === "category") {
      await this.prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
    } else throw new ApiError(400, "Unknown type");
    return { success: true };
  }
}
