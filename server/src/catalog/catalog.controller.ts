import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CatalogService } from "./catalog.service";

@ApiTags("catalog")
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("home")
  @ApiOperation({
    summary: "Home page payload (banners, categories, sections, doctors)",
  })
  home() {
    return this.catalog.getHomeData();
  }

  @Get("sitemap")
  @ApiOperation({ summary: "Slugs + updatedAt for SEO sitemap" })
  @ApiQuery({
    name: "products",
    required: false,
    description: "0 = omit the inline first page of product slugs",
  })
  sitemap(@Query("products") products?: string) {
    return this.catalog.sitemap({ products });
  }

  @Get("sitemap/products")
  @ApiOperation({ summary: "One page (45k) of product slugs for the sitemap" })
  @ApiQuery({ name: "page", required: false })
  sitemapProducts(@Query("page") page?: string) {
    return this.catalog.sitemapProducts(page ?? 1);
  }

  @Get("categories")
  @ApiOperation({ summary: "All categories" })
  categories() {
    return this.catalog.listCategories();
  }

  @Get("categories/:slug")
  @ApiOperation({ summary: "Category by slug with paginated products" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "sort", required: false })
  @ApiQuery({ name: "perPage", required: false })
  category(
    @Param("slug") slug: string,
    @Query("page") page?: string,
    @Query("sort") sort?: string,
    @Query("perPage") perPage?: string,
  ) {
    return this.catalog.getCategoryBySlug(slug, { page, sort, perPage });
  }

  @Get("brands")
  @ApiOperation({ summary: "All brands" })
  brands() {
    return this.catalog.listBrands();
  }

  @Get("banners")
  @ApiOperation({ summary: "Active banners" })
  banners() {
    return this.catalog.listBanners();
  }

  @Get("products")
  @ApiOperation({ summary: "Store listing with filters + pagination" })
  @ApiQuery({ name: "flash", required: false })
  @ApiQuery({
    name: "sort",
    required: false,
    enum: ["price-asc", "price-desc", "rating", "newest"],
  })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "category", required: false, description: "Category slug" })
  @ApiQuery({ name: "brand", required: false, description: "Brand slug" })
  @ApiQuery({ name: "min", required: false })
  @ApiQuery({ name: "max", required: false })
  @ApiQuery({ name: "section", required: false })
  @ApiQuery({ name: "perPage", required: false })
  @ApiQuery({
    name: "lite",
    required: false,
    description:
      "1 = just products + hasMore (no total count, no filter lists) — for infinite scroll",
  })
  products(
    @Query("flash") flash?: string,
    @Query("sort") sort?: string,
    @Query("page") page?: string,
    @Query("category") category?: string,
    @Query("brand") brand?: string,
    @Query("min") min?: string,
    @Query("max") max?: string,
    @Query("section") section?: string,
    @Query("perPage") perPage?: string,
    @Query("lite") lite?: string,
  ) {
    return this.catalog.listProducts({
      flash,
      sort,
      page,
      category,
      brand,
      min,
      max,
      section,
      perPage,
      lite,
    });
  }

  // Must stay above GET products/:slug
  @Get("products/rx-check")
  @ApiOperation({ summary: "Check whether a product requires a prescription" })
  rxCheck(@Query("id") id?: string) {
    return this.catalog.rxCheck(id);
  }

  // Must stay above GET products/:slug
  @Get("products/by-ids")
  @ApiOperation({ summary: "Hydrate products by ids (keeps given order)" })
  byIds(@Query("ids") ids = "") {
    return this.catalog.productsByIds(
      ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }

  @Get("products/:slug")
  @ApiOperation({ summary: "Product detail by slug + related products" })
  product(@Param("slug") slug: string) {
    return this.catalog.getProductBySlug(slug);
  }
}
