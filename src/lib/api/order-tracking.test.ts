import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { trackingOrder } from "../../../tests/fixtures/order-tracking";
import { getCustomerOrders } from "./client";
import {
  formatDeliveryDate,
  getOrderTracking,
  OrderRequestError,
  trackingStatusLabel,
} from "./order-tracking";

afterEach(() => {
  mock.restoreAll();
  mock.timers.reset();
});
const response = (order: unknown = trackingOrder) => Response.json({ success: true, order });

test("tracking uses only the order ID and sends the same-origin session cookie", async () => {
  let path;
  let options: RequestInit | undefined;
  mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    path = url;
    options = init;
    return response();
  });
  assert.deepEqual(await getOrderTracking(trackingOrder.id), trackingOrder);
  assert.equal(path, `/api/orders/${trackingOrder.id}/tracking`);
  assert.equal(options?.credentials, "same-origin");
  assert.equal(options?.cache, "no-store");
  assert(options?.signal instanceof AbortSignal);
  assert.equal(String(path).includes("email"), false);
  assert.equal(String(path).includes("userId"), false);
});

test("customer list requests ignore caller-supplied identity and propagate session errors", async () => {
  let path;
  mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    path = url;
    assert.equal(options.credentials, "same-origin");
    return Response.json({ error: "expired" }, { status: 401 });
  });
  await assert.rejects(
    getCustomerOrders({ userId: "other-customer", email: "other@example.test" }),
    (error) => error instanceof OrderRequestError && error.kind === "session",
  );
  assert.equal(path, "/api/customer/orders");
});

test("history remains real, sorted chronologically, with no invented events", async () => {
  mock.method(globalThis, "fetch", async () =>
    response({ ...trackingOrder, trackingEvents: [...trackingOrder.trackingEvents].reverse() }),
  );
  const order = await getOrderTracking(trackingOrder.id);
  assert.deepEqual(order.trackingEvents, trackingOrder.trackingEvents);
  mock.method(globalThis, "fetch", async () => response({ ...trackingOrder, trackingEvents: [] }));
  assert.deepEqual((await getOrderTracking(trackingOrder.id)).trackingEvents, []);
});

test("missing optional courier details become absent values rather than fake shipping data", async () => {
  const { carrierName, trackingNumber, estimatedDelivery, ...withoutDelivery } = trackingOrder;
  mock.method(globalThis, "fetch", async () => response(withoutDelivery));
  const order = await getOrderTracking(trackingOrder.id);
  assert.equal(order.carrierName, null);
  assert.equal(order.trackingNumber, null);
  assert.equal(order.estimatedDelivery, null);
});

for (const [status, kind] of [
  [401, "session"],
  [403, "forbidden"],
  [404, "not-found"],
  [500, "unavailable"],
  [503, "unavailable"],
] as const) {
  test(`HTTP ${status} produces a clear ${kind} error instead of fake data`, async () => {
    mock.method(globalThis, "fetch", async () =>
      Response.json({ error: "Internal database / AUTH_SECRET details" }, { status }),
    );
    await assert.rejects(getOrderTracking(trackingOrder.id), (error) => {
      assert(error instanceof OrderRequestError);
      assert.equal(error.kind, kind);
      assert.equal(error.status, status);
      assert.doesNotMatch(error.message, /AUTH_SECRET|database/);
      return true;
    });
  });
}

test("network failure does not fall back to cached or invented tracking", async () => {
  mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(
    getOrderTracking(trackingOrder.id),
    (error) => error instanceof OrderRequestError && error.kind === "network",
  );
});

for (const invalid of [
  { ...trackingOrder, id: "another-order" },
  { ...trackingOrder, trackingEvents: undefined },
  { ...trackingOrder, updatedAt: "not-a-date" },
  {
    ...trackingOrder,
    trackingEvents: [{ ...trackingOrder.trackingEvents[0], createdAt: "invalid" }],
  },
  { ...trackingOrder, status: "" },
]) {
  test(`invalid API data is rejected: ${JSON.stringify(invalid).slice(0, 80)}`, async () => {
    mock.method(globalThis, "fetch", async () => response(invalid));
    await assert.rejects(
      getOrderTracking(trackingOrder.id),
      (error) => error instanceof OrderRequestError && error.kind === "invalid-response",
    );
  });
}

test("HTML or invalid JSON error pages cannot become tracking data", async () => {
  mock.method(globalThis, "fetch", async () => new Response("<html>not JSON</html>"));
  await assert.rejects(
    getOrderTracking(trackingOrder.id),
    (error) => error instanceof OrderRequestError && error.kind === "invalid-response",
  );
});

test("closing a modal can cancel its pending request", async () => {
  mock.method(
    globalThis,
    "fetch",
    (_url: string, options: RequestInit) =>
      new Promise((_resolve, reject) => {
        options.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      }),
  );
  const controller = new AbortController();
  const pending = getOrderTracking(trackingOrder.id, { signal: controller.signal });
  controller.abort();
  await assert.rejects(
    pending,
    (error) => error instanceof DOMException && error.name === "AbortError",
  );
});

test("slow requests time out and offer retry instead of loading forever", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  mock.method(
    globalThis,
    "fetch",
    (_url: string, options: RequestInit) =>
      new Promise((_resolve, reject) => {
        options.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      }),
  );
  const pending = getOrderTracking(trackingOrder.id);
  context.mock.timers.tick(15000);
  await assert.rejects(
    pending,
    (error) => error instanceof OrderRequestError && error.kind === "timeout",
  );
});

test("unknown future statuses retain their actual label", () => {
  assert.equal(trackingStatusLabel("AWAITING_PICKUP"), "AWAITING_PICKUP");
});

test("date-only delivery estimates retain their recorded calendar day", () => {
  assert.equal(
    formatDeliveryDate("2026-11-20T00:00:00.000Z"),
    new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date("2026-11-20T00:00:00.000Z")),
  );
});
