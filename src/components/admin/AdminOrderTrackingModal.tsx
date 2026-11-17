import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, RefreshCw, Save, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { OrderRequestErrorNotice, TrackingDetails } from "../account/OrderTrackingModal";
import {
  asOrderRequestError,
  getOrderTracking,
  ORDER_STATUSES,
  trackingStatusLabel,
  updateOrderTracking,
  type OrderRequestError,
  type OrderTracking,
  type OrderTrackingUpdate,
  type OrderTrackingUpdateResult,
} from "../../lib/api/order-tracking";
import {
  allowedNextStatuses,
  createTrackingDraft,
  hasTrackingChanges,
  prepareTrackingUpdate,
  type TrackingDraft,
} from "../../lib/admin-order-tracking";

const inputClass =
  "mt-1.5 w-full min-w-0 rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50";
const secondaryClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50";

export function AdminTrackingForm({
  order,
  draft,
  onChange,
  onSubmit,
  busy,
  blocked,
}: {
  order: OrderTracking;
  draft: TrackingDraft;
  onChange: (draft: TrackingDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  blocked: boolean;
}) {
  const id = useId();
  const allowed = allowedNextStatuses(order.status);
  const statusChanged = draft.status !== order.status;
  const disabled = busy || blocked;
  return (
    <form
      aria-label="Update order tracking"
      onSubmit={onSubmit}
      className="min-w-0 space-y-4 rounded-2xl border border-border bg-secondary/20 p-4 sm:p-5"
    >
      <h3 className="font-display text-base font-bold text-foreground">Update tracking</h3>
      <fieldset disabled={disabled} className="min-w-0 space-y-4">
        <div>
          <label htmlFor={`${id}-status`} className="text-xs font-semibold text-foreground">
            Order status
          </label>
          <select
            id={`${id}-status`}
            name="status"
            value={draft.status}
            disabled={disabled || allowed.length === 0}
            className={inputClass}
            onChange={(event) =>
              onChange({
                ...draft,
                status: event.target.value,
                note: event.target.value === order.status ? "" : draft.note,
              })
            }
          >
            {!ORDER_STATUSES.includes(order.status as (typeof ORDER_STATUSES)[number]) && (
              <option value={order.status}>{order.status} (current)</option>
            )}
            {ORDER_STATUSES.map((status) => (
              <option
                key={status}
                value={status}
                disabled={status !== order.status && !allowed.includes(status)}
              >
                {trackingStatusLabel(status)}
                {status === order.status ? " (current)" : ""}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {allowed.length
              ? `Allowed next: ${allowed.map(trackingStatusLabel).join(" or ")}.`
              : "This status cannot change. Delivery details can still be edited."}
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div>
            <label htmlFor={`${id}-courier`} className="text-xs font-semibold text-foreground">
              Courier name
            </label>
            <input
              id={`${id}-courier`}
              name="carrierName"
              maxLength={120}
              value={draft.carrierName}
              onChange={(event) => onChange({ ...draft, carrierName: event.target.value })}
              className={inputClass}
              placeholder="Optional courier name"
            />
          </div>
          <div>
            <label htmlFor={`${id}-number`} className="text-xs font-semibold text-foreground">
              Tracking number
            </label>
            <input
              id={`${id}-number`}
              name="trackingNumber"
              maxLength={160}
              value={draft.trackingNumber}
              onChange={(event) => onChange({ ...draft, trackingNumber: event.target.value })}
              className={inputClass}
              placeholder="Optional tracking number"
            />
          </div>
        </div>
        <div>
          <label htmlFor={`${id}-estimate`} className="text-xs font-semibold text-foreground">
            Estimated delivery date
          </label>
          <input
            id={`${id}-estimate`}
            name="estimatedDelivery"
            type="date"
            value={draft.estimatedDelivery}
            onChange={(event) => onChange({ ...draft, estimatedDelivery: event.target.value })}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Optional. Clear a field to remove its saved delivery detail.
          </p>
        </div>
        <div>
          <label htmlFor={`${id}-note`} className="text-xs font-semibold text-foreground">
            Tracking note
          </label>
          <textarea
            id={`${id}-note`}
            name="note"
            maxLength={2000}
            rows={3}
            disabled={disabled || !statusChanged}
            value={draft.note}
            onChange={(event) => onChange({ ...draft, note: event.target.value })}
            className={`${inputClass} resize-y`}
            placeholder="Optional note for this status change"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Notes are saved with a status change and are visible to the customer.
          </p>
        </div>
      </fieldset>
      {!statusChanged && (
        <p className="text-xs text-muted-foreground">
          Delivery-detail-only updates do not create a status-history event.
        </p>
      )}
      <button
        type="submit"
        disabled={disabled || !hasTrackingChanges(order, draft)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (
          <RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Save aria-hidden="true" className="h-4 w-4" />
        )}
        {busy ? "Saving tracking..." : "Save tracking changes"}
      </button>
    </form>
  );
}

export function AdminOrderTrackingModal({
  orderId,
  orderNumber,
  onClose,
  onUpdated,
}: {
  orderId: string;
  orderNumber: string;
  onClose: () => void;
  onUpdated: (order: OrderTrackingUpdateResult["order"]) => void;
}) {
  const [snapshot, setSnapshot] = useState<{ order: OrderTracking; draft: TrackingDraft } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [readError, setReadError] = useState<OrderRequestError | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [requiresReload, setRequiresReload] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "warning"; text: string } | null>(null);
  const alive = useRef(false);
  const writing = useRef(false);
  const read = useRef<{ version: number; controller?: AbortController }>({ version: 0 });
  const trigger = useRef(
    typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null,
  );
  const loadLatest = useCallback(async () => {
    read.current.controller?.abort();
    const controller = new AbortController();
    const version = ++read.current.version;
    read.current.controller = controller;
    setLoading(true);
    setReadError(null);
    setSnapshot(null);
    try {
      const order = await getOrderTracking(orderId, { signal: controller.signal });
      if (!alive.current || read.current.version !== version || controller.signal.aborted)
        return false;
      setSnapshot({ order, draft: createTrackingDraft(order) });
      setRequiresReload(false);
      onUpdated(order);
      return true;
    } catch (error) {
      if (alive.current && read.current.version === version && !controller.signal.aborted) {
        setReadError(asOrderRequestError(error));
        setRequiresReload(true);
      }
      return false;
    } finally {
      if (alive.current && read.current.version === version) setLoading(false);
    }
  }, [orderId, onUpdated]);
  useEffect(() => {
    alive.current = true;
    const request = read.current;
    void loadLatest();
    return () => {
      alive.current = false;
      request.version++;
      request.controller?.abort();
    };
  }, [loadLatest]);

  const refresh = async () => {
    if (writing.current) return;
    if (
      snapshot &&
      !requiresReload &&
      hasTrackingChanges(snapshot.order, snapshot.draft) &&
      !window.confirm("Discard unsaved tracking changes and reload?")
    )
      return;
    setWriteError(null);
    setNotice(null);
    await loadLatest();
  };
  const close = () => {
    if (writing.current) return;
    if (
      snapshot &&
      !requiresReload &&
      hasTrackingChanges(snapshot.order, snapshot.draft) &&
      !window.confirm("Discard unsaved tracking changes and close?")
    )
      return;
    onClose();
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!snapshot || writing.current || requiresReload) return;
    let update: OrderTrackingUpdate;
    try {
      update = prepareTrackingUpdate(snapshot.order, snapshot.draft);
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : "Check the tracking details.");
      return;
    }
    writing.current = true;
    setSaving(true);
    setWriteError(null);
    setNotice(null);
    try {
      const result = await updateOrderTracking(orderId, update);
      if (!alive.current) return;
      onUpdated(result.order);
      setNotice({
        kind: "success",
        text: "Update confirmed by the server. Refreshing tracking history...",
      });
      const loaded = await loadLatest();
      if (alive.current)
        setNotice({
          kind: "success",
          text: loaded
            ? result.historyCreated
              ? "Tracking updated. The status change is recorded in history."
              : "Update confirmed. No new status-history event was created."
            : "Update confirmed, but the latest history could not be loaded. Refresh tracking before another edit.",
        });
    } catch (error) {
      if (!alive.current) return;
      const problem = asOrderRequestError(error);
      if (problem.kind === "conflict") {
        setNotice({
          kind: "warning",
          text: "The order changed or this transition is no longer allowed. Loading the latest tracking...",
        });
        setRequiresReload(true);
        const loaded = await loadLatest();
        if (alive.current)
          setNotice({
            kind: "warning",
            text: loaded
              ? "Latest tracking loaded. Review it and retry your changes. Your previous draft was not resubmitted."
              : "Could not reload the latest tracking. Refresh tracking before retrying your changes.",
          });
      } else if (["session", "forbidden", "not-found"].includes(problem.kind)) {
        setSnapshot(null);
        setReadError(problem);
        setRequiresReload(true);
      } else {
        setWriteError(problem.message);
        if (problem.kind !== "invalid-input") {
          setRequiresReload(true);
          setNotice({
            kind: "warning",
            text: "The update was not confirmed. Refresh tracking before retrying so you can check the current saved state.",
          });
        }
      }
    } finally {
      writing.current = false;
      if (alive.current) setSaving(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        className="max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-5xl grid-cols-1 gap-5 overflow-y-auto rounded-2xl border-border bg-card p-4 text-foreground sm:p-6"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.current?.focus();
        }}
        onEscapeKeyDown={(event) => {
          if (writing.current) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (writing.current) event.preventDefault();
        }}
      >
        <div className="flex min-w-0 items-start gap-3 border-b border-border pb-4 pr-6">
          <Truck aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-primary" />
          <div className="min-w-0">
            <DialogTitle className="font-display">Manage order tracking</DialogTitle>
            <p className="mt-1 break-words font-mono text-xs text-primary [overflow-wrap:anywhere]">
              {snapshot?.order.orderNumber ?? orderNumber}
            </p>
            <DialogDescription className="mt-1 text-xs">
              Edit delivery details and record the next allowed status.
            </DialogDescription>
          </div>
        </div>
        {notice && (
          <div
            role="status"
            className={`flex min-w-0 items-start gap-2 rounded-xl border p-3 text-sm ${notice.kind === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-foreground"}`}
          >
            {notice.kind === "success" && (
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{notice.text}</p>
          </div>
        )}
        {writeError && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {writeError}
          </p>
        )}
        <div aria-busy={loading || saving} className="min-w-0">
          {loading && (
            <p
              role="status"
              className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin" /> Loading tracking...
            </p>
          )}
          {!loading && readError && (
            <OrderRequestErrorNotice error={readError} onRetry={() => void refresh()} />
          )}
          {!loading && snapshot && (
            <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-2">
              <AdminTrackingForm
                order={snapshot.order}
                draft={snapshot.draft}
                onChange={(draft) => {
                  setSnapshot({ ...snapshot, draft });
                  setNotice(null);
                  setWriteError(null);
                }}
                onSubmit={(event) => void save(event)}
                busy={saving}
                blocked={requiresReload}
              />
              <div className="min-w-0">
                <TrackingDetails order={snapshot.order} showActorInfo />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading || saving}
            className={secondaryClass}
          >
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" /> Refresh tracking
          </button>
          <button type="button" onClick={close} disabled={saving} className={secondaryClass}>
            Close tracking
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
