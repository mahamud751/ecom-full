import { createHash, randomBytes } from "crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import type { JwtPayload } from "./jwt-auth.guard";

/**
 * A just-rotated refresh token stays usable this long so overlapping
 * refreshes (several components / tabs on page load) don't sign the user out.
 */
const ROTATION_GRACE_MS = 30_000;

type IssueResult = {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: string;
};

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private get refreshDays(): number {
    return Number(process.env.JWT_REFRESH_DAYS || 30);
  }

  async issuePair(payload: JwtPayload): Promise<IssueResult> {
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = randomBytes(48).toString("hex");
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hash(refreshToken),
        role: payload.role,
        userId: payload.sub,
        expiresAt: new Date(Date.now() + this.refreshDays * 86400_000),
      },
    });
    return {
      accessToken,
      refreshToken,
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
    };
  }

  /** Validate + rotate a refresh token; returns new pair with the same payload */
  async rotate(
    refreshToken: string,
    buildPayload: (userId: string) => Promise<JwtPayload | null>,
  ): Promise<IssueResult> {
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token required");
    }
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(refreshToken) },
    });
    const now = new Date();
    const inGrace =
      !!stored?.revokedAt &&
      now.getTime() - stored.revokedAt.getTime() < ROTATION_GRACE_MS;
    if (!stored || (stored.revokedAt && !inGrace) || stored.expiresAt < now) {
      throw new UnauthorizedException("Session expired. Please sign in again.");
    }

    const payload = await buildPayload(stored.userId);
    if (!payload || payload.role !== stored.role) {
      throw new UnauthorizedException("Account is not active");
    }

    // Single-use rotation: revoke the presented token
    if (!stored.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: now },
      });
    }

    return this.issuePair(payload);
  }

  async revoke(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(refreshToken) },
    });
    if (stored) {
      const now = new Date();
      // Expire too, so the rotation grace window never revives it
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: stored.revokedAt ?? now, expiresAt: now },
      });
    }
  }

  /** Revoke every live session for a user (e.g. on account deletion). */
  async revokeAll(userId: string, role: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, role, expiresAt: { gt: new Date() } },
      data: { revokedAt: new Date(), expiresAt: new Date() },
    });
  }

  private hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
