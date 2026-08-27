import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { TokenService } from "./token.service";
import { verifyPassword } from "./customer-auth.service";
import { CurrentUser } from "./current-user.decorator";
import {
  JwtAuthGuard,
  Roles,
  type AuthUser,
  type JwtPayload,
} from "./jwt-auth.guard";

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  private payloadFor(u: {
    id: string;
    email: string;
    name: string;
  }): JwtPayload {
    return { sub: u.id, email: u.email, name: u.name, role: "ADMIN" };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: (email || "").trim().toLowerCase() },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const ok = await verifyPassword(password || "", user.password);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    // Upgrade plain password to bcrypt on successful login
    if (!user.password.startsWith("$2")) {
      await this.prisma.adminUser.update({
        where: { id: user.id },
        data: { password: await bcrypt.hash(password, 10) },
      });
    }

    const pair = await this.tokens.issuePair(this.payloadFor(user));
    return {
      success: true,
      admin: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...pair,
    };
  }

  async refresh(refreshToken: string) {
    const pair = await this.tokens.rotate(refreshToken, async (userId) => {
      const u = await this.prisma.adminUser.findUnique({
        where: { id: userId },
      });
      if (!u || !u.isActive) return null;
      return this.payloadFor(u);
    });
    return { success: true, ...pair };
  }

  async me(userId: string) {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
    });
    if (!user || !user.isActive) throw new UnauthorizedException();
    return {
      admin: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(refreshToken: string) {
    await this.tokens.revoke(refreshToken);
    return { success: true };
  }
}

@ApiTags("admin-auth")
@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post("login")
  @ApiOperation({ summary: "Admin login (role-scoped JWT)" })
  login(@Body() body: { email: string; password: string }) {
    if (!body?.email || !body?.password) {
      throw new BadRequestException("Email and password required");
    }
    return this.auth.login(body.email, body.password);
  }

  @Post("refresh")
  refresh(@Body() body: { refreshToken: string }) {
    return this.auth.refresh(body.refreshToken || "");
  }

  @Post("logout")
  async logout(@Body() body: { refreshToken?: string }) {
    return this.auth.logout(body.refreshToken || "");
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.sub);
  }
}
