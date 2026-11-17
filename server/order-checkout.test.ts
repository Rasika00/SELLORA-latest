import assert from "node:assert/strict";
import { test } from "node:test";
import { Prisma, type PrismaClient } from "@prisma/client";
import { ApiError, type AuthUser } from "./auth";
import { createCheckoutOrder } from "./order-checkout";

const buyer: AuthUser = { id: "buyer", role: "customer", isActive: true, sellerStatus: "NONE" };
const payload = {
  customerName: "Test Buyer",
  customerEmail: "buyer@example.test",
  shippingAddress: "Local test address",
  totalAmount: 100,
  items: [{ productId: "p1", quantity: 1, price: 100 }],
};
type Product = { id: string; stock: number; price: number; status: string };
type Write = {
  id?: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: string;
  city: string | null;
  zipCode: string | null;
  totalAmount: number;
  status: string;
  items: { create: { productId: string; quantity: number; price: number }[] };
  trackingEvents: { create: { status: string; actorId: string | null } };
};
type Saved = Omit<Write, "items" | "trackingEvents"> & {
  id: string;
  items: { productId: string; quantity: number; price: number; product: Product }[];
};
function database(
  options: {
    stock?: number;
    failUpdateAt?: number;
    failCreate?: boolean;
    failCommit?: boolean;
    conditionalMiss?: boolean;
  } = {},
) {
  let state = {
    products: [
      { id: "p1", stock: options.stock ?? 5, price: 100, status: "APPROVED" },
      { id: "p2", stock: 5, price: 50, status: "APPROVED" },
    ] as Product[],
    orders: [] as Saved[],
    events: [] as { orderId: string; status: string; actorId: string | null }[],
  };
  let version = 0,
    updateAttempts = 0,
    createAttempts = 0;
  const knownError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError("fixture transaction conflict", {
      code,
      clientVersion: "6.19.3",
    });
  const db = {
    order: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        structuredClone(state.orders.find((o) => o.id === where.id) || null),
    },
    $transaction: async (
      fn: (tx: unknown) => Promise<unknown>,
      config: { isolationLevel: string },
    ) => {
      assert.equal(config.isolationLevel, "Serializable");
      const readVersion = version;
      const draft = structuredClone(state);
      const tx = {
        product: {
          findMany: async ({ where }: { where: { id: { in: string[] } } }) =>
            structuredClone(draft.products.filter((p) => where.id.in.includes(p.id))),
          updateMany: async ({
            where,
            data,
          }: {
            where: { id: string; status: string; price: number; stock: { gte: number } };
            data: { stock: { decrement: number } };
          }) => {
            updateAttempts++;
            if (updateAttempts === options.failUpdateAt)
              throw new Error("fixture inventory failure");
            const p = draft.products.find(
              (p) =>
                p.id === where.id &&
                p.status === where.status &&
                p.price === where.price &&
                p.stock >= where.stock.gte,
            );
            if (!p || options.conditionalMiss) return { count: 0 };
            p.stock -= data.stock.decrement;
            return { count: 1 };
          },
        },
        order: {
          findUnique: async ({ where }: { where: { id: string } }) =>
            draft.orders.find((o) => o.id === where.id) || null,
          create: async ({ data }: { data: Write }) => {
            createAttempts++;
            if (options.failCreate) throw new Error("fixture order/event write failure");
            const id = data.id || `order-${draft.orders.length + 1}`;
            const saved: Saved = {
              ...data,
              id,
              items: data.items.create.map((i) => ({
                ...i,
                product: draft.products.find((p) => p.id === i.productId)!,
              })),
            };
            draft.orders.push(saved);
            draft.events.push({ orderId: id, ...data.trackingEvents.create });
            return structuredClone(saved);
          },
        },
      };
      const result = await fn(tx);
      if (options.failCommit) throw new Error("fixture commit failure");
      // Optimistic transaction fixture: concurrent snapshots cannot both commit.
      if (version !== readVersion) throw knownError("P2034");
      state = draft;
      version++;
      return result;
    },
  } as unknown as PrismaClient;
  return {
    db,
    snapshot: () => structuredClone(state),
    attempts: () => ({ updateAttempts, createAttempts }),
  };
}
const rejectsStatus = (code: number) => (error: unknown) =>
  error instanceof ApiError && error.statusCode === code;

test("checkout atomically commits stock, authoritative prices, item and authenticated initial history", async () => {
  const fixture = database();
  const result = await createCheckoutOrder(
    fixture.db,
    { ...payload, userId: "forged", actorId: "forged", role: "admin" },
    buyer,
  );
  assert.equal(result.replayed, false);
  assert.equal(result.order.userId, buyer.id);
  assert.equal(result.order.totalAmount, 100);
  const state = fixture.snapshot();
  assert.equal(state.products[0].stock, 4);
  assert.equal(state.orders.length, 1);
  assert.deepEqual(state.events, [
    { orderId: result.order.id, status: "PENDING", actorId: buyer.id },
  ]);
});
test("guest checkout ignores claimed identity; cached signed-in checkout requires a real session", async () => {
  const fixture = database();
  const result = await createCheckoutOrder(fixture.db, { ...payload, userId: buyer.id });
  assert.equal(result.order.userId, null);
  assert.equal(fixture.snapshot().events[0].actorId, null);
  await assert.rejects(
    createCheckoutOrder(fixture.db, { ...payload, requireSession: true }),
    rejectsStatus(401),
  );
  assert.equal(fixture.snapshot().orders.length, 1);
});
test("server computes prices/totals when legacy quotes are omitted", async () => {
  const fixture = database();
  const result = await createCheckoutOrder(
    fixture.db,
    { ...payload, totalAmount: undefined, items: [{ productId: "p1", quantity: 2 }] },
    buyer,
  );
  assert.equal(result.order.totalAmount, 200);
  assert.equal(result.order.items[0].price, 100);
});
for (const [name, body] of [
  ["zero quantity", { ...payload, items: [{ productId: "p1", quantity: 0, price: 100 }] }],
  ["negative quantity", { ...payload, items: [{ productId: "p1", quantity: -1, price: 100 }] }],
  ["fractional quantity", { ...payload, items: [{ productId: "p1", quantity: 1.5, price: 100 }] }],
  ["missing shipping address", { ...payload, shippingAddress: " " }],
  ["invalid contact", { ...payload, customerEmail: "invalid" }],
  ["empty items", { ...payload, items: [] }],
] as const) {
  test(`invalid checkout ${name} cannot write stock/order/history`, async () => {
    const fixture = database();
    await assert.rejects(createCheckoutOrder(fixture.db, body, buyer), rejectsStatus(400));
    assert.deepEqual(fixture.attempts(), { updateAttempts: 0, createAttempts: 0 });
    assert.equal(fixture.snapshot().events.length, 0);
  });
}
test("tampered price and total are rejected before reserving stock", async () => {
  for (const body of [
    { ...payload, totalAmount: 1 },
    { ...payload, items: [{ productId: "p1", quantity: 1, price: 1 }] },
  ]) {
    const fixture = database();
    await assert.rejects(createCheckoutOrder(fixture.db, body, buyer), rejectsStatus(409));
    assert.equal(fixture.snapshot().products[0].stock, 5);
    assert.equal(fixture.attempts().updateAttempts, 0);
  }
});
test("duplicate product lines aggregate quantity and cannot evade stock checks", async () => {
  const fixture = database({ stock: 1 });
  await assert.rejects(
    createCheckoutOrder(
      fixture.db,
      { ...payload, totalAmount: 200, items: [payload.items[0], payload.items[0]] },
      buyer,
    ),
    rejectsStatus(409),
  );
  assert.equal(fixture.snapshot().products[0].stock, 1);
  assert.equal(fixture.snapshot().orders.length, 0);
});
for (const [name, options] of [
  ["insufficient stock", { stock: 0 }],
  ["conditional stock update lost", { conditionalMiss: true }],
] as const) {
  test(`${name} cannot leave an order or successful tracking event`, async () => {
    const fixture = database(options);
    await assert.rejects(createCheckoutOrder(fixture.db, payload, buyer), rejectsStatus(409));
    assert.equal(fixture.snapshot().orders.length, 0);
    assert.equal(fixture.snapshot().events.length, 0);
    assert.equal(fixture.snapshot().products[0].stock, options.stock ?? 5);
  });
}
for (const [name, options] of [
  ["inventory failure after another product was reserved", { failUpdateAt: 2 }],
  ["order/nested-event failure after stock reservation", { failCreate: true }],
  ["commit failure", { failCommit: true }],
] as const) {
  test(`${name} rolls back all stock and records`, async () => {
    const fixture = database(options);
    const before = fixture.snapshot();
    await assert.rejects(
      createCheckoutOrder(
        fixture.db,
        {
          ...payload,
          totalAmount: 150,
          items: [...payload.items, { productId: "p2", quantity: 1, price: 50 }],
        },
        buyer,
      ),
    );
    assert.deepEqual(fixture.snapshot(), before);
  });
}
test("two concurrent orders competing for the last unit cannot both commit (transaction fixture)", async () => {
  const fixture = database({ stock: 1 });
  const results = await Promise.allSettled([
    createCheckoutOrder(fixture.db, payload, buyer, "request-key-first-0001"),
    createCheckoutOrder(fixture.db, payload, buyer, "request-key-second-0002"),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(fixture.snapshot().products[0].stock, 0);
  assert.equal(fixture.snapshot().orders.length, 1);
  assert.equal(fixture.snapshot().events.length, 1);
});
test("same keyed request is durable and replayed without changing inventory or events", async () => {
  const fixture = database();
  const first = await createCheckoutOrder(fixture.db, payload, buyer, "request-key-repeat-0001");
  const before = fixture.snapshot();
  const second = await createCheckoutOrder(fixture.db, payload, buyer, "request-key-repeat-0001");
  assert.equal(second.replayed, true);
  assert.equal(second.order.id, first.order.id);
  assert.deepEqual(fixture.snapshot(), before);
});
test("concurrent identical keys reconcile to one order and one stock decrement", async () => {
  const fixture = database({ stock: 1 });
  const [a, b] = await Promise.all([
    createCheckoutOrder(fixture.db, payload, buyer, "same-concurrent-key-0001"),
    createCheckoutOrder(fixture.db, payload, buyer, "same-concurrent-key-0001"),
  ]);
  assert.equal(a.order.id, b.order.id);
  assert.notEqual(a.replayed, b.replayed);
  assert.equal(fixture.snapshot().products[0].stock, 0);
  assert.equal(fixture.snapshot().events.length, 1);
});
test("reusing a key with changed shipping/items returns 409 without leaking or modifying the existing order", async () => {
  const fixture = database();
  await createCheckoutOrder(fixture.db, payload, buyer, "request-key-mismatch-0001");
  const before = fixture.snapshot();
  await assert.rejects(
    createCheckoutOrder(
      fixture.db,
      { ...payload, shippingAddress: "Changed" },
      buyer,
      "request-key-mismatch-0001",
    ),
    rejectsStatus(409),
  );
  assert.deepEqual(fixture.snapshot(), before);
});
test("keys are scoped by server-verified user; forged IDs never choose another user's receipt", async () => {
  const fixture = database();
  const key = "request-key-identity-0001";
  const a = await createCheckoutOrder(fixture.db, payload, buyer, key);
  const b = await createCheckoutOrder(
    fixture.db,
    { ...payload, userId: buyer.id },
    { ...buyer, id: "buyer-b" },
    key,
  );
  assert.notEqual(a.order.id, b.order.id);
  assert.equal(b.order.userId, "buyer-b");
});
test("invalid idempotency key stops before a transaction", async () => {
  const fixture = database();
  await assert.rejects(
    createCheckoutOrder(fixture.db, payload, buyer, "short"),
    rejectsStatus(400),
  );
  assert.equal(fixture.attempts().updateAttempts, 0);
});
