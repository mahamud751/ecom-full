import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError } from "../common/utils";

@ApiTags("wishlist")
@Controller("wishlist")
export class WishlistController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("status")
  @ApiOperation({ summary: "Live stock + price for wishlist product ids" })
  async status(@Body() body: { ids?: string[] }) {
    try {
      const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
      if (!ids.length) return { products: [] };

      const products = await this.prisma.product.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          price: true,
          comparePrice: true,
          stock: true,
          isActive: true,
          brand: { select: { name: true } },
        },
      });

      return {
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.image,
          price: p.price,
          comparePrice: p.comparePrice,
          stock: p.stock,
          isActive: p.isActive,
          brand: p.brand?.name || null,
          inStock: p.stock > 0 && p.isActive,
        })),
      };
    } catch (e) {
      console.error(e);
      throw new ApiError(500, "Failed");
    }
  }
}
