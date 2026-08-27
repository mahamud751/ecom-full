import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { DoctorsService } from "../doctors/doctors.service";

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
};

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly doctors: DoctorsService,
  ) {}

  /** Home page payload — mirrors src/app/page.tsx getHomeData() */
  async getHomeData() {
    const [
      banners,
      categories,
      skinoDeals,
      himalaya,
      flashSale,
      featured,
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
        where: { section: "skino-deals" },
        include: { brand: true },
        take: 10,
        orderBy: { reviewCount: "desc" },
      }),
      this.prisma.product.findMany({
        where: { section: "himalaya" },
        include: { brand: true },
        take: 10,
        orderBy: { reviewCount: "desc" },
      }),
      this.prisma.product.findMany({
        where: { isFlashSale: true },
        include: { brand: true },
        take: 10,
        orderBy: { comparePrice: "desc" },
      }),
      this.prisma.product.findMany({
        where: { isFeatured: true },
        include: { brand: true },
        take: 10,
        orderBy: { rating: "desc" },
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

  /** Sitemap payload — slugs + updatedAt for categories/products/doctors */
  async sitemap() {
    const [categories, products, doctors] = await Promise.all([
      this.prisma.category.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: { sortOrder: "asc" },
      }),
      this.prisma.product.findMany({
        select: { slug: true, updatedAt: true },
        take: 2000,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.doctor
        .findMany({
          select: { slug: true, updatedAt: true },
          where: { isActive: true },
        })
        .catch(() => [] as { slug: string; updatedAt: Date }[]),
    ]);
    return { categories, products, doctors };
  }

  async listCategories() {
    return this.prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });
    if (!category) throw new NotFoundException("Category not found");

    const products = await this.prisma.product.findMany({
      where: { categoryId: category.id },
      include: { brand: true },
      orderBy: { reviewCount: "desc" },
    });

    return { category, products };
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
    const page = Math.max(1, Number(params.page) || 1);
    const perPage = Math.min(48, Math.max(1, Number(params.perPage) || 24));

    const where: Record<string, unknown> = {};
    if (params.flash === "1") where.isFlashSale = true;
    if (params.section) where.section = params.section;
    if (params.category) where.category = { slug: params.category };
    if (params.brand) where.brand = { slug: params.brand };

    const minP = params.min ? Number(params.min) : undefined;
    const maxP = params.max ? Number(params.max) : undefined;
    if (minP != null || maxP != null) {
      const price: Record<string, number> = {};
      if (minP != null && !Number.isNaN(minP)) price.gte = minP;
      if (maxP != null && !Number.isNaN(maxP) && params.max !== "")
        price.lte = maxP;
      where.price = price;
    }

    let orderBy: Record<string, string> = { reviewCount: "desc" };
    if (params.sort === "price-asc") orderBy = { price: "asc" };
    if (params.sort === "price-desc") orderBy = { price: "desc" };
    if (params.sort === "rating") orderBy = { rating: "desc" };
    if (params.sort === "newest") orderBy = { createdAt: "desc" };

    const [products, total, categories, brands] = await Promise.all([
      this.prisma.product.findMany({
        where: where as never,
        include: { brand: true, category: true },
        orderBy: orderBy as never,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.product.count({ where: where as never }),
      this.prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
      this.prisma.brand.findMany({ orderBy: { name: "asc" } }),
    ]);

    return {
      products,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
      brands: brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug })),
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

    const related = await this.prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      include: { brand: true },
      take: 5,
    });

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
