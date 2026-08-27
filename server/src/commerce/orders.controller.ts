import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { ApiError, makeRefNumber } from "../common/utils";
import { AuthUser, JwtAuthGuard, OptionalAuth } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";

type OrderItemInput = {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image: string;
};

function buildTimeline(status: string, createdAt: Date) {
  const steps = [
    { key: "PENDING", label: "Order placed", desc: "We received your order" },
    {
      key: "CONFIRMED",
      label: "Confirmed",
      desc: "Pharmacy verified your items",
    },
    {
      key: "PROCESSING",
      label: "Processing",
      desc: "Packing at our hub",
    },
    { key: "SHIPPED", label: "Out for delivery", desc: "Rider is on the way" },
    {
      key: "DELIVERED",
      label: "Delivered",
      desc: "Order completed successfully",
    },
  ];

  const order = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];
  const currentIdx = order.indexOf(status);

  // Demo progression: auto-advance based on time since order
  const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  let demoIdx = 0;
  if (hours > 0.01) demoIdx = 1;
  if (hours > 1) demoIdx = 2;
  if (hours > 6) demoIdx = 3;
  if (hours > 24) demoIdx = 4;
  if (status === "CANCELLED") demoIdx = -1;

  const activeIdx = status === "CANCELLED" ? -1 : Math.max(currentIdx, demoIdx);

  return steps.map((s, i) => ({
    ...s,
    done: activeIdx >= i,
    current: activeIdx === i,
  }));
}

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: "Track an order by order number (+ optional phone check)",
  })
  async track(
    @Query("order") orderNumber?: string,
    @Query("phone") phone?: string,
  ) {
    try {
      if (!orderNumber?.trim()) {
        throw new ApiError(400, "Order number is required");
      }

      const order = await this.prisma.order.findUnique({
        where: { orderNumber: orderNumber.trim() },
        include: { items: true },
      });

      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      // Optional phone verification for privacy
      if (phone?.trim()) {
        const normalized = phone.replace(/\D/g, "");
        const orderPhone = order.customerPhone.replace(/\D/g, "");
        if (
          normalized &&
          !orderPhone.endsWith(normalized.slice(-10)) &&
          !orderPhone.includes(normalized)
        ) {
          throw new ApiError(403, "Phone number does not match this order");
        }
      }

      return {
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.customerName,
        // Full phone for invoice PDF; masked view field separate
        customerPhone: order.customerPhone,
        customerPhoneMasked: order.customerPhone.replace(/.(?=.{4})/g, "•"),
        address: order.address,
        city: order.city,
        area: order.area,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        discount: order.discount,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        couponCode: order.couponCode,
        prescriptionUrl: order.prescriptionUrl,
        createdAt: order.createdAt,
        items: order.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          image: i.image,
        })),
        timeline: buildTimeline(order.status, order.createdAt),
      };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error("Order lookup error:", err);
      throw new ApiError(500, "Failed to look up order");
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @OptionalAuth()
  @ApiOperation({
    summary: "Place a COD order (stock decrement + coupon apply)",
  })
  async create(
    @Body()
    body: {
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      address: string;
      city?: string;
      area?: string;
      notes?: string;
      paymentMethod?: string;
      items: OrderItemInput[];
      couponCode?: string;
      prescriptionUrl?: string;
    },
    @CurrentUser() user?: AuthUser,
  ) {
    try {
      const {
        customerName,
        customerPhone,
        customerEmail,
        address,
        city,
        area,
        notes,
        paymentMethod,
        items,
        couponCode,
        prescriptionUrl,
      } = body || ({} as never);

      if (!customerName?.trim() || !customerPhone?.trim() || !address?.trim()) {
        throw new ApiError(400, "Name, phone and address are required");
      }

      if (!items?.length) {
        throw new ApiError(400, "Cart is empty");
      }

      const productIds = items.map((i) => i.productId);
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      const orderItems: {
        productId: string;
        quantity: number;
        price: number;
        name: string;
        image: string;
      }[] = [];

      let subtotal = 0;

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new ApiError(400, `Product not found: ${item.name}`);
        }
        if (product.stock < item.quantity) {
          throw new ApiError(400, `Insufficient stock for ${product.name}`);
        }
        const qty = Math.max(1, Math.floor(item.quantity));
        const price = product.price;
        subtotal += price * qty;
        orderItems.push({
          productId: product.id,
          quantity: qty,
          price,
          name: product.name,
          image: product.image,
        });
      }

      // Prescription required for restricted meds
      const needsRx = products.some(
        (p) => productIds.includes(p.id) && p.requiresRx,
      );
      if (needsRx && !prescriptionUrl?.trim()) {
        throw new ApiError(
          400,
          "Prescription upload required for medicine items marked Rx-only",
        );
      }

      const deliveryFee = subtotal >= 999 ? 0 : 60;
      let discount = 0;
      let appliedCoupon: string | null = null;

      if (couponCode?.trim()) {
        const code = couponCode.trim().toUpperCase();
        const coupon = await this.prisma.coupon.findUnique({ where: { code } });
        if (
          coupon &&
          coupon.isActive &&
          (!coupon.endsAt || coupon.endsAt >= new Date()) &&
          coupon.startsAt <= new Date() &&
          subtotal >= coupon.minOrder &&
          (coupon.usageLimit == null || coupon.usedCount < coupon.usageLimit)
        ) {
          discount =
            coupon.type === "FIXED"
              ? coupon.value
              : (subtotal * coupon.value) / 100;
          if (coupon.maxDiscount != null) {
            discount = Math.min(discount, coupon.maxDiscount);
          }
          discount = Math.min(discount, subtotal);
          discount = Math.round(discount * 100) / 100;
          appliedCoupon = code;
        }
      }

      const total = Math.max(0, subtotal + deliveryFee - discount);
      const orderNumber = makeRefNumber("CHB");

      const session = user && user.role === "CUSTOMER" ? user : null;

      const order = await this.prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            orderNumber,
            customerId: session?.sub || null,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail?.trim() || session?.email || null,
            address: address.trim(),
            city: city?.trim() || "Dhaka",
            area: area?.trim() || null,
            notes: notes?.trim() || null,
            subtotal,
            deliveryFee,
            discount,
            total,
            couponCode: appliedCoupon,
            prescriptionUrl: prescriptionUrl?.trim() || null,
            paymentMethod: paymentMethod || "COD",
            status: "CONFIRMED",
            items: {
              create: orderItems,
            },
          },
          include: { items: true },
        });

        for (const item of orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        if (appliedCoupon) {
          await tx.coupon.update({
            where: { code: appliedCoupon },
            data: { usedCount: { increment: 1 } },
          });
        }

        return created;
      });

      return {
        success: true,
        orderNumber: order.orderNumber,
        total: order.total,
        discount: order.discount,
        itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
        status: order.status,
      };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error("Order error:", err);
      throw new ApiError(500, "Failed to place order. Please try again.");
    }
  }
}
