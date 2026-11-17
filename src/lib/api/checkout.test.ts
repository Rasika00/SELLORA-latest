import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { CheckoutError, createOrder, getCheckoutProduct } from "./checkout";

const original = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = original;
});
const payload = {
  customerName: "Local Buyer",
  customerEmail: "buyer@example.test",
  shippingAddress: "Test address",
  totalAmount: 100,
  items: [{ productId: "p1", quantity: 1, price: 100 }],
};
const receipt = {
  success: true,
  order: { id: "order-real", orderNumber: "ORD-REAL", totalAmount: 100 },
};
test("only a confirmed backend receipt succeeds; same-origin cookie and request key are sent", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/orders");
    assert.equal(options?.credentials, "same-origin");
    assert.equal(new Headers(options?.headers).get("Idempotency-Key"), "test-request-key-0001");
    assert.deepEqual(JSON.parse(String(options?.body)), payload);
    return new Response(JSON.stringify(receipt), { status: 201 });
  };
  assert.deepEqual(await createOrder(payload, "test-request-key-0001"), receipt);
});
test("idempotent backend replay (200) is a confirmed receipt", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ ...receipt, replayed: true }));
  assert.equal((await createOrder(payload, "test-request-key-0001")).order.id, "order-real");
});
for (const status of [400, 401, 403, 409, 500, 503]) {
  test(`HTTP ${status} rejects instead of generating a receipt`, async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: "Stock unavailable" }), { status });
    await assert.rejects(
      createOrder(payload, "test-request-key-0001"),
      (e) => e instanceof CheckoutError && e.status === status,
    );
  });
}
for (const [name, data] of [
  ["missing database ID", { success: true, order: { orderNumber: "ORD-FAKE", totalAmount: 100 } }],
  ["offline fallback", { ...receipt, offline: true }],
  ["unsuccessful response", { ...receipt, success: false }],
  ["invalid response", null],
] as const) {
  test(`${name} cannot display checkout success`, async () => {
    globalThis.fetch = async () => new Response(JSON.stringify(data));
    await assert.rejects(createOrder(payload, "test-request-key-0001"), CheckoutError);
  });
}
test("network/timeout errors stay unconfirmed and instruct safe retry", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("fixture network interruption");
  };
  await assert.rejects(
    createOrder(payload, "test-request-key-0001"),
    (e) => e instanceof CheckoutError && e.message.includes("same request"),
  );
});

test("stock rejection is definite but a generic 409 keeps the checkout outcome unconfirmed", async () => {
  for (const code of ["CHECKOUT_REJECTED", undefined]) {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: "Checkout conflict", code }), { status: 409 });
    await assert.rejects(
      createOrder(payload, "test-request-key-0001"),
      (error) =>
        error instanceof CheckoutError && error.definitive === (code === "CHECKOUT_REJECTED"),
    );
  }
});
test("Buy Now fetches a real approved in-stock product without static catalog fallback", async () => {
  globalThis.fetch = async (url) => {
    assert.equal(url, "/api/products/dynamic-id");
    return new Response(
      JSON.stringify({
        id: "dynamic-id",
        name: "Dynamic Laptop",
        img: "/logo.png",
        cpu: "Test CPU",
        gpu: "Test GPU",
        price: 100,
        stock: 1,
        status: "APPROVED",
      }),
    );
  };
  assert.equal((await getCheckoutProduct("dynamic-id")).id, "dynamic-id");
});
for (const patch of [
  { stock: 0 },
  { status: "PENDING_APPROVAL" },
  { id: "another-id" },
  { stock: undefined },
]) {
  test(`Buy Now rejects unavailable/mismatched product ${JSON.stringify(patch)}`, async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          id: "p1",
          name: "Laptop",
          img: "/logo.png",
          cpu: "CPU",
          gpu: "GPU",
          price: 100,
          stock: 1,
          status: "APPROVED",
          ...patch,
        }),
      );
    await assert.rejects(getCheckoutProduct("p1"), CheckoutError);
  });
}
