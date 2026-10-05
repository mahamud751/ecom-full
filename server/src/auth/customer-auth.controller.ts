import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CustomerAuthService } from "./customer-auth.service";
import { CurrentUser } from "./current-user.decorator";
import { JwtAuthGuard, type AuthUser } from "./jwt-auth.guard";

@ApiTags("auth")
@Controller("auth")
export class CustomerAuthController {
  constructor(private readonly auth: CustomerAuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Create a customer account" })
  register(
    @Body()
    body: {
      email: string;
      password: string;
      name: string;
      phone?: string;
    },
  ) {
    return this.auth.register(body);
  }

  @Post("login")
  @ApiOperation({ summary: "Login, returns JWT access + refresh tokens" })
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Rotate refresh token for a new token pair" })
  refresh(@Body() body: { refreshToken: string }) {
    return this.auth.refresh(body.refreshToken || "");
  }

  @Post("logout")
  @ApiOperation({ summary: "Revoke a refresh token" })
  logout(@Body() body: { refreshToken?: string }) {
    return this.auth.logout(body.refreshToken || "");
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Current customer profile" })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.sub);
  }

  @Get("orders")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Orders for the signed-in customer" })
  orders(
    @CurrentUser() user: AuthUser,
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    return this.auth.myOrders(user.sub, { page, perPage });
  }

  @Patch("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update profile / change password" })
  profile(
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.auth.updateProfile(user.sub, body);
  }

  @Delete("account")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete the current customer's account" })
  deleteAccount(
    @CurrentUser() user: AuthUser,
    @Body() body: { password?: string },
  ) {
    return this.auth.deleteAccount(user.sub, body?.password || "");
  }
}
