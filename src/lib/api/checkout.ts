import { z } from "zod";

export interface OrderItemInput {
  productId: string;
  quantity: number;
  price: number;
}
export interface CreateOrderPayload {
  requireSession?: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  city?: string;
  zipCode?: string;
  totalAmount: number;
  items: OrderItemInput[];
}
const receiptSchema = z.object({
  success: z.literal(true),
  offline: z.undefined(),
  order: z.object({
    id: z.string().min(1),
    orderNumber: z.string().min(1),
    totalAmount: z.number().finite().positive(),
  }),
});
export type ConfirmedOrder = z.infer<typeof receiptSchema>["order"];
export class CheckoutError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly definitive = status !== undefined && [400, 401, 403, 404, 422].includes(status),
  ) {
    super(message);
  }
}

export async function createOrder(
  payload: CreateOrderPayload,
  requestKey: string,
): Promise<{ success: true; order: ConfirmedOrder }> {
  let response: Response;
  try {
    response = await fetch("/api/orders", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new CheckoutError(
      "We could not confirm your order. Your cart is saved. Retry this checkout to check the same request safely.",
    );
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const problem = z
      .object({ error: z.string().max(500), code: z.string().optional() })
      .safeParse(data);
    const message =
      response.status === 401
        ? "Your session expired. Sign in again before ordering."
        : response.status >= 500
          ? "Checkout is temporarily unavailable. Your cart is saved; retry uses the same request."
          : problem.success
            ? problem.data.error
            : "The order could not be placed. Review your details and try again.";
    throw new CheckoutError(
      message,
      response.status,
      response.status === 409
        ? problem.success && problem.data.code === "CHECKOUT_REJECTED"
        : [400, 401, 403, 404, 422].includes(response.status),
    );
  }
  const receipt = receiptSchema.safeParse(data);
  if (!receipt.success || ![200, 201].includes(response.status))
    throw new CheckoutError(
      "The server did not confirm a real order. Your cart is saved. Retry the same checkout request.",
    );
  return { success: true, order: receipt.data.order };
}

const checkoutProduct = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  img: z.string(),
  cpu: z.string(),
  gpu: z.string(),
  price: z.number().finite().positive(),
  stock: z.number().int().nonnegative(),
  status: z.literal("APPROVED"),
});
export type CheckoutProduct = z.infer<typeof checkoutProduct>;
export async function getCheckoutProduct(
  id: string,
  signal?: AbortSignal,
): Promise<CheckoutProduct> {
  let response: Response;
  try {
    response = await fetch(`/api/products/${encodeURIComponent(id)}`, {
      credentials: "same-origin",
      signal,
    });
  } catch {
    throw new CheckoutError("Could not load this laptop. Check your connection and try again.");
  }
  const product = checkoutProduct.safeParse(await response.json().catch(() => null));
  if (!response.ok || !product.success || product.data.id !== id)
    throw new CheckoutError(
      "This laptop is unavailable for checkout. Return to the store and refresh the catalog.",
    );
  if (product.data.stock < 1) throw new CheckoutError("This laptop is out of stock.");
  return product.data;
}
