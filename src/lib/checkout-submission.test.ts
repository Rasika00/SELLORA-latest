import assert from "node:assert/strict";
import { test } from "node:test";
import { CheckoutSubmission } from "./checkout-submission";
import { CheckoutError, type CreateOrderPayload } from "./api/checkout";
const payload: CreateOrderPayload = {
  customerName: "Buyer",
  customerEmail: "buyer@example.test",
  shippingAddress: "Local",
  totalAmount: 100,
  items: [{ productId: "p1", quantity: 1, price: 100 }],
};
const receipt = {
  success: true as const,
  order: { id: "real-order", orderNumber: "ORD-REAL", totalAmount: 100 },
};
function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
    values,
  };
}
test("rapid double submission sends exactly one order request and confirmed form never resubmits", async () => {
  let requests = 0,
    release!: () => void,
    sent!: () => void;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    sent = resolve;
  });
  const controller = new CheckoutSubmission(async () => {
    requests++;
    sent();
    await hold;
    return receipt;
  }, storage());
  const first = controller.submit(payload);
  assert.equal(await controller.submit(payload), null);
  await started;
  assert.equal(requests, 1);
  release();
  assert.deepEqual(await first, receipt.order);
  assert.equal(await controller.submit(payload), null);
  assert.equal(requests, 1);
});
test("ambiguous network failure retains the same key across a reload and retry", async () => {
  const saved = storage();
  const keys: string[] = [];
  const first = new CheckoutSubmission(async (_p, key) => {
    keys.push(key);
    throw new CheckoutError("Unconfirmed");
  }, saved);
  await assert.rejects(first.submit(payload), CheckoutError);
  const restored = new CheckoutSubmission(async (_p, key) => {
    keys.push(key);
    return receipt;
  }, saved);
  await restored.submit(payload);
  assert.equal(keys[0], keys[1]);
  assert.equal(saved.values.size, 0);
});

for (const reload of [false, true]) {
  test(`lost response -> 401 -> same customer login -> retry creates one order${reload ? " with page reloads" : ""}`, async () => {
    const signedPayload = { ...payload, requireSession: true };
    const saved = storage();
    const orders = new Map<string, typeof receipt.order>();
    const keys: string[] = [];
    let authenticated = true;
    let loseResponse = true;
    const send = async (_payload: CreateOrderPayload, key: string) => {
      keys.push(key);
      if (!authenticated) throw new CheckoutError("Session expired", 401);
      // Simulate a durable server record scoped to the same authenticated buyer.
      const scopedKey = `customer-a:${key}`;
      if (!orders.has(scopedKey))
        orders.set(scopedKey, { ...receipt.order, id: `order-${orders.size + 1}` });
      if (loseResponse) {
        loseResponse = false;
        throw new CheckoutError("Response lost after commit");
      }
      return { success: true as const, order: orders.get(scopedKey)! };
    };
    let controller = new CheckoutSubmission(send, saved);
    await assert.rejects(controller.submit(signedPayload), /Response lost/);
    assert.equal(orders.size, 1);
    const originalPending = saved.getItem("sellora_pending_checkout");
    if (reload) controller = new CheckoutSubmission(send, saved);
    authenticated = false;
    await assert.rejects(
      controller.submit(signedPayload),
      (error) => error instanceof CheckoutError && error.status === 401,
    );
    assert.equal(saved.getItem("sellora_pending_checkout"), originalPending);
    if (reload) controller = new CheckoutSubmission(send, saved);
    authenticated = true;
    const confirmed = await controller.submit(signedPayload);
    assert.equal(confirmed?.id, "order-1");
    assert.equal(orders.size, 1);
    assert.equal(new Set(keys).size, 1);
    assert.equal(saved.values.size, 0);
    assert.equal(await controller.submit(signedPayload), null);
  });
}

test("a first 401 preserves the original key for login and retry", async () => {
  const signedPayload = { ...payload, requireSession: true };
  const saved = storage();
  const keys: string[] = [];
  let authenticated = false;
  const send = async (_payload: CreateOrderPayload, key: string) => {
    keys.push(key);
    if (!authenticated) throw new CheckoutError("Session expired", 401);
    return receipt;
  };
  await assert.rejects(new CheckoutSubmission(send, saved).submit(signedPayload));
  assert.equal(saved.values.size, 1);
  authenticated = true;
  await new CheckoutSubmission(send, saved).submit(signedPayload);
  assert.equal(keys[0], keys[1]);
  assert.equal(saved.values.size, 0);
});
test("changed details cannot silently create a second order while the first outcome is unknown", async () => {
  const saved = storage();
  let calls = 0;
  const controller = new CheckoutSubmission(async () => {
    calls++;
    throw new CheckoutError("Unconfirmed");
  }, saved);
  await assert.rejects(controller.submit(payload));
  await assert.rejects(
    controller.submit({ ...payload, shippingAddress: "Different" }),
    /previous checkout is unconfirmed/,
  );
  assert.equal(calls, 1);
  const restored = new CheckoutSubmission(async () => {
    calls++;
    return receipt;
  }, saved);
  await assert.rejects(
    restored.submit({ ...payload, totalAmount: 200 }),
    /previous checkout is unconfirmed/,
  );
  assert.equal(calls, 1);
});
test("definite stock rejection allows corrected details with a new request key", async () => {
  const keys: string[] = [];
  let first = true;
  const controller = new CheckoutSubmission(async (_p, key) => {
    keys.push(key);
    if (first) {
      first = false;
      throw new CheckoutError("Stock changed", 409, true);
    }
    return receipt;
  }, storage());
  await assert.rejects(controller.submit(payload));
  await controller.submit({ ...payload, shippingAddress: "Updated" });
  assert.notEqual(keys[0], keys[1]);
});
test("storage contains only a fingerprint and opaque key, never contact/shipping data", async () => {
  const saved = storage();
  const controller = new CheckoutSubmission(async () => {
    throw new CheckoutError("Unconfirmed");
  }, saved);
  await assert.rejects(controller.submit(payload));
  const data = [...saved.values.values()][0];
  assert(!data.includes(payload.customerEmail));
  assert(!data.includes(payload.shippingAddress));
  assert.deepEqual(Object.keys(JSON.parse(data)).sort(), ["fingerprint", "key"]);
});

test("an ambiguous 409 retains the request key to reconcile a concurrent committed order", async () => {
  const keys: string[] = [];
  let first = true;
  const controller = new CheckoutSubmission(async (_payload, key) => {
    keys.push(key);
    if (first) {
      first = false;
      throw new CheckoutError("Retry the same request", 409);
    }
    return receipt;
  }, storage());
  await assert.rejects(controller.submit(payload));
  await controller.submit(payload);
  assert.equal(keys[0], keys[1]);
});
test("disabled browser storage blocks checkout before an unrecoverable order request", async () => {
  const broken = {
    getItem: () => {
      throw new Error("disabled");
    },
    setItem: () => {
      throw new Error("disabled");
    },
    removeItem: () => {
      throw new Error("disabled");
    },
  };
  let calls = 0;
  const controller = new CheckoutSubmission(async () => {
    calls++;
    return receipt;
  }, broken);
  await assert.rejects(controller.submit(payload), /session storage/);
  assert.equal(calls, 0);
});

test("a storage write failure or corrupt pending state never sends an order", async () => {
  let calls = 0;
  const send = async () => {
    calls++;
    return receipt;
  };
  const failure = {
    getItem: () => null,
    setItem: () => {
      throw new Error("quota");
    },
    removeItem: () => {},
  };
  await assert.rejects(new CheckoutSubmission(send, failure).submit(payload), /session storage/);
  const corrupt = storage();
  corrupt.setItem("sellora_pending_checkout", "invalid-json");
  await assert.rejects(
    new CheckoutSubmission(send, corrupt).submit(payload),
    /Saved checkout state/,
  );
  assert.equal(calls, 0);
});
