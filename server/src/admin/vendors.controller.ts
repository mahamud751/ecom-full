import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError, slugify } from "../common/utils";

@ApiTags("admin")
@Controller("admin/vendors")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminVendorsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List vendors" })
  async list() {
    const vendors = await this.prisma.vendor.findMany({
      include: {
        _count: { select: { products: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { vendors };
  }

  @Post()
  @ApiOperation({ summary: "Create a vendor" })
  async create(@Body() body: Record<string, any>) {
    try {
      const name = String(body.name || "").trim();
      const phone = String(body.phone || "").trim();
      if (!name || !phone) throw new ApiError(400, "Name and phone required");
      let slug = slugify(body.slug || name);
      if (await this.prisma.vendor.findUnique({ where: { slug } })) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
      const vendor = await this.prisma.vendor.create({
        data: {
          name,
          slug,
          phone,
          email: body.email || null,
          address: body.address || null,
          city: body.city || "Dhaka",
          tradeLicense: body.tradeLicense || null,
          commissionRate: Number(body.commissionRate ?? 10),
          status: body.status || "PENDING",
          notes: body.notes || null,
        },
      });
      return { vendor };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Create vendor failed");
    }
  }

  @Patch()
  @ApiOperation({ summary: "Update a vendor" })
  async update(@Body() body: Record<string, any>) {
    try {
      if (!body.id) throw new ApiError(400, "id required");
      const vendor = await this.prisma.vendor.update({
        where: { id: body.id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.phone !== undefined ? { phone: body.phone } : {}),
          ...(body.email !== undefined ? { email: body.email } : {}),
          ...(body.address !== undefined ? { address: body.address } : {}),
          ...(body.city !== undefined ? { city: body.city } : {}),
          ...(body.tradeLicense !== undefined
            ? { tradeLicense: body.tradeLicense }
            : {}),
          ...(body.commissionRate !== undefined
            ? { commissionRate: Number(body.commissionRate) }
            : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.isActive !== undefined
            ? { isActive: Boolean(body.isActive) }
            : {}),
          ...(body.notes !== undefined ? { notes: body.notes } : {}),
        },
      });
      return { vendor };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Update vendor failed");
    }
  }
}
