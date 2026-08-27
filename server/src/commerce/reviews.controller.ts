import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError } from "../common/utils";

@ApiTags("reviews")
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: "List APPROVED reviews (by productId/slug or site-wide)",
  })
  async list(
    @Query("productId") productId?: string,
    @Query("slug") slug?: string,
    @Query("limit") limitRaw?: string,
  ) {
    try {
      const limit = Math.min(50, Number(limitRaw || 20));

      let pid: string | null = productId || null;
      if (!pid && slug) {
        const p = await this.prisma.product.findUnique({
          where: { slug },
          select: { id: true },
        });
        pid = p?.id || null;
      }

      const reviews = await this.prisma.productReview.findMany({
        where: {
          status: "APPROVED",
          ...(pid ? { productId: pid } : {}),
        },
        include: {
          product: {
            select: { name: true, slug: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      const summary = pid
        ? await this.prisma.productReview.groupBy({
            by: ["rating"],
            where: { productId: pid, status: "APPROVED" },
            _count: { _all: true },
          })
        : [];

      return {
        reviews: reviews.map((r) => ({
          id: r.id,
          authorName: r.authorName,
          rating: r.rating,
          title: r.title,
          body: r.body,
          isVerified: r.isVerified,
          createdAt: r.createdAt,
          product: r.product,
        })),
        breakdown: summary.map((s) => ({
          rating: s.rating,
          count: s._count._all,
        })),
      };
    } catch (e) {
      console.error(e);
      throw new ApiError(500, "Failed to load reviews");
    }
  }

  @Post()
  @ApiOperation({ summary: "Submit a review → PENDING until admin approves" })
  async create(
    @Body()
    body: {
      productId?: string;
      authorName?: string;
      authorPhone?: string;
      authorEmail?: string;
      rating?: number;
      title?: string;
      body?: string;
      isVerified?: boolean;
    },
  ) {
    try {
      const productId = String(body?.productId || "").trim();
      const authorName = String(body?.authorName || "").trim();
      const authorPhone = String(body?.authorPhone || "").trim() || null;
      const authorEmail = String(body?.authorEmail || "").trim() || null;
      const rating = Math.min(
        5,
        Math.max(1, Math.round(Number(body?.rating) || 0)),
      );
      const title = String(body?.title || "").trim() || null;
      const text = String(body?.body || "").trim();

      if (!productId || !authorName || !text || rating < 1) {
        throw new ApiError(
          400,
          "Name, rating (1–5) and review text are required",
        );
      }
      if (text.length < 10) {
        throw new ApiError(400, "Review should be at least 10 characters");
      }
      if (text.length > 2000) {
        throw new ApiError(400, "Review is too long (max 2000 chars)");
      }

      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, isActive: true },
      });
      if (!product?.isActive) {
        throw new ApiError(404, "Product not found");
      }

      // Light spam guard: same phone+product pending
      if (authorPhone) {
        const dup = await this.prisma.productReview.findFirst({
          where: {
            productId,
            authorPhone,
            status: "PENDING",
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });
        if (dup) {
          throw new ApiError(
            409,
            "You already submitted a review for this product. Wait for admin approval.",
          );
        }
      }

      const review = await this.prisma.productReview.create({
        data: {
          productId,
          authorName,
          authorPhone,
          authorEmail,
          rating,
          title,
          body: text,
          status: "PENDING",
          isVerified: Boolean(body?.isVerified),
        },
      });

      return {
        success: true,
        id: review.id,
        message:
          "Thank you! Your review was submitted and will show after admin approval.",
      };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      console.error(e);
      throw new ApiError(500, "Failed to submit review");
    }
  }
}
