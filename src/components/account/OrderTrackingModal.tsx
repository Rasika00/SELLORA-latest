import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Check, Clock, Package, RefreshCw, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import {
  asOrderRequestError,
  formatDeliveryDate,
  formatTrackingTime,
  getOrderTracking,
  trackingStatusLabel,
  type OrderRequestError,
  type OrderTracking,
} from "../../lib/api/order-tracking";

const actionClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50";

export function OrderRequestErrorNotice({
  error,
  onRetry,
}: {
  error: OrderRequestError;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
    >
      <div className="flex items-start gap-2 text-sm text-foreground">
        <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <p>{error.message}</p>
      </div>
      {error.kind === "session" ? (
        <a href="/login" className={actionClass}>
          Sign in again
        </a>
      ) : (
        <button type="button" onClick={onRetry} className={actionClass}>
          <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" /> Try again
        </button>
      )}
    </div>
  );
}

export function TrackingDetails({
  order,
  showActorInfo = false,
}: {
  order: OrderTracking;
  showActorInfo?: boolean;
}) {
  const stages = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
  const stageIndex = stages.indexOf(order.status);
  const cancelled = order.status === "CANCELLED";
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Current order status
          </p>
          <p
            className={`mt-1 flex items-center gap-2 font-display text-base font-bold ${cancelled ? "text-destructive" : "text-foreground"}`}
          >
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${cancelled ? "bg-destructive" : order.status === "DELIVERED" ? "bg-emerald-500" : "bg-primary"}`}
            />
            {trackingStatusLabel(order.status)}
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          <p>Order last updated</p>
          <time dateTime={order.updatedAt}>{formatTrackingTime(order.updatedAt)}</time>
        </div>
      </div>

      <section
        aria-label="Tracking progress"
        className="rounded-2xl border border-border bg-secondary/40 p-4 sm:p-6"
      >
        {cancelled ? (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" /> This order has been
            cancelled.
          </p>
        ) : stageIndex < 0 ? (
          <p className="text-sm text-muted-foreground">
            A progress timeline is not available for this status.
          </p>
        ) : (
          <>
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute left-[12.5%] right-[12.5%] top-4 h-0.5 bg-border"
              >
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(stageIndex / (stages.length - 1)) * 100}%` }}
                />
              </div>
              <ol
                className="relative grid grid-cols-4 gap-1 sm:gap-3"
                aria-label="Order progress steps"
              >
                {stages.map((stage, index) => (
                  <li
                    key={stage}
                    aria-current={stage === order.status ? "step" : undefined}
                    className="relative flex min-w-0 flex-col items-center gap-2 text-center"
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${index <= stageIndex ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"} ${index === stageIndex ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
                    >
                      {index < stageIndex ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <span
                      className={`text-[10px] font-semibold sm:text-xs ${index <= stageIndex ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {trackingStatusLabel(stage)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Progress reflects the current status. Recorded updates are shown below.
            </p>
          </>
        )}
      </section>

      <section
        aria-labelledby="delivery-details-title"
        className="rounded-2xl border border-border bg-secondary/40 p-4 sm:p-5"
      >
        <h4
          id="delivery-details-title"
          className="mb-4 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-primary"
        >
          <Truck aria-hidden="true" className="h-4 w-4" /> Delivery details
        </h4>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Courier</dt>
            <dd className="mt-1 break-words font-medium [overflow-wrap:anywhere]">
              {order.carrierName || "Not provided"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Tracking number</dt>
            <dd className="mt-1 break-words font-mono text-xs [overflow-wrap:anywhere]">
              {order.trackingNumber || "Not provided"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Estimated delivery</dt>
            <dd className="mt-1 font-medium">
              {order.estimatedDelivery ? (
                <time dateTime={order.estimatedDelivery}>
                  {formatDeliveryDate(order.estimatedDelivery)}
                </time>
              ) : (
                "Not provided"
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="tracking-history-title" className="space-y-4">
        <div>
          <h4
            id="tracking-history-title"
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-foreground"
          >
            <Clock aria-hidden="true" className="h-4 w-4 text-primary" /> Tracking history
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Oldest update first. Update times use your local time zone.
          </p>
        </div>
        {order.trackingEvents.length ? (
          <ol
            aria-label="Recorded tracking history"
            className="ml-2 space-y-5 border-l border-border pl-5"
          >
            {order.trackingEvents.map((event) => (
              <li key={event.id} className="relative min-w-0 space-y-1">
                <span
                  aria-hidden="true"
                  className={`absolute -left-[25px] top-1 h-2 w-2 rounded-full ${event.status === "CANCELLED" ? "bg-destructive" : "bg-primary"}`}
                />
                <p className="text-sm font-semibold text-foreground">
                  {trackingStatusLabel(event.status)}
                </p>
                <time
                  dateTime={event.createdAt}
                  className="block font-mono text-[11px] text-muted-foreground"
                >
                  {formatTrackingTime(event.createdAt)}
                </time>
                {event.note && (
                  <p className="whitespace-pre-wrap break-words pt-1 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                    {event.note}
                  </p>
                )}
                {showActorInfo && event.actorId !== undefined && (
                  <p className="break-words font-mono text-[10px] text-muted-foreground [overflow-wrap:anywhere]">
                    {event.actorId ? `Changed by: ${event.actorId}` : "Automatic update"}
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            <Package aria-hidden="true" className="h-5 w-5 shrink-0" />
            <p>No tracking updates have been recorded for this order yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}

type TrackingState = { orderId: string } & (
  | { status: "loading" }
  | { status: "ready"; order: OrderTracking }
  | { status: "error"; error: OrderRequestError }
);

function useOrderTracking(orderId: string, onLoaded?: (order: OrderTracking) => void) {
  const [state, setState] = useState<TrackingState>({ orderId, status: "loading" });
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setState({ orderId, status: "loading" });
    getOrderTracking(orderId, { signal: controller.signal })
      .then((order) => {
        if (!active) return;
        setState({ orderId, status: "ready", order });
        onLoaded?.(order);
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) return;
        setState({ orderId, status: "error", error: asOrderRequestError(error) });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [orderId, refresh, onLoaded]);
  const current: TrackingState = state.orderId === orderId ? state : { orderId, status: "loading" };
  const retry = () => setRefresh((value) => value + 1);
  return { current, retry };
}

// The team's inline pipeline and checkout confirmation use the same authenticated
// request, errors and real history as the existing tracking modal.
export function OrderTrackingPanel({
  orderId,
  onLoaded,
}: {
  orderId: string;
  onLoaded?: (order: OrderTracking) => void;
}) {
  const { current, retry } = useOrderTracking(orderId, onLoaded);
  return (
    <section
      aria-label="Live package tracking"
      aria-busy={current.status === "loading"}
      className="min-w-0 space-y-4"
    >
      {current.status === "loading" && <p role="status">Loading order tracking...</p>}
      {current.status === "error" && (
        <OrderRequestErrorNotice error={current.error} onRetry={retry} />
      )}
      {current.status === "ready" && (
        <>
          <TrackingDetails order={current.order} />
          <button type="button" onClick={retry} className={actionClass}>
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" /> Refresh tracking
          </button>
        </>
      )}
    </section>
  );
}

export function OrderTrackingModal({
  orderId,
  orderNumber,
  onClose,
  onLoaded,
  children,
}: {
  orderId: string;
  orderNumber: string;
  onClose: () => void;
  onLoaded?: (order: OrderTracking) => void;
  children?: ReactNode;
}) {
  const { current, retry } = useOrderTracking(orderId, onLoaded);
  const trigger = useRef(
    typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null,
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl grid-cols-1 gap-6 overflow-y-auto rounded-2xl border-border bg-card p-4 shadow-2xl sm:p-8"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.current?.focus();
        }}
      >
        <div className="flex min-w-0 items-start gap-3 border-b border-border pb-4 pr-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Truck aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <DialogTitle className="font-display text-base font-bold sm:text-lg">
              Order Tracking
            </DialogTitle>
            <p className="mt-1 break-words font-mono text-xs font-bold text-primary [overflow-wrap:anywhere]">
              {current.status === "ready" ? current.order.orderNumber : orderNumber}
            </p>
            <DialogDescription className="mt-1 text-xs">
              Current delivery details and recorded status updates.
            </DialogDescription>
          </div>
        </div>
        <div aria-busy={current.status === "loading"} className="min-w-0">
          {current.status === "loading" && (
            <div
              role="status"
              className="flex min-h-44 items-center justify-center gap-3 text-sm text-muted-foreground"
            >
              <RefreshCw aria-hidden="true" className="h-5 w-5 animate-spin text-primary" /> Loading
              order tracking...
            </div>
          )}
          {current.status === "error" && (
            <OrderRequestErrorNotice error={current.error} onRetry={retry} />
          )}
          {current.status === "ready" && (
            <div className="space-y-6">
              <TrackingDetails order={current.order} />
              {children}
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          {current.status === "ready" && (
            <button type="button" onClick={retry} className={actionClass}>
              <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" /> Refresh tracking
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Close tracking
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
