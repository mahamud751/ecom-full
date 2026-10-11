import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import type { Customer } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { TokenService } from "./token.service";
import type { JwtPayload } from "./jwt-auth.guard";
import { pageParams } from "../common/pagination";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  city: string | null;
  area: string | null;
  postalCode: string | null;
  createdAt: string;
  lastLoginAt: string | null;
};

export function toPublicUser(c: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  gender: string | null;
  dateOfBirth: Date | null;
  address: string | null;
  city: string | null;
  area: string | null;
  postalCode: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
}): PublicUser {
  return {
    id: c.id,
    email: c.email,
    name: c.name,
    phone: c.phone,
    avatarUrl: c.avatarUrl,
    gender: c.gender,
    dateOfBirth: c.dateOfBirth
      ? c.dateOfBirth.toISOString().slice(0, 10)
      : null,
    address: c.address,
    city: c.city,
    area: c.area,
    postalCode: c.postalCode,
    createdAt: c.createdAt.toISOString(),
    lastLoginAt: c.lastLoginAt ? c.lastLoginAt.toISOString() : null,
  };
}

export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$")) {
    return bcrypt.compare(plain, stored);
  }
  // legacy plain passwords until re-seed
  return stored === plain;
}

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  private payloadFor(c: {
    id: string;
    email: string;
    name: string;
  }): JwtPayload {
    return { sub: c.id, email: c.email, name: c.name, role: "CUSTOMER" };
  }

  async register(input: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) {
    const email = (input.email || "").trim().toLowerCase();
    const name = (input.name || "").trim();
    const password = input.password || "";
    const phone = input.phone?.trim() || null;

    if (!email || !email.includes("@")) {
      throw new BadRequestException("Valid email is required");
    }
    if (!name || name.length < 2) {
      throw new BadRequestException("Name must be at least 2 characters");
    }
    if (!password || password.length < 6) {
      throw new BadRequestException("Password must be at least 6 characters");
    }

    const existing = await this.prisma.customer.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    // Doctor emails belong to the doctor realm — registering one here would
    // split the account (login bridges doctor credentials to a linked row).
    const doctor = await this.prisma.doctor.findUnique({
      where: { email },
      select: { id: true },
    });
    if (doctor) {
      throw new BadRequestException(
        "This email belongs to a doctor account. Please sign in instead.",
      );
    }

    const customer = await this.prisma.customer.create({
      data: {
        email,
        name,
        phone,
        password: await bcrypt.hash(password, 10),
        lastLoginAt: new Date(),
      },
    });

    const pair = await this.tokens.issuePair(this.payloadFor(customer));
    return { success: true, user: toPublicUser(customer), ...pair };
  }

  private async completeLogin(customer: Customer) {
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() },
    });

    const pair = await this.tokens.issuePair(this.payloadFor(updated));
    return { success: true, user: toPublicUser(updated), ...pair };
  }

  async login(email: string, password: string, client?: string) {
    const normalized = (email || "").trim().toLowerCase();

    // The web storefront always routes doctor accounts to the Doctor Portal
    // (its auth proxy marks itself with client === "web"). Checked before the
    // customer lookup so an app-created linked customer row cannot shadow it.
    if (client === "web") {
      const doctor = await this.prisma.doctor.findUnique({
        where: { email: normalized },
        select: { id: true },
      });
      if (doctor) {
        throw new ForbiddenException({
          message:
            "This email belongs to a doctor account. Please sign in from the Doctor Portal.",
          code: "DOCTOR_ACCOUNT",
        });
      }
    }

    const customer = await this.prisma.customer.findUnique({
      where: { email: normalized },
    });
    if (customer && customer.isActive) {
      const ok = await verifyPassword(password || "", customer.password);
      if (ok) return this.completeLogin(customer);
    }

    // Doctor credentials on this patient-login endpoint: the live mobile app
    // (already on the Play Store) signs doctors in here, so doctor accounts
    // mint a customer-realm session backed by a linked customer row with the
    // same email. The linked row's password mirror stays in sync with the
    // doctor's current password on every doctor-credential login.
    const doctor = await this.prisma.doctor.findUnique({
      where: { email: normalized },
    });
    if (
      doctor &&
      doctor.isActive &&
      doctor.password &&
      (await verifyPassword(password || "", doctor.password))
    ) {
      if (!customer) {
        const linked = await this.prisma.customer.create({
          data: {
            email: normalized,
            password: doctor.password,
            name: doctor.name,
            phone: doctor.phone,
            isActive: true,
          },
        });
        return this.completeLogin(linked);
      }
      if (customer.isActive) {
        const synced = await this.prisma.customer.update({
          where: { id: customer.id },
          data: { password: doctor.password },
        });
        return this.completeLogin(synced);
      }
    }

    throw new UnauthorizedException("Invalid email or password");
  }

  async refresh(refreshToken: string) {
    const pair = await this.tokens.rotate(refreshToken, async (userId) => {
      const c = await this.prisma.customer.findUnique({
        where: { id: userId },
      });
      if (!c || !c.isActive) return null;
      return this.payloadFor(c);
    });
    return { success: true, ...pair };
  }

  async logout(refreshToken: string) {
    await this.tokens.revoke(refreshToken);
    return { success: true };
  }

  async me(userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: userId },
    });
    if (!customer || !customer.isActive) {
      throw new UnauthorizedException();
    }
    return { user: toPublicUser(customer) };
  }

  async myOrders(
    userId: string,
    query: { page?: string; perPage?: string } = {},
  ) {
    const p = pageParams(query, { perPage: 50, maxPerPage: 100 });
    const customer = await this.prisma.customer.findUnique({
      where: { id: userId },
    });
    if (!customer) throw new NotFoundException("Not found");

    // Orders linked by customerId OR matching email/phone (legacy guest orders)
    const orders = await this.prisma.order.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          // Exact match (indexed): customer emails are stored lowercase and
          // new orders are too. Older mixed-case guest orders need the
          // one-off lowercase backfill to be matched.
          ...(customer.email ? [{ customerEmail: customer.email }] : []),
          ...(customer.phone ? [{ customerPhone: customer.phone }] : []),
        ],
      },
      include: { items: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: p.skip,
      take: p.take + 1,
    });
    const hasMore = orders.length > p.take;

    return {
      page: p.page,
      hasMore,
      orders: orders.slice(0, p.take).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        subtotal: o.subtotal,
        deliveryFee: o.deliveryFee,
        discount: o.discount,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        city: o.city,
        area: o.area,
        address: o.address,
        createdAt: o.createdAt,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        items: o.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          image: i.image,
        })),
      })),
    };
  }

  async updateProfile(userId: string, body: Record<string, unknown>) {
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name || "").trim();
      if (name.length < 2) {
        throw new BadRequestException("Name must be at least 2 characters");
      }
      data.name = name;
    }
    if (body.phone !== undefined) {
      data.phone = String(body.phone || "").trim() || null;
    }
    if (body.gender !== undefined) {
      const g = String(body.gender || "")
        .trim()
        .toLowerCase();
      data.gender = ["male", "female", "other", ""].includes(g)
        ? g || null
        : null;
    }
    if (body.dateOfBirth !== undefined) {
      const raw = String(body.dateOfBirth || "").trim();
      data.dateOfBirth = raw ? new Date(raw) : null;
    }
    for (const f of ["address", "city", "area", "postalCode", "avatarUrl"]) {
      if (body[f] !== undefined) {
        data[f] = String(body[f] || "").trim() || null;
      }
    }

    // Optional password change
    if (body.newPassword) {
      const current = String(body.currentPassword || "");
      const next = String(body.newPassword || "");
      if (next.length < 6) {
        throw new BadRequestException(
          "New password must be at least 6 characters",
        );
      }
      const existing = await this.prisma.customer.findUnique({
        where: { id: userId },
      });
      if (!existing) throw new NotFoundException("User not found");
      const ok = await verifyPassword(current, existing.password);
      if (!ok) {
        throw new BadRequestException("Current password is incorrect");
      }
      data.password = await bcrypt.hash(next, 10);
    }

    const updated = await this.prisma.customer.update({
      where: { id: userId },
      data,
    });

    return { success: true, user: toPublicUser(updated) };
  }

  /**
   * Account deletion (Play/App Store policy requirement). Orders are kept
   * for accounting/legal record-keeping, so this scrubs personal data and
   * deactivates the account rather than hard-deleting the row.
   */
  async deleteAccount(userId: string, password: string) {
    const existing = await this.prisma.customer.findUnique({
      where: { id: userId },
    });
    if (!existing) throw new NotFoundException("User not found");

    const ok = await verifyPassword(password || "", existing.password);
    if (!ok) {
      throw new BadRequestException("Password is incorrect");
    }

    await this.prisma.customer.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@ahona.deleted`,
        name: "Deleted user",
        phone: null,
        avatarUrl: null,
        gender: null,
        dateOfBirth: null,
        address: null,
        city: null,
        area: null,
        postalCode: null,
        password: await bcrypt.hash(randomBytes(24).toString("hex"), 10),
        isActive: false,
      },
    });

    await this.tokens.revokeAll(userId, "CUSTOMER");

    return { success: true };
  }
}
