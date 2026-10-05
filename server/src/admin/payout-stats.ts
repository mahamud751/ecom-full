import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Payout figures computed in the database instead of by loading every
 * order / consultation into memory (which breaks at millions of rows).
 */

export type RiderDeliveryStats = {
  riderId: string;
  deliveries: number;
  deliveryFees: number;
  /** A rider earns min(perDelivery, the order's delivery fee) per delivery. */
  riderEarned: number;
  gmv: number;
};

/** Delivered-order totals per rider (all riders, or just `riderIds`). */
export async function riderDeliveryStats(
  prisma: PrismaService,
  riderIds?: string[],
): Promise<RiderDeliveryStats[]> {
  const only = riderIds
    ? Prisma.sql`AND o."riderId" = ANY(${riderIds}::text[])`
    : Prisma.empty;
  const rows = await prisma.$queryRaw<
    {
      riderId: string;
      deliveries: number;
      deliveryFees: number;
      riderEarned: number;
      gmv: number;
    }[]
  >`
    SELECT o."riderId",
           COUNT(*)::int AS "deliveries",
           COALESCE(SUM(o."deliveryFee"), 0)::float8 AS "deliveryFees",
           COALESCE(SUM(LEAST(r."perDelivery", o."deliveryFee")), 0)::float8 AS "riderEarned",
           COALESCE(SUM(o."total"), 0)::float8 AS "gmv"
    FROM "Order" o
    JOIN "Rider" r ON r."id" = o."riderId"
    WHERE o."status" = 'DELIVERED' ${only}
    GROUP BY o."riderId"`;
  return rows;
}

/** Order counts per rider and status. */
export async function riderStatusCounts(
  prisma: PrismaService,
  riderIds: string[],
): Promise<Map<string, Record<string, number>>> {
  const groups = await prisma.order.groupBy({
    by: ["riderId", "status"],
    where: { riderId: { in: riderIds } },
    _count: { _all: true },
  });
  const out = new Map<string, Record<string, number>>();
  for (const g of groups) {
    if (!g.riderId) continue;
    const row = out.get(g.riderId) ?? {};
    row[g.status] = g._count._all;
    out.set(g.riderId, row);
  }
  return out;
}

/**
 * Each rider's latest `perRider` active/delivered orders, one LATERAL
 * lookup per rider on the (riderId, createdAt) index. (A nested Prisma
 * `include` with `take` fetches every matching order and trims in memory.)
 */
export async function riderRecentOrders(
  prisma: PrismaService,
  riderIds: string[],
  perRider: number,
) {
  const rows = await prisma.$queryRaw<
    {
      riderId: string;
      id: string;
      orderNumber: string;
      status: string;
      total: number;
      deliveryFee: number;
    }[]
  >`
    SELECT rid AS "riderId", o."id", o."orderNumber", o."status"::text,
           o."total", o."deliveryFee"
    FROM unnest(${riderIds}::text[]) AS rid
    CROSS JOIN LATERAL (
      SELECT * FROM "Order"
      WHERE "riderId" = rid
        AND "status" IN ('PROCESSING', 'SHIPPED', 'DELIVERED')
      ORDER BY "createdAt" DESC
      LIMIT ${perRider}
    ) o`;
  const out = new Map<string, Omit<(typeof rows)[number], "riderId">[]>();
  for (const { riderId, ...order } of rows) {
    const list = out.get(riderId) ?? [];
    list.push(order);
    out.set(riderId, list);
  }
  return out;
}

export type DoctorConsultStats = {
  doctorId: string;
  consults: number;
  gross: number;
};

/** Completed-consultation count and fee total per doctor. */
export async function doctorCompletedStats(
  prisma: PrismaService,
  doctorIds?: string[],
): Promise<Map<string, DoctorConsultStats>> {
  const groups = await prisma.consultation.groupBy({
    by: ["doctorId"],
    where: {
      status: "COMPLETED",
      ...(doctorIds ? { doctorId: { in: doctorIds } } : {}),
    },
    _sum: { fee: true },
    _count: { _all: true },
  });
  return new Map(
    groups.map((g) => [
      g.doctorId,
      {
        doctorId: g.doctorId,
        consults: g._count._all,
        gross: Number(g._sum.fee) || 0,
      },
    ]),
  );
}
