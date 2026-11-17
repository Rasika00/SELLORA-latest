import { createHash, randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { ApiError, type AuthUser } from "./auth";
import { initialTrackingEvent } from "./order-tracking";

export class CheckoutRejection extends ApiError {
  readonly code = "CHECKOUT_REJECTED";
  constructor(message: string) {
    super(409, message);
  }
}

const optionalText = (length: number) => z.string().trim().max(length).nullish();
const checkoutInput = z.object({
  requireSession: z.boolean().optional(),
  customerName: z.string().trim().min(1).max(200),
  customerEmail: z.string().trim().toLowerCase().email().max(320),
  customerPhone: optionalText(50),
  shippingAddress: z.string().trim().min(1).max(2000),
  city: optionalText(120),
  zipCode: optionalText(32),
  totalAmount: z.number().finite().positive().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1).max(200),
        quantity: z.number().int().min(1).max(1000).default(1),
        price: z.number().finite().positive().optional(),
      }),
    )
    .min(1)
    .max(100),
});

function cents(value: number): number {
  const rounded = Math.round(value * 100);
  if (!Number.isSafeInteger(rounded) || rounded <= 0)
    throw new ApiError(400, "Invalid product price or order total.");
  return rounded;
}

export function parseCheckout(body: unknown) {
  const result = checkoutInput.safeParse(body);
  if (!result.success)
    throw new ApiError(400, "Enter valid contact, shipping and product quantities.");
  const value = result.data;
  const products = new Map<string, { productId: string; quantity: number; price?: number }>();
  for (const item of value.items) {
    const existing = products.get(item.productId);
    if (existing) {
      if (existing.price !== item.price)
        throw new ApiError(400, "Conflicting prices for the same product.");
      existing.quantity += item.quantity;
      if (existing.quantity > 1000) throw new ApiError(400, "Product quantity is too large.");
    } else products.set(item.productId, { ...item });
  }
  return {
    ...value,
    customerPhone: value.customerPhone || null,
    city: value.city || null,
    zipCode: value.zipCode || null,
    items: [...products.values()].sort((a, b) => a.productId.localeCompare(b.productId)),
  };
}

const withItems = { items: { include: { product: true } } } satisfies Prisma.OrderInclude;
type SavedOrder = Prisma.OrderGetPayload<{ include: typeof withItems }>;

function checkReplay(
  order: SavedOrder,
  input: ReturnType<typeof parseCheckout>,
  userId: string | null,
) {
  const sameContact =
    order.userId === userId &&
    order.customerName === input.customerName &&
    order.customerEmail === input.customerEmail &&
    order.customerPhone === input.customerPhone &&
    order.shippingAddress === input.shippingAddress &&
    order.city === input.city &&
    order.zipCode === input.zipCode;
  const saved = [...order.items].sort((a, b) => a.productId.localeCompare(b.productId));
  const sameItems =
    saved.length === input.items.length &&
    saved.every((item, i) => {
      const next = input.items[i];
      return (
        item.productId === next.productId &&
        item.quantity === next.quantity &&
        (next.price === undefined || cents(item.price) === cents(next.price))
      );
    });
  if (
    !sameContact ||
    !sameItems ||
    (input.totalAmount !== undefined && cents(input.totalAmount) !== cents(order.totalAmount))
  )
    throw new ApiError(
      409,
      "This checkout request was already used for different order details. Start a new checkout.",
    );
  return { order, replayed: true };
}

/** No schema change: the existing unique Order.id durably identifies keyed retries. */
export async function createCheckoutOrder(
  db: PrismaClient,
  body: unknown,
  actor?: AuthUser,
  key?: string,
) {
  const input = parseCheckout(body);
  if (input.requireSession && !actor) throw new ApiError(401, "Sign in again before ordering.");
  if (key !== undefined && !/^[A-Za-z0-9_-]{16,128}$/.test(key))
    throw new ApiError(400, "Invalid checkout request key.");
  if (actor && !actor.isActive) throw new ApiError(403, "Account is inactive.");
  const userId = actor?.id || null;
  // A client-supplied userId/email/role is never used for identity or key scope.
  const id = key
    ? `checkout_${createHash("sha256")
        .update(JSON.stringify([userId, key]))
        .digest("hex")}`
    : undefined;
  try {
    return await db.$transaction(
      async (tx) => {
        if (id) {
          const existing = await tx.order.findUnique({ where: { id }, include: withItems });
          if (existing) return checkReplay(existing, input, userId);
        }
        const products = await tx.product.findMany({
          where: { id: { in: input.items.map((i) => i.productId) } },
          select: { id: true, price: true, stock: true, status: true },
        });
        let totalCents = 0;
        const items: { productId: string; quantity: number; price: number }[] = [];
        for (const item of input.items) {
          const product = products.find((p) => p.id === item.productId);
          if (!product || product.status !== "APPROVED")
            throw new CheckoutRejection("A product is no longer available. Refresh your cart.");
          if (product.stock < item.quantity)
            throw new CheckoutRejection("Not enough stock for this order. Refresh your cart.");
          const price = cents(product.price);
          if (item.price !== undefined && cents(item.price) !== price)
            throw new CheckoutRejection(
              "A product price changed. Refresh your cart before ordering.",
            );
          totalCents += price * item.quantity;
          if (!Number.isSafeInteger(totalCents))
            throw new ApiError(400, "Order total is too large.");
          items.push({ productId: product.id, quantity: item.quantity, price: price / 100 });
        }
        if (input.totalAmount !== undefined && cents(input.totalAmount) !== totalCents)
          throw new CheckoutRejection(
            "The order total changed. Refresh your cart before ordering.",
          );
        // Sorted product IDs give a consistent locking order. The conditional SQL
        // decrement prevents two requests from consuming the same remaining stock.
        for (const item of items) {
          const reserved = await tx.product.updateMany({
            where: {
              id: item.productId,
              status: "APPROVED",
              price: item.price,
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          });
          if (reserved.count !== 1)
            throw new CheckoutRejection(
              "Stock or price changed during checkout. Refresh your cart.",
            );
        }
        const order = await tx.order.create({
          data: {
            ...(id && { id }),
            orderNumber: `ORD-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`,
            userId,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            shippingAddress: input.shippingAddress,
            city: input.city,
            zipCode: input.zipCode,
            totalAmount: totalCents / 100,
            status: "PENDING",
            trackingEvents: initialTrackingEvent(actor?.id),
            items: { create: items },
          },
          include: withItems,
        });
        return { order, replayed: false };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2034", "P2002"].includes(error.code)
    ) {
      // A concurrent identical request may have committed while this one rolled
      // back. Read it, never automatically repeat a stock-decrementing write.
      if (id) {
        const existing = await db.order.findUnique({ where: { id }, include: withItems });
        if (existing) return checkReplay(existing, input, userId);
      }
      throw new ApiError(
        409,
        "Checkout changed during this request. Retry with the same request key.",
      );
    }
    throw error;
  }
}
