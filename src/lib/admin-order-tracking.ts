import {
  ORDER_STATUSES,
  type OrderStatus,
  type OrderTracking,
  type OrderTrackingUpdate,
} from "./api/order-tracking";

// UI guidance only. The backend independently checks every transition and permission.
export const ADMIN_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
export function allowedNextStatuses(status: string): readonly OrderStatus[] {
  return ORDER_STATUSES.includes(status as OrderStatus)
    ? ADMIN_STATUS_TRANSITIONS[status as OrderStatus]
    : [];
}
export type TrackingDraft = {
  status: string;
  carrierName: string;
  trackingNumber: string;
  estimatedDelivery: string;
  note: string;
};
export function createTrackingDraft(order: OrderTracking): TrackingDraft {
  return {
    status: order.status,
    carrierName: order.carrierName ?? "",
    trackingNumber: order.trackingNumber ?? "",
    estimatedDelivery: order.estimatedDelivery?.slice(0, 10) ?? "",
    note: "",
  };
}
export function hasTrackingChanges(order: OrderTracking, draft: TrackingDraft): boolean {
  const previous = createTrackingDraft(order);
  return (
    draft.status !== order.status ||
    draft.carrierName.trim() !== previous.carrierName ||
    draft.trackingNumber.trim() !== previous.trackingNumber ||
    draft.estimatedDelivery !== previous.estimatedDelivery
  );
}
export function prepareTrackingUpdate(
  order: OrderTracking,
  draft: TrackingDraft,
): OrderTrackingUpdate {
  const update: OrderTrackingUpdate = {};
  if (
    draft.carrierName.trim().length > 120 ||
    draft.trackingNumber.trim().length > 160 ||
    draft.note.trim().length > 2000
  ) {
    throw new Error(
      "Use up to 120 characters for the courier, 160 for the tracking number, and 2000 for the note.",
    );
  }
  if (draft.status !== order.status) {
    if (!allowedNextStatuses(order.status).includes(draft.status as OrderStatus))
      throw new Error("Choose an allowed next status.");
    update.status = draft.status as OrderStatus;
    if (draft.note.trim()) update.note = draft.note.trim();
  } else if (draft.note.trim()) throw new Error("A tracking note requires a status change.");
  const previous = createTrackingDraft(order);
  for (const key of ["carrierName", "trackingNumber"] as const) {
    if (draft[key].trim() !== previous[key]) update[key] = draft[key].trim() || null;
  }
  if (draft.estimatedDelivery !== previous.estimatedDelivery) {
    if (draft.estimatedDelivery) {
      const date = new Date(`${draft.estimatedDelivery}T00:00:00.000Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(draft.estimatedDelivery) ||
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== draft.estimatedDelivery
      )
        throw new Error("Choose a valid estimated delivery date.");
    }
    update.estimatedDelivery = draft.estimatedDelivery || null;
  }
  if (!Object.keys(update).length)
    throw new Error("Change a status or delivery detail before saving.");
  return update;
}
