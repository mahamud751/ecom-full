import { Body, Controller, Delete, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser, JwtAuthGuard, Roles } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ApiError } from "../common/utils";

@ApiTags("push")
@Controller("devices")
export class DevicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles("CUSTOMER")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Register this phone's FCM token for the customer" })
  async register(
    @CurrentUser() user: AuthUser,
    @Body() body: { token?: string; platform?: string },
  ) {
    const token = body?.token?.trim();
    if (!token || token.length > 4096)
      throw new ApiError(400, "token required");
    const platform = body.platform === "ios" ? "ios" : "android";
    // A token belongs to one install; re-registering moves it to whoever is
    // signed in on that phone now.
    await this.prisma.deviceToken.upsert({
      where: { token },
      create: { token, platform, customerId: user.sub },
      update: { platform, customerId: user.sub, lastSeenAt: new Date() },
    });
    return { success: true };
  }

  @Delete()
  @ApiOperation({ summary: "Forget this phone's FCM token (logout)" })
  async unregister(@Body() body: { token?: string }) {
    const token = body?.token?.trim();
    if (token) await this.prisma.deviceToken.deleteMany({ where: { token } });
    return { success: true };
  }
}
