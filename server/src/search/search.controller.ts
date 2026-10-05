import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { promises as fs } from "fs";
import path from "path";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError } from "../common/utils";
import { SmartSearchService } from "./smart-search.service";
import { VisualMatchService } from "./visual-match.service";
import {
  IMAGE_CATEGORY_HINTS,
  buildImageSearchQuery,
  labelsFromProductNames,
} from "./image-search";

type SearchMeta = {
  imageUrl: string;
  productIds: string[];
  scores: Record<string, number>;
  query: string;
  labels: string[];
  weak: boolean;
  matchType: "visual" | "text" | "mixed";
  tip: string;
};

async function writeImageSearchMeta(meta: SearchMeta) {
  const rel = meta.imageUrl
    .replace(/^\//, "")
    .replace(/\.[a-z0-9]+$/i, ".json");
  const file = path.join(process.cwd(), rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(meta));
}

@ApiTags("search")
@Controller("search")
export class SearchController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smartSearch: SmartSearchService,
    private readonly visual: VisualMatchService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Smart search across products, doctors and lab" })
  async search(
    @Query("q") q = "",
    @Query("hub") hubRaw = "all",
    @Query("limit") limitRaw = "40",
    @Query("fallback") fallbackRaw = "1",
  ) {
    try {
      const hub = (
        ["all", "store", "lab", "doctor"].includes(hubRaw) ? hubRaw : "all"
      ) as "all" | "store" | "lab" | "doctor";
      const limit = Math.min(60, Number(limitRaw || 40));

      const result = await this.smartSearch.smartSearch(q, {
        hub,
        limit,
        fallbackPopular: fallbackRaw !== "0",
      });

      const grouped = {
        products: result.hits.filter((h) => h.type === "product"),
        doctors: result.hits.filter((h) => h.type === "doctor"),
        labs: result.hits.filter(
          (h) => h.type === "lab_test" || h.type === "lab_package",
        ),
      };

      return {
        query: result.query,
        total: result.hits.length,
        hits: result.hits,
        grouped,
        suggestions: result.suggestions,
      };
    } catch (e) {
      console.error("Search error:", e);
      throw new ApiError(500, "Search failed");
    }
  }

  @Get("suggest")
  @ApiOperation({ summary: "Typeahead suggestions (products/doctors/lab)" })
  async suggest(@Query("q") qRaw = "") {
    const q = qRaw.trim();
    if (q.length < 1) return { suggestions: [] };

    try {
      const [products, doctors, tests, packages] = await Promise.all([
        this.smartSearch.suggestProducts(q),
        this.prisma.doctor.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { specialty: { contains: q, mode: "insensitive" } },
            ],
          },
          select: {
            name: true,
            slug: true,
            specialty: true,
            image: true,
            fee: true,
          },
          take: 4,
        }),
        this.prisma.labTest.findMany({
          where: {
            isActive: true,
            name: { contains: q, mode: "insensitive" },
          },
          select: { name: true, slug: true, price: true, image: true },
          take: 3,
        }),
        this.prisma.labPackage.findMany({
          where: {
            isActive: true,
            name: { contains: q, mode: "insensitive" },
          },
          select: { name: true, slug: true, price: true, image: true },
          take: 2,
        }),
      ]);

      const suggestions = [
        ...products.map((p) => ({
          type: "product" as const,
          label: p.name,
          href: `/products/${p.slug}`,
          image: p.image,
          meta: `৳${p.price}`,
        })),
        ...doctors.map((d) => ({
          type: "doctor" as const,
          label: d.name,
          href: `/doctors/${d.slug}`,
          image: d.image,
          meta: d.specialty,
        })),
        ...tests.map((t) => ({
          type: "lab" as const,
          label: t.name,
          href: `/lab-test/${t.slug}`,
          image: t.image,
          meta: `Test · ৳${t.price}`,
        })),
        ...packages.map((p) => ({
          type: "lab" as const,
          label: p.name,
          href: `/lab-test/package/${p.slug}`,
          image: p.image,
          meta: `Package · ৳${p.price}`,
        })),
      ];

      return { suggestions, q };
    } catch (e) {
      console.error(e);
      return { suggestions: [] };
    }
  }

  @Post("image")
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 8 * 1024 * 1024 } }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        hint: { type: "string" },
        hub: { type: "string", enum: ["all", "store", "lab", "doctor"] },
      },
    },
  })
  @ApiOperation({
    summary: "Image search against the catalog (perceptual hash match)",
  })
  async imageSearch(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body?: { hint?: string; hub?: string },
  ) {
    try {
      if (!file) {
        throw new BadRequestException(
          "Image file required. Use the camera icon to upload.",
        );
      }
      const hint = String(body?.hint || "").trim();
      const hubRaw = String(body?.hub || "all");
      const hub = (
        ["all", "store", "lab", "doctor"].includes(hubRaw) ? hubRaw : "all"
      ) as "all" | "store" | "lab" | "doctor";

      if (file.size < 200) {
        throw new BadRequestException(
          "That file is empty or a placeholder. Please upload a real product photo.",
        );
      }
      if (file.size > 8 * 1024 * 1024) {
        throw new BadRequestException("Image must be under 8MB.");
      }

      let jpeg: Buffer;
      try {
        ({ jpeg } = await this.visual.normalizeSearchImage(file.buffer));
      } catch (e) {
        throw new BadRequestException(
          e instanceof Error
            ? e.message
            : "Could not read this image. Upload a JPG, PNG, WebP or AVIF product photo.",
        );
      }

      const filename = `search-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
      const dir = path.join(process.cwd(), "uploads", "search");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, filename), jpeg);
      const imageUrl = `/uploads/search/${filename}`;

      const visualHits = await this.visual.matchProductsByImage(jpeg, {
        limit: 24,
      });

      const [brands, categories, catalogHints] = await Promise.all([
        this.prisma.brand.findMany({
          where: { isActive: true },
          select: { name: true },
          take: 80,
        }),
        this.prisma.category.findMany({
          where: { isActive: true },
          select: { name: true },
          take: 50,
        }),
        this.prisma.product.findMany({
          where: { isActive: true },
          select: { name: true, tags: true },
          take: 200,
        }),
      ]);

      const built = buildImageSearchQuery({
        filename: file.originalname,
        hint,
        brands: brands.map((b) => b.name),
        categories: categories.map((c) => c.name),
        productHints: catalogHints.map((p) => ({
          name: p.name,
          tags: p.tags || [],
        })),
      });

      // Text is only a booster / fallback when visual match is empty
      let textHits: { id: string; score: number }[] = [];
      if (built.query && (visualHits.length === 0 || hint)) {
        const searched = await this.smartSearch.smartSearch(built.query, {
          hub,
          limit: 24,
          fallbackPopular: false,
        });
        textHits = searched.hits
          .filter((h) => h.type === "product")
          .map((h) => ({ id: h.id, score: h.score }));
      }

      const textBoost = new Map(textHits.map((h) => [h.id, h.score]));

      let productIds = visualHits.map((v) => v.productId);

      if (visualHits.length === 0 && textHits.length > 0) {
        productIds = textHits.map((h) => h.id);
      } else if (visualHits.length > 0 && hint && textHits.length > 0) {
        // Keep visual order, but drop items that clearly contradict a typed hint
        // and prepend strong text+visual overlaps
        const overlap = productIds.filter((id) => textBoost.has(id));
        const rest = productIds.filter((id) => !textBoost.has(id));
        productIds = [...overlap, ...rest];
      }

      const products =
        productIds.length > 0
          ? await this.prisma.product.findMany({
              where: { id: { in: productIds }, isActive: true },
              include: { brand: true, category: true },
            })
          : [];
      const order = new Map(productIds.map((id, i) => [id, i]));
      products.sort(
        (a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99),
      );

      const visualById = new Map(visualHits.map((v) => [v.productId, v]));
      const hits = products.map((p) => {
        const v = visualById.get(p.id);
        const score = v ? Math.round(v.score * 100) : textBoost.get(p.id) || 1;
        return {
          type: "product" as const,
          id: p.id,
          slug: p.slug,
          title: p.name,
          subtitle: [p.brand?.name, p.category?.name]
            .filter(Boolean)
            .join(" · "),
          image: p.image,
          price: p.price,
          href: `/products/${p.slug}`,
          score,
          badges: [
            ...(v?.exact ? ["Exact photo"] : v ? ["Looks like"] : ["Keyword"]),
            ...(p.stock <= 0 ? ["Out of stock"] : []),
          ],
        };
      });

      const labels = labelsFromProductNames(products.map((p) => p.name));
      if (built.matched.length) {
        for (const t of built.matched.slice(0, 4)) {
          if (!labels.includes(t.toLowerCase())) labels.push(t);
        }
      }

      const matchType =
        visualHits.length > 0 && textHits.length > 0 && hint
          ? "mixed"
          : visualHits.length > 0
            ? "visual"
            : textHits.length > 0
              ? "text"
              : "visual";

      const derivedQuery =
        products[0]?.name || labels.slice(0, 3).join(" ") || hint || "";

      const weak = hits.length === 0;
      const tip = weak
        ? "No catalog photo matches this image. Try a clearer product shot, or type the product name and search again."
        : visualHits.some((v) => v.exact)
          ? `Exact catalog photo match · ${hits.length} product${hits.length === 1 ? "" : "s"}`
          : visualHits.length > 0
            ? `Visually similar products · ${hits.length} match${hits.length === 1 ? "" : "es"}`
            : `Matched from image name / keyword · ${hits.length} result${hits.length === 1 ? "" : "s"}`;

      await writeImageSearchMeta({
        imageUrl,
        productIds: hits.map((h) => h.id),
        scores: Object.fromEntries(
          visualHits.map((v) => [v.productId, Number(v.score.toFixed(3))]),
        ),
        query: derivedQuery,
        labels,
        weak,
        matchType,
        tip,
      });

      return {
        success: true,
        imageUrl,
        derivedQuery,
        productIds: hits.map((h) => h.id),
        matchedTokens: labels,
        weakMatch: weak,
        total: hits.length,
        hits,
        grouped: {
          products: hits,
          doctors: [],
          labs: [],
        },
        suggestions: labels.slice(0, 8),
        categoryHints: IMAGE_CATEGORY_HINTS,
        mode: "image",
        matchType,
        tip,
      };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      console.error("Image search error:", e);
      throw new ApiError(
        500,
        e instanceof Error
          ? `Image search failed: ${e.message}`
          : "Image search failed",
      );
    }
  }
}
