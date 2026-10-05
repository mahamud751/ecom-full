import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DoctorsService } from "../doctors/doctors.service";
import { TtlCache } from "../common/ttl-cache";

/** Fields the web + app product cards render — keeps /home ~5x lighter. */
const CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  image: true,
  price: true,
  comparePrice: true,
  stock: true,
  unit: true,
  rating: true,
  reviewCount: true,
  expressDelivery: true,
  isMedicine: true,
  requiresRx: true,
  brand: { select: { name: true, slug: true } },
} as const;

/** Listing rows also show the category chip. */
const LIST_SELECT = {
  ...CARD_SELECT,
  category: { select: { name: true, slug: true } },
} as const;

/** Product URLs per sitemap file (search engines allow up to 50,000). */
const SITEMAP_PAGE = 45_000;

/** Deepest listing page served; past this OFFSET scans get expensive. */
const MAX_PAGE = 500;

export type ProductListQuery = {
  flash?: string;
  sort?: string;
  page?: string;
  category?: string;
  brand?: string;
  min?: string;
  max?: string;
  section?: string;
  perPage?: string;
  /**
   * "1" = infinite-scroll mode: products + hasMore only. Skips the exact
   * count (a full index scan on big categories) and the filter lists.
   */
  lite?: string;
};

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly doctors: DoctorsService,
  ) {}

  // /home is identical for every visitor; admin edits show up within a minute.
  private readonly homeCache = new TtlCache<unknown>(60_000, 1);
  // Exact counts over ~1M rows cost 100ms+, and only drive "page X of Y".
  private readonly countCache = new TtlCache<number>(5 * 60_000);
  // Filter chips + slug → id lookups (small tables, read on every listing).
  private readonly facetCache = new TtlCache<{
    categories: { id: string; name: string; slug: string }[];
    brands: { id: string; name: string; slug: string }[];
  }>(5 * 60_000, 1);

  // Crawlers re-fetch sitemaps often; slugs barely change within an hour.
  private readonly sitemapCache = new TtlCache<any>(60 * 60_000, 64);

  /** Home page payload, cached in memory (one DB round per minute). */
  getHomeData() {
    return this.homeCache.get("home", () => this.loadHomeData());
  }

  private facets() {
    return this.facetCache.get("all", async () => {
      const [categories, brands] = await Promise.all([
        this.prisma.category.findMany({
          select: { id: true, name: true, slug: true },
          orderBy: { sortOrder: "asc" },
        }),
        this.prisma.brand.findMany({
          select: { id: true, name: true, slug: true },
          orderBy: { name: "asc" },
        }),
      ]);
      return { categories, brands };
    });
  }

  /** Mirrors web/src/app/page.tsx getHomeData() */
  private async loadHomeData() {
    const [
      banners,
      categories,
      skinoDeals,
      himalaya,
      flashSale,
      featured,
      beautyPicks,
      foodPicks,
      allDoctors,
    ] = await Promise.all([
      this.prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      this.prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        take: 12,
      }),
      this.prisma.product.findMany({
        where: {
          section: "skino-deals",
          isActive: true,
          image: { startsWith: "/uploads/" },
        },
        select: CARD_SELECT,
        take: 10,
        orderBy: { reviewCount: "desc" },
      }),
      this.prisma.product.findMany({
        where: {
          section: "himalaya",
          isActive: true,
          image: { startsWith: "/uploads/" },
        },
        select: CARD_SELECT,
        take: 10,
        orderBy: { reviewCount: "desc" },
      }),
      this.prisma.product.findMany({
        where: {
          isFlashSale: true,
          isActive: true,
          image: { startsWith: "/uploads/" },
        },
        select: CARD_SELECT,
        take: 10,
        orderBy: { comparePrice: "desc" },
      }),
      this.prisma.product.findMany({
        where: {
          isFeatured: true,
          isActive: true,
          image: { startsWith: "/uploads/" },
        },
        select: CARD_SELECT,
        take: 10,
        orderBy: { rating: "desc" },
      }),
      this.prisma.product.findMany({
        where: { sku: { startsWith: "OBF-" }, isActive: true },
        select: CARD_SELECT,
        take: 10,
        orderBy: { reviewCount: "desc" },
      }),
      this.prisma.product.findMany({
        where: { sku: { startsWith: "OFF-" }, isActive: true },
        select: CARD_SELECT,
        take: 10,
        orderBy: { reviewCount: "desc" },
      }),
      this.doctors.listDoctors().catch(() => []),
    ]);

    return {
      banners,
      categories,
      skinoDeals,
      himalaya,
      flashSale,
      featured,
      beautyPicks,
      foodPicks,
      doctors: allDoctors.slice(0, 5).map((d) => ({
        id: d.id,
        slug: d.slug,
        name: d.name,
        specialty: d.specialty,
        image: d.image,
        experience: d.experience,
        fee: d.fee,
        rating: d.rating,
        patients: d.patients,
        availableNow: d.availableNow,
      })),
    };
  }

  /**
   * Sitemap payload — categories, doctors, lab pages, and the first page of
   * product slugs. Product URLs are split into SITEMAP_PAGE-sized files
   * (search engines cap a sitemap at 50k URLs); `productPages` says how many
   * there are and sitemapProducts(page) serves each. `products=0` omits the
   * inline product list.
   */
  sitemap(opts: { products?: string } = {}) {
    return this.sitemapCache.get(`index:${opts.products ?? ""}`, async () => {
      const [categories, doctors, labTests, labPackages, productTotal] =
        await Promise.all([
          this.prisma.category.findMany({
            select: { slug: true, updatedAt: true },
            orderBy: { sortOrder: "asc" },
          }),
          this.prisma.doctor
            .findMany({
              select: { slug: true, updatedAt: true },
              where: { isActive: true },
            })
            .catch(() => [] as { slug: string; updatedAt: Date }[]),
          this.prisma.labTest.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true },
          }),
          this.prisma.labPackage.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true },
          }),
          this.prisma.product.count({ where: { isActive: true } }),
        ]);
      const products =
        opts.products === "0" ? undefined : await this.sitemapProducts(1);
      return {
        categories,
        doctors,
        labTests,
        labPackages,
        productTotal,
        productPages: Math.ceil(productTotal / SITEMAP_PAGE),
        ...(products ? { products: products.products } : {}),
      };
    });
  }

  /** One sitemap file's worth of product slugs (1-based page). */
  sitemapProducts(pageRaw: number | string) {
    const page = Math.max(1, Math.floor(Number(pageRaw)) || 1);
    return this.sitemapCache.get(`products:${page}`, async () => ({
      page,
      products: await this.prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { id: "asc" },
        skip: (page - 1) * SITEMAP_PAGE,
        take: SITEMAP_PAGE,
      }),
    }));
  }

  async listCategories() {
    return this.prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async getCategoryBySlug(slug: string, params?: ProductListQuery) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });
    if (!category) throw new NotFoundException("Category not found");

    const listing = await this.listProducts({
      ...params,
      category: slug,
    });

    return {
      category,
      products: listing.products,
      total: listing.total,
      page: listing.page,
      perPage: listing.perPage,
      totalPages: listing.totalPages,
    };
  }

  async listBrands() {
    return this.prisma.brand.findMany({ orderBy: { name: "asc" } });
  }

  async listBanners() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  /** Store listing — mirrors src/app/store/page.tsx query logic */
  async listProducts(params: ProductListQuery) {
    const page = Math.min(MAX_PAGE, Math.max(1, Number(params.page) || 1));
    const perPage = Math.min(48, Math.max(1, Number(params.perPage) || 24));
    const facets = await this.facets();

    const where: Record<string, unknown> = { isActive: true };
    // The app's "Flash sale → See all" sends section=flashSale.
    if (params.flash === "1" || params.section === "flashSale") {
      where.isFlashSale = true;
    } else if (params.section) {
      where.section = params.section;
    }
    // Filter on the id columns (indexed together with each sort) rather than
    // a relation join; an unknown slug simply matches nothing.
    if (params.category) {
      where.categoryId =
        facets.categories.find((c) => c.slug === params.category)?.id ?? "";
    }
    if (params.brand) {
      where.brandId =
        facets.brands.find((b) => b.slug === params.brand)?.id ?? "";
    }

    const minP = params.min ? Number(params.min) : undefined;
    const maxP = params.max ? Number(params.max) : undefined;
    if (minP != null || maxP != null) {
      const price: Record<string, number> = {};
      if (minP != null && !Number.isNaN(minP)) price.gte = minP;
      if (maxP != null && !Number.isNaN(maxP) && params.max !== "")
        price.lte = maxP;
      where.price = price;
    }

    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (params.sort === "popular") orderBy = { reviewCount: "desc" };
    if (params.sort === "price-asc") orderBy = { price: "asc" };
    if (params.sort === "price-desc") orderBy = { price: "desc" };
    if (params.sort === "rating") orderBy = { rating: "desc" };
    if (params.sort === "newest") orderBy = { createdAt: "desc" };

    const query = {
      where: where as never,
      select: LIST_SELECT,
      // id tiebreak keeps pages stable when many rows share a sort value;
      // same direction as the sort so one (field, id) index serves both.
      orderBy: [orderBy, { id: Object.values(orderBy)[0] }] as never,
      skip: (page - 1) * perPage,
    };

    if (params.lite === "1") {
      const rows = await this.prisma.product.findMany({
        ...query,
        take: perPage + 1,
      });
      return {
        products: rows.slice(0, perPage),
        page,
        perPage,
        hasMore: rows.length > perPage && page < MAX_PAGE,
      };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({ ...query, take: perPage }),
      this.countCache.get(JSON.stringify(where), () =>
        this.prisma.product.count({ where: where as never }),
      ),
    ]);

    return {
      products,
      total,
      page,
      perPage,
      totalPages: Math.min(MAX_PAGE, Math.ceil(total / perPage)),
      categories: facets.categories,
      brands: facets.brands,
    };
  }

  /** Hydrate product cards by ids, preserving the given order */
  async productsByIds(ids: string[]) {
    const list = ids.slice(0, 60);
    if (!list.length) return { products: [] };
    const products = await this.prisma.product.findMany({
      where: { id: { in: list }, isActive: true },
      include: { brand: true },
    });
    const order = new Map(list.map((id, i) => [id, i]));
    products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return { products };
  }

  /** Product detail — mirrors src/app/products/[slug]/page.tsx queries */
  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { brand: true, category: true },
    });
    if (!product) throw new NotFoundException("Product not found");

    const genericTags = (product.tags || [])
      .filter(
        (t) =>
          t.length > 3 &&
          t !== "medicine" &&
          t !== product.brand?.name?.toLowerCase(),
      )
      .slice(0, 4);

    let related = await this.prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
        OR: [
          ...(genericTags.length ? [{ tags: { hasSome: genericTags } }] : []),
          ...(product.brandId ? [{ brandId: product.brandId }] : []),
        ],
      },
      include: { brand: true },
      take: 8,
      orderBy: { reviewCount: "desc" },
    });
    if (related.length < 5) {
      const extra = await this.prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { notIn: [product.id, ...related.map((r) => r.id)] },
          isActive: true,
        },
        include: { brand: true },
        take: 8 - related.length,
        orderBy: { createdAt: "desc" },
      });
      related = [...related, ...extra];
    }

    return { product, related };
  }

  /** GET /products/rx-check?id= */
  async rxCheck(id?: string) {
    if (!id) return { requiresRx: false };
    const p = await this.prisma.product.findUnique({
      where: { id },
      select: { requiresRx: true },
    });
    return { requiresRx: Boolean(p?.requiresRx) };
  }
}
