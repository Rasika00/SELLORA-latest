// Synthetic admin fixtures used only by tests, never imported by application code.
import type { OrderTracking } from "../../src/lib/api/order-tracking";
import type { AdminOrderRecord } from "../../src/lib/api/client";
import { trackingOrder, customerOrder } from "./order-tracking";

export const adminTrackingOrder: OrderTracking = {
  ...trackingOrder,
  status: "PENDING",
  carrierName: null,
  trackingNumber: null,
  estimatedDelivery: null,
  updatedAt: trackingOrder.createdAt,
  trackingEvents: [{ ...trackingOrder.trackingEvents[0], actorId: null }],
};
export const adminOrder: AdminOrderRecord = {
  ...customerOrder,
  status: "PENDING",
  carrierName: null,
  trackingNumber: null,
  estimatedDelivery: null,
};
