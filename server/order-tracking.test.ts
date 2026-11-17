import assert from "node:assert/strict";
import { test } from "node:test";
import { Prisma, type PrismaClient } from "@prisma/client";
import { ApiError, type AuthUser } from "./auth";
import {
  assertOrderWriter,
  getOrderTracking,
  initialTrackingEvent,
  ORDER_STATUSES,
  parseTrackingInput,
  STATUS_TRANSITIONS,
  updateOrderTracking,
} from "./order-tracking";

const admin: AuthUser = { id: "admin-1", role: "admin", isActive: true, sellerStatus: "NONE" };
const seller: AuthUser = {
  id: "seller-1",
  role: "seller",
  isActive: true,
  sellerStatus: "APPROVED",
};
const customer: AuthUser = {
  id: "customer-1",
  role: "customer",
  isActive: true,
  sellerStatus: "NONE",
};

function database(status = "PENDING", sellerIds: (string | null)[] = [seller.id]) {
  const state = {
    order: {
      id: "order-1",
      orderNumber: "ORD-1",
      userId: customer.id,
      status,
      updatedAt: new Date("2026-11-16T00:00:00Z"),
      carrierName: null as string | null,
      trackingNumber: null as string | null,
      estimatedDelivery: null as Date | null,
      items: sellerIds.map((sellerId) => ({ product: { sellerId } })),
    },
    events: [] as { status: string; note: string | null; actorId: string }[],
    updates: 0,
    transactions: 0,
    isolation: "",
    failWrite: false,
  };
  const tx = {
    order: {
      findUnique: async () => structuredClone(state.order),
      update: async (args: {
        where: { status: string; updatedAt: Date };
        data: Record<string, unknown>;
      }) => {
        assert.equal(args.where.status, state.order.status);
        assert.equal(args.where.updatedAt.getTime(), state.order.updatedAt.getTime());
        if (state.failWrite) throw new Error("simulated write failure");
        const { trackingEvents, ...fields } = args.data;
        Object.assign(state.order, fields);
        state.updates++;
        if (trackingEvents)
          state.events.push((trackingEvents as { create: (typeof state.events)[number] }).create);
        return structuredClone(state.order);
      },
    },
  };
  const db = {
    $transaction: async (
      fn: (value: typeof tx) => unknown,
      options: { isolationLevel: string },
    ) => {
      state.transactions++;
      state.isolation = options.isolationLevel;
      return fn(tx);
    },
  } as unknown as PrismaClient;
  return { db, state };
}

for (const from of ORDER_STATUSES) {
  for (const to of ORDER_STATUSES) {
    test(`status transition ${from} -> ${to}`, async () => {
      const { db, state } = database(from);
      const allowed = from === to || STATUS_TRANSITIONS[from].includes(to);
      if (!allowed) {
        await assert.rejects(
          updateOrderTracking(db, "order-1", admin, { status: to }),
          (error) => error instanceof ApiError && error.statusCode === 409,
        );
        assert.equal(state.updates, 0);
        assert.equal(state.events.length, 0);
        return;
      }
      const result = await updateOrderTracking(db, "order-1", admin, {
        status: to,
        note: "Customer-visible update",
      });
      assert.equal(result.order.status, to);
      assert.equal(result.historyCreated, from !== to);
      assert.equal(state.events.length, from === to ? 0 : 1);
      assert.equal(state.isolation, "Serializable");
      if (from !== to)
        assert.deepEqual(state.events[0], {
          status: to,
          note: "Customer-visible update",
          actorId: admin.id,
        });
    });
  }
}

test("a retried status change records exactly one event", async () => {
  const { db, state } = database();
  await updateOrderTracking(db, "order-1", seller, { status: "PROCESSING" });
  const retry = await updateOrderTracking(db, "order-1", seller, { status: "PROCESSING" });
  assert.equal(retry.historyCreated, false);
  assert.equal(state.events.length, 1);
});

test("delivery fields and legacy carrierNotes are saved with the transition", async () => {
  const { db, state } = database("PROCESSING");
  await updateOrderTracking(db, "order-1", seller, {
    status: "SHIPPED",
    courierName: " Courier ",
    trackingNumber: " PKG-1 ",
    estimatedDelivery: "2026-11-20",
    carrierNotes: " Dispatched ",
    sellerId: "forged",
    role: "admin",
    actorId: "forged",
  });
  assert.equal(state.order.carrierName, "Courier");
  assert.equal(state.order.trackingNumber, "PKG-1");
  assert.equal(state.order.estimatedDelivery?.toISOString(), "2026-11-20T00:00:00.000Z");
  assert.equal(state.events[0].actorId, seller.id);
  assert.equal(state.events[0].note, "Dispatched");
});

test("delivery-only edits and clearing optional fields do not duplicate history", async () => {
  const { db, state } = database();
  await updateOrderTracking(db, "order-1", admin, {
    carrierName: "Courier",
    trackingNumber: "PKG-2",
  });
  await updateOrderTracking(db, "order-1", admin, {
    carrierName: null,
    trackingNumber: "",
    estimatedDelivery: null,
  });
  assert.equal(state.events.length, 0);
  assert.equal(state.order.carrierName, null);
  assert.equal(state.order.trackingNumber, null);
});

for (const body of [
  undefined,
  null,
  {},
  { status: "LOST" },
  { status: "shipped" },
  { status: 1 },
  { estimatedDelivery: "2026-02-30" },
  { estimatedDelivery: "tomorrow" },
  { estimatedDelivery: 1 },
  { estimatedDelivery: "2026-11-20T10:00:00" },
  { carrierName: 42 },
  { note: "x" },
  { status: "PROCESSING", note: "x".repeat(2001) },
  { carrierName: "a", courierName: "b" },
]) {
  test(`invalid tracking input: ${JSON.stringify(body)?.slice(0, 75)}`, () => {
    assert.throws(
      () => parseTrackingInput(body),
      (error) => error instanceof ApiError && error.statusCode === 400,
    );
  });
}

test("ISO delivery timestamps with offsets are accepted", () => {
  assert.equal(
    parseTrackingInput({
      estimatedDelivery: "2026-11-20T10:00:00+05:30",
    }).delivery.estimatedDelivery?.toISOString(),
    "2026-11-20T04:30:00.000Z",
  );
});

test("only approved owning sellers or active admins may update the entire order", () => {
  assert.doesNotThrow(() => assertOrderWriter(seller, [seller.id, seller.id]));
  assert.doesNotThrow(() => assertOrderWriter(admin, [seller.id, "other-seller"]));
  for (const [actor, ids] of [
    [customer, [seller.id]],
    [seller, ["other-seller"]],
    [seller, [seller.id, "other-seller"]],
    [seller, [null]],
    [seller, []],
    [{ ...seller, sellerStatus: "PENDING" }, [seller.id]],
    [{ ...seller, sellerStatus: "SUSPENDED" }, [seller.id]],
    [{ ...admin, isActive: false }, [seller.id]],
  ] as [AuthUser, (string | null)[]][]) {
    assert.throws(
      () => assertOrderWriter(actor, ids),
      (error) => error instanceof ApiError && error.statusCode === 403,
    );
  }
});

test("unauthorized sellers fail before any history or status write", async () => {
  const { db, state } = database("PENDING", ["other-seller"]);
  await assert.rejects(
    updateOrderTracking(db, "order-1", seller, { status: "PROCESSING" }),
    ApiError,
  );
  assert.equal(state.updates, 0);
  assert.equal(state.events.length, 0);
});

test("a failed nested write rejects the transaction and does not report success", async () => {
  const { db, state } = database();
  state.failWrite = true;
  await assert.rejects(
    updateOrderTracking(db, "order-1", admin, { status: "PROCESSING" }),
    /simulated write failure/,
  );
  assert.equal(state.order.status, "PENDING");
  assert.equal(state.events.length, 0);
});

test("serialization conflicts and stale writes return a retryable 409", async () => {
  for (const code of ["P2034", "P2025"]) {
    const db = {
      $transaction: async () => {
        throw new Prisma.PrismaClientKnownRequestError("conflict", {
          code,
          clientVersion: "6.19.3",
        });
      },
    } as unknown as PrismaClient;
    await assert.rejects(
      updateOrderTracking(db, "order-1", admin, { status: "PROCESSING" }),
      (error) => error instanceof ApiError && error.statusCode === 409,
    );
  }
});

test("tracking queries scope ownership, order events chronologically and hide actor IDs", async () => {
  for (const user of [customer, seller, admin]) {
    let query: Prisma.OrderFindFirstArgs | undefined;
    const tx = {
      order: {
        findFirst: async (args: Prisma.OrderFindFirstArgs) => {
          query = args;
          return { id: "order-1", trackingEvents: [] };
        },
      },
    };
    const db = {
      $transaction: async (
        fn: (value: typeof tx) => unknown,
        options: { isolationLevel: string },
      ) => {
        assert.equal(options.isolationLevel, "RepeatableRead");
        return fn(tx);
      },
    } as unknown as PrismaClient;
    await getOrderTracking(db, "order-1", user);
    const expectedWhere =
      user === customer
        ? { id: "order-1", userId: customer.id }
        : user === seller
          ? { id: "order-1", items: { some: { product: { sellerId: seller.id } } } }
          : { id: "order-1" };
    assert.deepEqual(query?.where, expectedWhere);
    const history = query?.select?.trackingEvents as {
      orderBy: unknown;
      select: Record<string, unknown>;
    };
    assert.deepEqual(history.orderBy, [{ createdAt: "asc" }, { id: "asc" }]);
    assert.equal(Boolean(history.select.actorId), user === admin);
    assert.equal(query?.select?.customerEmail, undefined);
    assert.equal(query?.select?.shippingAddress, undefined);
  }
});

test("missing or inaccessible tracking is 404, including another customer's order", async () => {
  const db = { $transaction: async () => null } as unknown as PrismaClient;
  await assert.rejects(
    getOrderTracking(db, "foreign-order", customer),
    (error) => error instanceof ApiError && error.statusCode === 404,
  );
});

test("initial events record PENDING with an optional verified actor", () => {
  assert.deepEqual(initialTrackingEvent(), { create: { status: "PENDING", actorId: null } });
  assert.deepEqual(initialTrackingEvent(customer.id), {
    create: { status: "PENDING", actorId: customer.id },
  });
});
