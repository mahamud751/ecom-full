import { apiServer } from "@/lib/api-client";
import { HeroCarousel, type BannerData } from "@/components/home/HeroCarousel";
import { ServiceCards } from "@/components/home/ServiceCards";
import {
  CategoryGrid,
  type CategoryData,
} from "@/components/home/CategoryGrid";
import { ProductSection } from "@/components/product/ProductSection";
import type { ProductCardData } from "@/components/product/ProductCard";
import {
  DoctorsSection,
  type DoctorPreview,
} from "@/components/home/DoctorsSection";

export const dynamic = "force-dynamic";

async function getHomeData() {
  return apiServer<{
    banners: BannerData[];
    categories: CategoryData[];
    skinoDeals: ProductCardData[];
    himalaya: ProductCardData[];
    flashSale: ProductCardData[];
    featured: ProductCardData[];
    doctors: DoctorPreview[];
  }>("/home");
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <div className="home-stack pb-8 sm:pb-10">
      <HeroCarousel banners={data.banners} />
      <ServiceCards />
      <ProductSection
        titleKey="home.bestPicks"
        products={data.featured}
        seeAllHref="/store"
      />
      <CategoryGrid categories={data.categories} />
      <ProductSection
        titleKey="home.flashSale"
        products={data.flashSale}
        seeAllHref="/store?flash=1"
      />
      <ProductSection
        titleKey="home.skino"
        products={data.skinoDeals}
        seeAllHref="/store"
      />
      <ProductSection
        titleKey="home.himalaya"
        products={data.himalaya}
        seeAllHref="/store"
      />
      <DoctorsSection compact doctors={data.doctors} />
    </div>
  );
}
