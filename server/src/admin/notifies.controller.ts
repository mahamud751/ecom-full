import { Body, Controller, Get, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError } from "../common/utils";
import { pageParams, pagination } from "../common/pagination";

@ApiTags("admin")
@Controller("admin/notifies")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminNotifiesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List product alerts with counts" })
  async list(
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    const p = pageParams({ page, perPage }, { perPage: 200 });
    const where = status ? { status: status as never } : undefined;
    const notifies = await this.prisma.productNotify.findMany({
      where,
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
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: p.skip,
      take: p.take,
    });

    const [total, active, ready, sent] = await Promise.all([
      this.prisma.productNotify.count({ where }),
      this.prisma.productNotify.count({ where: { status: "ACTIVE" } }),
      this.prisma.productNotify.count({ where: { status: "READY" } }),
      this.prisma.productNotify.count({ where: { status: "SENT" } }),
    ]);

    return {
      notifies,
      counts: { active, ready, sent },
      pagination: pagination(p, total),
    };
  }

  @Patch()
  @ApiOperation({ summary: "Update alert status" })
  async update(@Body() body: Record<string, any>) {
    try {
      if (!body.id) throw new ApiError(400, "id required");
      const notify = await this.prisma.productNotify.update({
        where: { id: body.id },
        data: {
          ...(body.status ? { status: body.status } : {}),
          ...(body.status === "SENT" || body.status === "READY"
            ? { notifiedAt: new Date() }
            : {}),
        },
        include: { product: true },
      });
      return { notify };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Update failed");
    }
  }
}
