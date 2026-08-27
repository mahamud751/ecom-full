import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError, makeRefNumber } from "../common/utils";

@ApiTags("lab")
@Controller("lab")
export class LabController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "All active lab tests + packages" })
  async list() {
    try {
      const [tests, packages] = await Promise.all([
        this.prisma.labTest.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        }),
        this.prisma.labPackage.findMany({
          where: { isActive: true },
          include: { items: { include: { test: true } } },
          orderBy: { sortOrder: "asc" },
        }),
      ]);
      return { tests, packages };
    } catch (e) {
      console.error(e);
      throw new ApiError(500, "Failed");
    }
  }

  @Post()
  @ApiOperation({
    summary: "Book a lab test or package (home sample collection)",
  })
  async book(
    @Body()
    body: {
      customerName?: string;
      customerPhone?: string;
      address?: string;
      city?: string;
      labTestId?: string;
      labPackageId?: string;
      scheduledAt?: string;
      notes?: string;
    },
  ) {
    try {
      const customerName = String(body?.customerName || "").trim();
      const customerPhone = String(body?.customerPhone || "").trim();
      if (!customerName || !customerPhone) {
        throw new ApiError(400, "Name and phone required");
      }

      let total = 0;
      let labTestId: string | null = null;
      let labPackageId: string | null = null;

      if (body?.labTestId) {
        const test = await this.prisma.labTest.findUnique({
          where: { id: body.labTestId },
        });
        if (!test) {
          throw new ApiError(404, "Test not found");
        }
        total = test.price;
        labTestId = test.id;
        await this.prisma.labTest.update({
          where: { id: test.id },
          data: { bookedCount: { increment: 1 } },
        });
      } else if (body?.labPackageId) {
        const pkg = await this.prisma.labPackage.findUnique({
          where: { id: body.labPackageId },
        });
        if (!pkg) {
          throw new ApiError(404, "Package not found");
        }
        total = pkg.price;
        labPackageId = pkg.id;
      } else {
        throw new ApiError(400, "Select a test or package");
      }

      const bookingNumber = makeRefNumber("LAB");

      const booking = await this.prisma.labBooking.create({
        data: {
          bookingNumber,
          customerName,
          customerPhone,
          address: body?.address || null,
          city: body?.city || "Dhaka",
          total,
          labTestId,
          labPackageId,
          scheduledAt: body?.scheduledAt ? new Date(body.scheduledAt) : null,
          notes: body?.notes || null,
          status: "CONFIRMED",
        },
      });

      return { success: true, booking };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Booking failed");
    }
  }
}
