import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TokenService } from "./token.service";
import { CustomerAuthService } from "./customer-auth.service";
import { CustomerAuthController } from "./customer-auth.controller";
import { AdminAuthController, AdminAuthService } from "./admin-auth.controller";
import {
  DoctorAuthController,
  DoctorAuthService,
} from "./doctor-auth.controller";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || "dev-secret-change-me",
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_EXPIRES || "15m") as "15m",
      },
    }),
  ],
  controllers: [
    CustomerAuthController,
    AdminAuthController,
    DoctorAuthController,
  ],
  providers: [
    TokenService,
    CustomerAuthService,
    AdminAuthService,
    DoctorAuthService,
    JwtAuthGuard,
  ],
  exports: [TokenService, JwtAuthGuard],
})
export class AuthModule {}
