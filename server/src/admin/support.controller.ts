import { Body, Controller, Get, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError } from "../common/utils";

@ApiTags("admin")
@Controller("admin/support")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminSupportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List support tickets" })
  async list(@Query("status") status?: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const open = await this.prisma.supportTicket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    });
    return { tickets, open };
  }

  @Patch()
  @ApiOperation({ summary: "Update ticket status / note / priority" })
  async update(@Body() body: Record<string, any>) {
    try {
      if (!body.id) throw new ApiError(400, "id required");
      const ticket = await this.prisma.supportTicket.update({
        where: { id: body.id },
        data: {
          ...(body.status ? { status: body.status } : {}),
          ...(body.adminNote !== undefined
            ? { adminNote: body.adminNote }
            : {}),
          ...(body.priority ? { priority: body.priority } : {}),
        },
      });
      return { ticket };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Update failed");
    }
  }
}
