import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { ApiError, approvedSeller, type AuthUser } from "./auth";

export const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];
export const STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const optionalText = (length: number) => z.string().trim().max(length).nullable().optional();
const deliveryDate = z
  .union([
    z.string().datetime({ offset: true }),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((value) => {
        const date = new Date(`${value}T00:00:00.000Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
      }),
  ])
  .transform((value) => new Date(value))
  .nullable()
  .optional();

const trackingInput = z
  .object({
    status: z.enum(ORDER_STATUSES).optional(),
    carrierName: optionalText(120),
    courierName: optionalText(120),
    trackingNumber: optionalText(160),
    estimatedDelivery: deliveryDate,
    note: optionalText(2000),
    carrierNotes: optionalText(2000),
  })
  .superRefine((value, context) => {
    for (const [a, b] of [
      ["carrierName", "courierName"],
      ["note", "carrierNotes"],
    ] as const) {
      if (value[a] !== undefined && value[b] !== undefined && value[a] !== value[b]) {
        context.addIssue({
          code: "custom",
          message: `${a} and ${b} must match when both are provided.`,
        });
      }
    }
  });

export function parseTrackingInput(body: unknown) {
  const parsed = trackingInput.safeParse(body);
  if (!parsed.success)
    throw new ApiError(
      400,
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
    );
  const value = parsed.data;
  const carrierName = value.carrierName !== undefined ? value.carrierName : value.courierName;
  const note = value.note !== undefined ? value.note : value.carrierNotes;
  if (
    value.status === undefined &&
    carrierName === undefined &&
    value.trackingNumber === undefined &&
    value.estimatedDelivery === undefined
  ) {
    throw new ApiError(
      400,
      "Provide a status or delivery field. Notes are recorded with status changes.",
    );
  }
  return {
    status: value.status,
    note: note || null,
    delivery: {
      ...(carrierName !== undefined && { carrierName: carrierName || null }),
      ...(value.trackingNumber !== undefined && { trackingNumber: value.trackingNumber || null }),
      ...(value.estimatedDelivery !== undefined && { estimatedDelivery: value.estimatedDelivery }),
    },
  };
}

export const initialTrackingEvent = (actorId?: string) => ({
  create: { status: "PENDING", actorId: actorId || null },
});

// The schema has one status per Order, not per seller shipment. A seller must own ALL items.
export function assertOrderWriter(user: AuthUser, sellerIds: (string | null)[]): void {
  if (!user.isActive) throw new ApiError(403, "Account is inactive.");
  if (user.role === "admin") return;
  if (!approvedSeller(user) || sellerIds.length === 0 || sellerIds.some((id) => id !== user.id)) {
    throw new ApiError(
      403,
      "Only the admin or the approved seller owning every item may update this order. Mixed-seller orders require an admin.",
    );
  }
}

const orderWithProducts = { items: { include: { product: true } } } satisfies Prisma.OrderInclude;

export async function updateOrderTracking(
  db: PrismaClient,
  id: string,
  user: AuthUser,
  body: unknown,
) {
  const input = parseTrackingInput(body);
  try {
    return await db.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({ where: { id }, include: orderWithProducts });
        if (!order) throw new ApiError(404, "Order not found.");
        assertOrderWriter(
          user,
          order.items.map((item) => item.product.sellerId),
        );
        const nextStatus = input.status ?? order.status;
        const changed = nextStatus !== order.status;
        if (
          changed &&
          (!ORDER_STATUSES.includes(order.status as OrderStatus) ||
            !STATUS_TRANSITIONS[order.status as OrderStatus].includes(nextStatus as OrderStatus))
        ) {
          throw new ApiError(
            409,
            `Cannot change order status from ${order.status} to ${nextStatus}.`,
          );
        }
        const deliveryChanged = Object.entries(input.delivery).some(([key, value]) => {
          const oldValue = order[key as keyof typeof input.delivery];
          return (
            (oldValue instanceof Date ? oldValue.getTime() : oldValue) !==
            (value instanceof Date ? value.getTime() : value)
          );
        });
        if (!changed && !deliveryChanged) return { order, historyCreated: false };
        const updated = await tx.order.update({
          // The status/timestamp condition also prevents stale writes.
          where: { id, status: order.status, updatedAt: order.updatedAt },
          data: {
            ...input.delivery,
            ...(changed && {
              status: nextStatus,
              trackingEvents: {
                create: { status: nextStatus, note: input.note, actorId: user.id },
              },
            }),
          },
          include: orderWithProducts,
        });
        return { order: updated, historyCreated: changed };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2034", "P2025"].includes(error.code)
    ) {
      throw new ApiError(409, "The order changed during this request. Reload the order and retry.");
    }
    throw error;
  }
}

export async function getOrderTracking(db: PrismaClient, id: string, user: AuthUser) {
  const where: Prisma.OrderWhereInput = { id };
  if (!user.isActive) throw new ApiError(403, "Account is inactive.");
  if (user.role !== "admin") {
    if (approvedSeller(user)) where.items = { some: { product: { sellerId: user.id } } };
    else where.userId = user.id;
  }
  // One consistent snapshot for the current status and its chronological events.
  const order = await db.$transaction(
    (tx) =>
      tx.order.findFirst({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          carrierName: true,
          trackingNumber: true,
          estimatedDelivery: true,
          createdAt: true,
          updatedAt: true,
          trackingEvents: {
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            select: {
              id: true,
              status: true,
              note: true,
              createdAt: true,
              ...(user.role === "admin" && { actorId: true }),
            },
          },
        },
      }),
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
  if (!order) throw new ApiError(404, "Order not found.");
  return order;
}
