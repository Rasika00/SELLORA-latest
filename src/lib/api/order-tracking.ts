import { z } from "zod";

export type OrderRequestErrorKind =
  | "session"
  | "forbidden"
  | "not-found"
  | "unavailable"
  | "network"
  | "timeout"
  | "invalid-response";

const errorMessages: Record<OrderRequestErrorKind, string> = {
  session: "Your session has expired or you are signed out. Sign in again to view your orders.",
  forbidden: "You do not have permission to view this order.",
  "not-found": "This order could not be found or you do not have access to it.",
  unavailable: "Order information is temporarily unavailable. Please try again later.",
  network: "We could not load your order information. Check your connection and try again.",
  timeout: "The request took too long. Please try again.",
  "invalid-response": "We could not read the order information. Please try again.",
};

export class OrderRequestError extends Error {
  constructor(
    public kind: OrderRequestErrorKind,
    public status: number | null = null,
  ) {
    super(errorMessages[kind]);
    this.name = "OrderRequestError";
  }
}

export function asOrderRequestError(error: unknown): OrderRequestError {
  return error instanceof OrderRequestError ? error : new OrderRequestError("network");
}

// Keep private reads on the existing same-origin /api proxy. No client identity claims.
export async function requestOrderJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  let timedOut = false;
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 15000);
  try {
    const response = await fetch(`/api${path}`, {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      const kind =
        response.status === 401
          ? "session"
          : response.status === 403
            ? "forbidden"
            : response.status === 404
              ? "not-found"
              : "unavailable";
      throw new OrderRequestError(kind, response.status);
    }
    try {
      return await response.json();
    } catch (error) {
      if (controller.signal.aborted) throw error;
      throw new OrderRequestError("invalid-response", response.status);
    }
  } catch (error) {
    if (signal?.aborted) throw new DOMException("Request cancelled", "AbortError");
    if (timedOut) throw new OrderRequestError("timeout");
    throw asOrderRequestError(error);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}

const timestamp = z.string().datetime({ offset: true });
const nullableText = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value?.trim() || null);
const trackingEvent = z.object({
  id: z.string().min(1),
  status: z.string().min(1),
  note: nullableText,
  createdAt: timestamp,
});
const trackingOrder = z.object({
  id: z.string().min(1),
  orderNumber: z.string().min(1),
  status: z.string().min(1),
  carrierName: nullableText,
  trackingNumber: nullableText,
  estimatedDelivery: timestamp
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  createdAt: timestamp,
  updatedAt: timestamp,
  trackingEvents: z.array(trackingEvent),
});
const trackingResponse = z.object({ success: z.literal(true), order: trackingOrder });

export type OrderTrackingEvent = z.infer<typeof trackingEvent>;
export type OrderTracking = z.infer<typeof trackingOrder>;

export async function getOrderTracking(
  orderId: string,
  options: { signal?: AbortSignal } = {},
): Promise<OrderTracking> {
  if (!orderId.trim()) throw new OrderRequestError("not-found", 404);
  const response = await requestOrderJson(
    `/orders/${encodeURIComponent(orderId)}/tracking`,
    options.signal,
  );
  const result = trackingResponse.safeParse(response);
  if (!result.success || result.data.order.id !== orderId)
    throw new OrderRequestError("invalid-response");
  return {
    ...result.data.order,
    trackingEvents: [...result.data.order.trackingEvents].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id),
    ),
  };
}

export const trackingStatusLabel = (status: string): string =>
  ({
    PENDING: "Order placed",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  })[status] || status;

export function formatTrackingTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}

// Date-only estimates are stored as UTC midnight by the backend. Do not shift their calendar day.
export function formatDeliveryDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
