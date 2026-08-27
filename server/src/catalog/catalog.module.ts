import { Module } from "@nestjs/common";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
import { DoctorsModule } from "../doctors/doctors.module";

@Module({
  imports: [DoctorsModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
