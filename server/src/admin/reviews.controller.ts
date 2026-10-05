import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { ApiError } from "../common/utils";
import { pageParams, pagination } from "../common/pagination";

@ApiTags("admin")
@Controller("admin/reviews")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN")
export class AdminReviewsController {
  constructor(private readonly prisma: PrismaService) {}

  /** Recompute product.rating + reviewCount from APPROVED reviews only */
  private async recomputeProductRating(productId: string) {
    const agg = await this.prisma.productReview.aggregate({
      where: { productId, status: "APPROVED" },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const count = agg._count._all;
    const rating =
      count > 0 && agg._avg.rating != null
        ? Math.round(agg._avg.rating * 10) / 10
        : 4.5;

    await this.prisma.product.update({
      where: { id: productId },
      data: { rating, reviewCount: count },
    });

    return { rating, reviewCount: count };
  }

  @Get()
  @ApiOperation({ summary: "List reviews with moderation counts" })
  async list(
    @Query("status") status?: string,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    const p = pageParams({ page, perPage }, { perPage: 200 });
    const where: Prisma.ProductReviewWhereInput = {
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { authorName: { contains: q, mode: "insensitive" } },
              { body: { contains: q, mode: "insensitive" } },
              { product: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const reviews = await this.prisma.productReview.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            rating: true,
            reviewCount: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "desc" }],
      skip: p.skip,
      take: p.take,
    });

    const [matching, pending, approved, rejected] = await Promise.all([
      this.prisma.productReview.count({ where }),
      this.prisma.productReview.count({ where: { status: "PENDING" } }),
      this.prisma.productReview.count({ where: { status: "APPROVED" } }),
      this.prisma.productReview.count({ where: { status: "REJECTED" } }),
    ]);

    return {
      reviews,
      counts: {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected,
      },
      pagination: pagination(p, matching),
    };
  }

  @Patch()
  @ApiOperation({ summary: "Approve / reject / annotate a review" })
  async update(@Body() body: Record<string, any>) {
    try {
      const id = body.id as string;
      if (!id) throw new ApiError(400, "id required");

      const existing = await this.prisma.productReview.findUnique({
        where: { id },
      });
      if (!existing) throw new ApiError(404, "Review not found");

      const status = body.status as string | undefined;
      if (status && !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
        throw new ApiError(400, "Invalid status");
      }

      const review = await this.prisma.productReview.update({
        where: { id },
        data: {
          ...(status ? { status, reviewedAt: new Date() } : {}),
          ...(body.adminNote !== undefined
            ? { adminNote: body.adminNote }
            : {}),
          ...(body.isVerified !== undefined
            ? { isVerified: Boolean(body.isVerified) }
            : {}),
        },
        include: {
          product: {
            select: { id: true, name: true, slug: true, image: true },
          },
        },
      });

      // Always recompute when status changes to/from APPROVED
      if (status && status !== existing.status) {
        await this.recomputeProductRating(existing.productId);
      }

      return { review, success: true };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Update failed");
    }
  }

  @Delete()
  @ApiOperation({ summary: "Delete a review and recompute rating" })
  async remove(@Query("id") id: string) {
    if (!id) throw new ApiError(400, "id required");

    const existing = await this.prisma.productReview.findUnique({
      where: { id },
    });
    if (!existing) throw new ApiError(404, "Not found");

    await this.prisma.productReview.delete({ where: { id } });
    await this.recomputeProductRating(existing.productId);
    return { success: true };
  }
}
