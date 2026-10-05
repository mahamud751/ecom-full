import {
  Body,
  Controller,
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
import { pageParams, pagination } from "../common/pagination";

@ApiTags("admin")
@Controller("admin/lab")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminLabController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Lab tests / packages / bookings" })
  async list(
    @Query("kind") kindRaw?: string,
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    const kind = kindRaw || "all";

    if (kind === "tests") {
      const tests = await this.prisma.labTest.findMany({
        orderBy: { sortOrder: "asc" },
      });
      return { tests };
    }
    if (kind === "packages") {
      const packages = await this.prisma.labPackage.findMany({
        include: {
          items: { include: { test: true } },
        },
        orderBy: { sortOrder: "asc" },
      });
      return { packages };
    }
    if (kind === "bookings") {
      const p = pageParams({ page, perPage }, { perPage: 100 });
      const [bookings, total] = await Promise.all([
        this.prisma.labBooking.findMany({
          include: { labTest: true, labPackage: true },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: p.skip,
          take: p.take,
        }),
        this.prisma.labBooking.count(),
      ]);
      return { bookings, pagination: pagination(p, total) };
    }

    const [tests, packages, bookings] = await Promise.all([
      this.prisma.labTest.findMany({ orderBy: { sortOrder: "asc" } }),
      this.prisma.labPackage.findMany({
        include: { items: { include: { test: true } } },
        orderBy: { sortOrder: "asc" },
      }),
      this.prisma.labBooking.findMany({
        include: { labTest: true, labPackage: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);
    return { tests, packages, bookings };
  }

  @Post()
  @ApiOperation({ summary: "Create a lab test or package" })
  async create(@Body() body: Record<string, any>) {
    try {
      const kind = body.kind as string;

      if (kind === "test") {
        const name = String(body.name || "").trim();
        if (!name) throw new ApiError(400, "name required");
        let slug = slugify(body.slug || name);
        if (await this.prisma.labTest.findUnique({ where: { slug } })) {
          slug = `${slug}-${Date.now().toString(36)}`;
        }
        const test = await this.prisma.labTest.create({
          data: {
            name,
            slug,
            description: body.description || null,
            image: body.image || null,
            price: Number(body.price) || 0,
            comparePrice: body.comparePrice ? Number(body.comparePrice) : null,
            reportHours: Number(body.reportHours ?? 24),
            includes: Number(body.includes ?? 1),
            category: body.category || null,
            sortOrder: Number(body.sortOrder ?? 0),
            isActive: body.isActive !== false,
          },
        });
        return { test };
      }

      if (kind === "package") {
        const name = String(body.name || "").trim();
        if (!name) throw new ApiError(400, "name required");
        let slug = slugify(body.slug || name);
        if (await this.prisma.labPackage.findUnique({ where: { slug } })) {
          slug = `${slug}-${Date.now().toString(36)}`;
        }
        const testIds: string[] = body.testIds || [];
        const pkg = await this.prisma.labPackage.create({
          data: {
            name,
            slug,
            description: body.description || null,
            image: body.image || null,
            price: Number(body.price) || 0,
            comparePrice: body.comparePrice ? Number(body.comparePrice) : null,
            reportHours: Number(body.reportHours ?? 24),
            sortOrder: Number(body.sortOrder ?? 0),
            isActive: body.isActive !== false,
            items: {
              create: testIds.map((testId) => ({ testId })),
            },
          },
          include: { items: { include: { test: true } } },
        });
        return { package: pkg };
      }

      throw new ApiError(400, "Unknown kind");
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Create lab item failed");
    }
  }

  @Patch()
  @ApiOperation({ summary: "Update lab test / package / booking" })
  async update(@Body() body: Record<string, any>) {
    try {
      const kind = body.kind as string;
      if (!body.id) throw new ApiError(400, "id required");

      if (kind === "test") {
        const test = await this.prisma.labTest.update({
          where: { id: body.id },
          data: {
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.description !== undefined
              ? { description: body.description }
              : {}),
            ...(body.image !== undefined ? { image: body.image } : {}),
            ...(body.price !== undefined ? { price: Number(body.price) } : {}),
            ...(body.comparePrice !== undefined
              ? {
                  comparePrice: body.comparePrice
                    ? Number(body.comparePrice)
                    : null,
                }
              : {}),
            ...(body.reportHours !== undefined
              ? { reportHours: Number(body.reportHours) }
              : {}),
            ...(body.category !== undefined ? { category: body.category } : {}),
            ...(body.isActive !== undefined
              ? { isActive: Boolean(body.isActive) }
              : {}),
          },
        });
        return { test };
      }

      if (kind === "package") {
        if (body.testIds) {
          await this.prisma.labPackageItem.deleteMany({
            where: { packageId: body.id },
          });
          await this.prisma.labPackageItem.createMany({
            data: (body.testIds as string[]).map((testId) => ({
              packageId: body.id,
              testId,
            })),
          });
        }
        const pkg = await this.prisma.labPackage.update({
          where: { id: body.id },
          data: {
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.price !== undefined ? { price: Number(body.price) } : {}),
            ...(body.comparePrice !== undefined
              ? {
                  comparePrice: body.comparePrice
                    ? Number(body.comparePrice)
                    : null,
                }
              : {}),
            ...(body.isActive !== undefined
              ? { isActive: Boolean(body.isActive) }
              : {}),
            ...(body.description !== undefined
              ? { description: body.description }
              : {}),
          },
          include: { items: { include: { test: true } } },
        });
        return { package: pkg };
      }

      if (kind === "booking") {
        const booking = await this.prisma.labBooking.update({
          where: { id: body.id },
          data: {
            ...(body.status !== undefined ? { status: body.status } : {}),
            ...(body.reportUrl !== undefined
              ? { reportUrl: body.reportUrl }
              : {}),
            ...(body.scheduledAt !== undefined
              ? {
                  scheduledAt: body.scheduledAt
                    ? new Date(body.scheduledAt)
                    : null,
                }
              : {}),
          },
          include: { labTest: true, labPackage: true },
        });
        return { booking };
      }

      throw new ApiError(400, "Unknown kind");
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Update failed");
    }
  }
}
