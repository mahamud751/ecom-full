import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { DoctorsModule } from "./doctors/doctors.module";
import { CatalogModule } from "./catalog/catalog.module";
import { SearchModule } from "./search/search.module";
import { CommerceModule } from "./commerce/commerce.module";
import { LabModule } from "./lab/lab.module";
import { ConsultModule } from "./consult/consult.module";
import { AdminModule } from "./admin/admin.module";
import { UploadModule } from "./upload/upload.module";
import { PushModule } from "./push/push.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    // AuthModule first so /doctors/auth/* resolves before /doctors/:slug
    AuthModule,
    DoctorsModule,
    CatalogModule,
    SearchModule,
    CommerceModule,
    LabModule,
    PushModule,
    ConsultModule,
    AdminModule,
    UploadModule,
  ],
})
export class AppModule {}
