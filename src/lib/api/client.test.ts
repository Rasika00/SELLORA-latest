import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { safeParseJson, getCustomerOrders, createOrder, createProduct, loginUser } from "./client";
import { createOrder as keyedCreateOrder, CheckoutError } from "./checkout";
import { OrderRequestError } from "./order-tracking";

const originalFetch = globalThis.fetch;
const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (storageDescriptor) Object.defineProperty(globalThis, "localStorage", storageDescriptor);
  else Reflect.deleteProperty(globalThis, "localStorage");
});

test("team JSON helper preserves valid data and handles empty, HTML and malformed bodies", async () => {
  assert.deepEqual(await safeParseJson(new Response('{"ok":true}'), {}), { ok: true });
  for (const response of [
    new Response(null, { status: 204 }),
    new Response(" "),
    new Response("<html>proxy error</html>"),
    new Response("{"),
  ]) {
    assert.deepEqual(await safeParseJson(response, { unavailable: true }), { unavailable: true });
  }
});

test("client checkout export retains the keyed implementation and rejects an empty success response", async () => {
  assert.equal(createOrder, keyedCreateOrder);
  globalThis.fetch = async (_url, options) => {
    assert.equal(new Headers(options?.headers).get("Idempotency-Key"), "merge-test-key-0001");
    assert.equal(options?.credentials, "same-origin");
    return new Response("");
  };
  await assert.rejects(
    createOrder(
      {
        customerName: "Test",
        customerEmail: "test@example.test",
        shippingAddress: "Local",
        totalAmount: 100,
        items: [{ productId: "p1", quantity: 1, price: 100 }],
      },
      "merge-test-key-0001",
    ),
    CheckoutError,
  );
});

test("customer orders ignore local caches and client identity claims", async () => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: () => {
        throw Error("Private order reads must never consult a browser cache");
      },
    },
  });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/customer/orders");
    assert.equal(options?.credentials, "same-origin");
    return new Response("[]");
  };
  assert.deepEqual(
    await getCustomerOrders({ userId: "other-customer", email: "other@example.test" }),
    [],
  );
});

test("an expired customer list session remains an error instead of returning local orders", async () => {
  globalThis.fetch = async () => new Response("", { status: 401 });
  await assert.rejects(
    getCustomerOrders(),
    (error) => error instanceof OrderRequestError && error.kind === "session",
  );
});

test("malformed customer order responses remain explicit errors", async () => {
  globalThis.fetch = async () => new Response("<html>proxy error</html>");
  await assert.rejects(
    getCustomerOrders(),
    (error) => error instanceof OrderRequestError && error.kind === "invalid-response",
  );
});

test("empty successful product writes do not claim a product was created", async () => {
  globalThis.fetch = async () => new Response("");
  await assert.rejects(createProduct({ name: "Fixture" }), /Failed to create product/);
});

test("team JSON resilience keeps login rejection readable for empty error bodies", async () => {
  globalThis.fetch = async () => new Response("", { status: 401 });
  await assert.rejects(
    loginUser({ email: "test@example.test", password: "fixture-only" }),
    /Login failed/,
  );
});
