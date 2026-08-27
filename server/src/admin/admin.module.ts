import { Module } from "@nestjs/common";
import { AdminDashboardController } from "./dashboard.controller";
import { AdminCatalogController } from "./catalog.controller";
import { AdminProductsController } from "./products.controller";
import { AdminVariantsController } from "./variants.controller";
import { AdminStockController } from "./stock.controller";
import { AdminOrdersController } from "./orders.controller";
import { AdminRidersController } from "./riders.controller";
import { AdminVendorsController } from "./vendors.controller";
import { AdminCouponsController } from "./coupons.controller";
import { AdminRefundsController } from "./refunds.controller";
import { AdminReviewsController } from "./reviews.controller";
import { AdminNotifiesController } from "./notifies.controller";
import { AdminSupportController } from "./support.controller";
import { AdminDoctorsController } from "./doctors.controller";
import { AdminSettlementsController } from "./settlements.controller";
import { AdminLabController } from "./lab.controller";
import { AdminEarningsController } from "./earnings.controller";
import { AdminLaunchController } from "./launch.controller";

@Module({
  controllers: [
    AdminDashboardController,
    AdminCatalogController,
    AdminProductsController,
    AdminVariantsController,
    AdminStockController,
    AdminOrdersController,
    AdminRidersController,
    AdminVendorsController,
    AdminCouponsController,
    AdminRefundsController,
    AdminReviewsController,
    AdminNotifiesController,
    AdminSupportController,
    AdminDoctorsController,
    AdminSettlementsController,
    AdminLabController,
    AdminEarningsController,
    AdminLaunchController,
  ],
})
export class AdminModule {}
