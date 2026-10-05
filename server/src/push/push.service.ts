import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging, type Message } from "firebase-admin/messaging";
import { PrismaService } from "../prisma/prisma.service";

/** FCM error codes that mean the token is dead and should be forgotten. */
const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

function isDeadToken(error: { code: string; message: string }): boolean {
  // invalid-argument also covers bad payloads; only treat it as a dead token
  // when FCM says the token itself is malformed.
  return (
    DEAD_TOKEN_CODES.has(error.code) ||
    (error.code === "messaging/invalid-argument" &&
      /registration token/i.test(error.message))
  );
}

/**
 * Sends push messages through Firebase Cloud Messaging.
 *
 * Credentials, first match wins:
 *   FIREBASE_SERVICE_ACCOUNT       — the service-account JSON itself (production)
 *   FIREBASE_SERVICE_ACCOUNT_PATH  — path to that JSON file
 *   ./firebase-service-account.json (local dev; git-ignored)
 * Without credentials every send is a logged no-op, so the API still runs.
 */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly log = new Logger("Push");
  private app: App | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const account = this.loadServiceAccount();
    if (!account) {
      this.log.warn("No Firebase credentials — push notifications disabled");
      return;
    }
    this.app =
      getApps()[0] ?? initializeApp({ credential: cert(account as never) });
    this.log.log("Firebase Cloud Messaging ready");
  }

  get enabled() {
    return this.app !== null;
  }

  private loadServiceAccount(): Record<string, unknown> | null {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      }
      const path =
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
        join(process.cwd(), "firebase-service-account.json");
      return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
    } catch (e) {
      this.log.error(`Bad Firebase credentials: ${(e as Error).message}`);
      return null;
    }
  }

  /** All registered device tokens of these customers. */
  async tokensForCustomers(customerIds: string[]): Promise<string[]> {
    if (!customerIds.length) return [];
    const rows = await this.prisma.deviceToken.findMany({
      where: { customerId: { in: customerIds } },
      select: { token: true },
    });
    return rows.map((r) => r.token);
  }

  /**
   * Sends a data-only, high-priority message to each token (data-only so the
   * app's background handler runs even when it was closed). Values must be
   * strings. Dead tokens are deleted. Returns how many sends succeeded.
   */
  async sendData(
    tokens: string[],
    data: Record<string, string>,
    opts: { ttlSeconds?: number } = {},
  ): Promise<number> {
    if (!this.app || !tokens.length) return 0;
    const ttl = (opts.ttlSeconds ?? 60) * 1000;
    const messages: Message[] = tokens.map((token) => ({
      token,
      data,
      android: { priority: "high", ttl },
    }));
    const res = await getMessaging(this.app).sendEach(messages);

    const dead: string[] = [];
    res.responses.forEach((r, i) => {
      if (!r.success && r.error && isDeadToken(r.error)) {
        dead.push(tokens[i]);
      } else if (!r.success) {
        this.log.warn(`FCM send failed: ${r.error?.code} ${r.error?.message}`);
      }
    });
    if (dead.length) {
      await this.prisma.deviceToken.deleteMany({
        where: { token: { in: dead } },
      });
    }
    return res.successCount;
  }
}
