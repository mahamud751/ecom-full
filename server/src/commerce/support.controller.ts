import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError, makeRefNumber } from "../common/utils";

@ApiTags("support")
@Controller("support")
export class SupportController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: "Create a support ticket" })
  async create(
    @Body()
    body: {
      name?: string;
      phone?: string;
      email?: string;
      subject?: string;
      message?: string;
      orderNumber?: string;
      priority?: string;
    },
  ) {
    try {
      const name = String(body?.name || "").trim();
      const phone = String(body?.phone || "").trim();
      const subject = String(body?.subject || "").trim();
      const message = String(body?.message || "").trim();
      if (!name || !phone || !subject || !message) {
        throw new ApiError(400, "Name, phone, subject and message required");
      }
      const ticketNo = makeRefNumber("TKT");
      const ticket = await this.prisma.supportTicket.create({
        data: {
          ticketNo,
          name,
          phone,
          email: body?.email?.trim() || null,
          subject,
          message,
          orderNumber: body?.orderNumber?.trim() || null,
          priority: body?.priority || "NORMAL",
          status: "OPEN",
        },
      });
      return { success: true, ticket };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Failed to create ticket");
    }
  }

  @Get()
  @ApiOperation({ summary: "List tickets by phone or ticket number" })
  async list(
    @Query("phone") phone?: string,
    @Query("ticket") ticketNo?: string,
  ) {
    try {
      const p = phone?.trim();
      const t = ticketNo?.trim();
      if (!p && !t) {
        throw new ApiError(400, "phone or ticket required");
      }
      const tickets = await this.prisma.supportTicket.findMany({
        where: {
          ...(t ? { ticketNo: t } : {}),
          ...(p ? { phone: p } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      return { tickets };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Failed");
    }
  }
}
