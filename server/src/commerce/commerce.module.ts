import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { CouponsController } from "./coupons.controller";
import { ReviewsController } from "./reviews.controller";
import { RefundsController } from "./refunds.controller";
import { SupportController } from "./support.controller";
import { NotifyController } from "./notify.controller";
import { WishlistController } from "./wishlist.controller";

@Module({
  controllers: [
    OrdersController,
    CouponsController,
    ReviewsController,
    RefundsController,
    SupportController,
    NotifyController,
    WishlistController,
  ],
})
export class CommerceModule {}
