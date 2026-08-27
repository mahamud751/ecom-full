import {
  Body,
  Controller,
  Get,
  Injectable,
  Post,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
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
import { isWithinScheduleNow } from "../doctors/schedule";

@Injectable()
export class DoctorAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  private payloadFor(d: {
    id: string;
    email: string;
    name: string;
  }): JwtPayload {
    return { sub: d.id, email: d.email, name: d.name, role: "DOCTOR" };
  }

  async login(email: string, password: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { email: (email || "").trim().toLowerCase() },
    });
    if (!doctor || !doctor.isActive || !doctor.password) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const ok = await verifyPassword(password || "", doctor.password);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const pair = await this.tokens.issuePair(
      this.payloadFor({
        id: doctor.id,
        email: doctor.email!,
        name: doctor.name,
      }),
    );
    return {
      success: true,
      doctor: {
        id: doctor.id,
        slug: doctor.slug,
        name: doctor.name,
        email: doctor.email,
        isEmergency: doctor.isEmergency,
      },
      ...pair,
    };
  }

  async refresh(refreshToken: string) {
    const pair = await this.tokens.rotate(refreshToken, async (userId) => {
      const d = await this.prisma.doctor.findUnique({ where: { id: userId } });
      if (!d || !d.isActive || !d.email) return null;
      return this.payloadFor({ id: d.id, email: d.email, name: d.name });
    });
    return { success: true, ...pair };
  }

  async logout(refreshToken: string) {
    await this.tokens.revoke(refreshToken);
    return { success: true };
  }

  async me(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { schedules: true },
    });
    if (!doctor || !doctor.isActive) throw new UnauthorizedException();
    const schedules = doctor.schedules.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotMins: s.slotMins,
      isActive: s.isActive,
    }));
    const inHours = doctor.isEmergency ? true : isWithinScheduleNow(schedules);
    return {
      doctor: {
        id: doctor.id,
        slug: doctor.slug,
        name: doctor.name,
        specialty: doctor.specialty,
        image: doctor.image,
        email: doctor.email,
        fee: doctor.fee,
        emergencyFee: doctor.emergencyFee,
        isOnline: doctor.isOnline,
        isEmergency: doctor.isEmergency,
        availableNow: doctor.isOnline && (doctor.isEmergency || inHours),
      },
    };
  }
}

@ApiTags("doctor-auth")
@Controller("doctors/auth")
export class DoctorAuthController {
  constructor(private readonly auth: DoctorAuthService) {}

  @Post("login")
  @ApiOperation({ summary: "Doctor portal login" })
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body?.email || "", body?.password || "");
  }

  @Post("refresh")
  refresh(@Body() body: { refreshToken: string }) {
    return this.auth.refresh(body.refreshToken || "");
  }

  @Post("logout")
  logout(@Body() body: { refreshToken?: string }) {
    return this.auth.logout(body.refreshToken || "");
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @Roles("DOCTOR")
  @ApiBearerAuth()
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.sub);
  }
}
