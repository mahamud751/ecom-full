import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const AUTH_OPTIONAL_KEY = "authOptional";
/** Endpoint accepts a token when present but does not require one */
export const OptionalAuth = () => SetMetadata(AUTH_OPTIONAL_KEY, true);

export type JwtPayload = {
  sub: string;
  email: string | null;
  name: string;
  role: "CUSTOMER" | "ADMIN" | "DOCTOR";
};

export type AuthUser = JwtPayload;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const optional =
      this.reflector.getAllAndOverride<boolean>(AUTH_OPTIONAL_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? false;

    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      if (optional) return true;
      throw new UnauthorizedException("Authentication required");
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      (req as Request & { user?: AuthUser }).user = payload;
    } catch {
      if (optional) return true;
      throw new UnauthorizedException("Invalid or expired token");
    }

    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (roles?.length) {
      const user = (req as Request & { user?: AuthUser }).user;
      if (!user || !roles.includes(user.role)) {
        throw new UnauthorizedException("Insufficient permissions");
      }
    }
    return true;
  }
}
