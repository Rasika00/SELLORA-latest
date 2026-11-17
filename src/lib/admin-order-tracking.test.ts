import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { STATUS_TRANSITIONS } from "../../server/order-tracking";
import { adminTrackingOrder } from "../../tests/fixtures/admin-order-tracking";
import {
  ADMIN_STATUS_TRANSITIONS,
  allowedNextStatuses,
  createTrackingDraft,
  hasTrackingChanges,
  prepareTrackingUpdate,
} from "./admin-order-tracking";
import { getOrders, updateOrderStatus } from "./api/client";
import { getOrderTracking, OrderRequestError, updateOrderTracking } from "./api/order-tracking";

afterEach(() => mock.restoreAll());
const confirmed = (historyCreated = false) => {
  const { trackingEvents, ...order } = adminTrackingOrder;
  return { success: true, historyCreated, order };
};

test("admin transition guidance matches every backend rule", () => {
  assert.deepEqual(ADMIN_STATUS_TRANSITIONS, STATUS_TRANSITIONS);
  assert.deepEqual(allowedNextStatuses("UNKNOWN"), []);
  assert.deepEqual(allowedNextStatuses("toString"), []);
});

for (const from of Object.keys(STATUS_TRANSITIONS)) {
  test(`admin draft allows only legitimate transitions from ${from}`, () => {
    const order = { ...adminTrackingOrder, status: from };
    for (const to of Object.keys(STATUS_TRANSITIONS)) {
      const draft = { ...createTrackingDraft(order), status: to };
      const allowed = (
        STATUS_TRANSITIONS[from as keyof typeof STATUS_TRANSITIONS] as readonly string[]
      ).includes(to);
      if (from !== to && allowed) assert.equal(prepareTrackingUpdate(order, draft).status, to);
      else assert.throws(() => prepareTrackingUpdate(order, draft));
    }
  });
}

test("delivery-only updates omit both status and note", () => {
  const draft = {
    ...createTrackingDraft(adminTrackingOrder),
    carrierName: " Courier ",
    trackingNumber: " PKG-1 ",
    estimatedDelivery: "2026-11-20",
  };
  assert.deepEqual(prepareTrackingUpdate(adminTrackingOrder, draft), {
    carrierName: "Courier",
    trackingNumber: "PKG-1",
    estimatedDelivery: "2026-11-20",
  });
});
test("status updates include only changed fields and the optional customer-visible note", () => {
  const draft = {
    ...createTrackingDraft(adminTrackingOrder),
    status: "PROCESSING",
    note: " Packing started ",
  };
  assert.deepEqual(prepareTrackingUpdate(adminTrackingOrder, draft), {
    status: "PROCESSING",
    note: "Packing started",
  });
});
test("clearing saved delivery fields sends null rather than silently keeping old data", () => {
  const order = {
    ...adminTrackingOrder,
    carrierName: "Courier",
    trackingNumber: "PKG-1",
    estimatedDelivery: "2026-11-20T00:00:00.000Z",
  };
  assert.deepEqual(
    prepareTrackingUpdate(order, {
      ...createTrackingDraft(order),
      carrierName: "",
      trackingNumber: "",
      estimatedDelivery: "",
    }),
    { carrierName: null, trackingNumber: null, estimatedDelivery: null },
  );
});
test("unchanged form fields cannot trigger a write", () => {
  const draft = createTrackingDraft(adminTrackingOrder);
  assert.equal(hasTrackingChanges(adminTrackingOrder, draft), false);
  assert.throws(
    () => prepareTrackingUpdate(adminTrackingOrder, draft),
    /Change a status or delivery detail/,
  );
});
test("a saved delivery timestamp is preserved when its calendar date is unchanged", () => {
  const order = { ...adminTrackingOrder, estimatedDelivery: "2026-11-20T13:00:00.000Z" };
  const update = prepareTrackingUpdate(order, {
    ...createTrackingDraft(order),
    carrierName: "Courier",
  });
  assert.equal(update.estimatedDelivery, undefined);
});
for (const change of [
  { estimatedDelivery: "2026-02-30" },
  { estimatedDelivery: "tomorrow" },
  { carrierName: "x".repeat(121) },
  { trackingNumber: "x".repeat(161) },
  { status: "PROCESSING", note: "x".repeat(2001) },
  { note: "Note without a status change" },
]) {
  test(`invalid admin form input is rejected: ${Object.keys(change).join(", ")}`, () => {
    assert.throws(() =>
      prepareTrackingUpdate(adminTrackingOrder, {
        ...createTrackingDraft(adminTrackingOrder),
        ...change,
      }),
    );
  });
}
test("admin PATCH uses the existing authenticated endpoint and accepts the real response without history", async () => {
  let path;
  let options: RequestInit | undefined;
  mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    path = url;
    options = init;
    return Response.json(confirmed());
  });
  const result = await updateOrderTracking(adminTrackingOrder.id, { carrierName: "Courier" });
  assert.equal(path, `/api/orders/${adminTrackingOrder.id}/status`);
  assert.equal(options?.method, "PATCH");
  assert.equal(options?.credentials, "same-origin");
  assert.deepEqual(JSON.parse(String(options?.body)), { carrierName: "Courier" });
  assert.equal(result.historyCreated, false);
  assert.equal("trackingEvents" in result.order, false);
});
test("existing updateOrderStatus client delegates to the same PATCH endpoint", async () => {
  mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    assert.equal(url, `/api/orders/${adminTrackingOrder.id}/status`);
    assert.deepEqual(JSON.parse(String(options.body)), { status: "PROCESSING" });
    return Response.json(confirmed(true));
  });
  assert.equal(
    (await updateOrderStatus(adminTrackingOrder.id, "PROCESSING")).id,
    adminTrackingOrder.id,
  );
});
test("admin history preserves server-provided actor IDs without inventing actors", async () => {
  const event = { ...adminTrackingOrder.trackingEvents[0], actorId: "test-admin" };
  mock.method(globalThis, "fetch", async () =>
    Response.json({ success: true, order: { ...adminTrackingOrder, trackingEvents: [event] } }),
  );
  assert.equal(
    (await getOrderTracking(adminTrackingOrder.id)).trackingEvents[0].actorId,
    "test-admin",
  );
});
for (const [status, kind] of [
  [400, "invalid-input"],
  [401, "session"],
  [403, "forbidden"],
  [404, "not-found"],
  [409, "conflict"],
  [503, "unavailable"],
] as const) {
  test(`admin write HTTP ${status} is an actionable ${kind} error`, async () => {
    mock.method(globalThis, "fetch", async () =>
      Response.json({ error: "internal database detail" }, { status }),
    );
    await assert.rejects(
      updateOrderTracking(adminTrackingOrder.id, { status: "PROCESSING" }),
      (error) =>
        error instanceof OrderRequestError && error.status === status && error.kind === kind,
    );
  });
}
test("network and malformed-success responses never confirm a tracking update", async () => {
  mock.method(globalThis, "fetch", async () => {
    throw new TypeError("offline");
  });
  await assert.rejects(
    updateOrderTracking(adminTrackingOrder.id, { carrierName: "Courier" }),
    OrderRequestError,
  );
  mock.method(globalThis, "fetch", async () =>
    Response.json({ ...confirmed(), historyCreated: undefined }),
  );
  await assert.rejects(
    updateOrderTracking(adminTrackingOrder.id, { carrierName: "Courier" }),
    (error) => error instanceof OrderRequestError && error.kind === "invalid-response",
  );
});
for (const status of [401, 403, 503]) {
  test(`admin listing HTTP ${status} is not silently converted into an empty order list`, async () => {
    mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
      assert.equal(url, "/api/orders");
      assert.equal(options.credentials, "same-origin");
      return Response.json({ error: "denied" }, { status });
    });
    await assert.rejects(
      getOrders(),
      (error) => error instanceof OrderRequestError && error.status === status,
    );
  });
}
