import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createServer, type Server } from "node:http";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { createSessionToken, verifySessionToken } from "./auth";

// No real database is used. Unexpected transaction calls fail immediately.
process.env.VERCEL = "1";
process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused";
process.env.AUTH_SECRET = randomBytes(48).toString("hex");
process.env.NODE_ENV = "test";
const password = "test-password";
const hash = bcrypt.hashSync(password, 4);
const users = [
  {
    id: "customer-1",
    email: "customer@example.test",
    role: "customer",
    sellerStatus: "NONE",
    isActive: true,
    password: hash,
  },
  {
    id: "seller-1",
    email: "seller@example.test",
    role: "seller",
    sellerStatus: "APPROVED",
    isActive: true,
    password: hash,
  },
  {
    id: "admin-1",
    email: "admin@example.test",
    role: "admin",
    sellerStatus: "NONE",
    isActive: true,
    password: hash,
  },
];
const restores: (() => void)[] = [];
function stub(target: object, key: string, implementation: unknown) {
  const original = Reflect.get(target, key);
  Reflect.set(target, key, implementation);
  restores.push(() => {
    Reflect.set(target, key, original);
  });
}
function restoreStubs() {
  while (restores.length) restores.pop()!();
}
let server: Server;
let base: string;
before(async () => {
  const { default: app } = await import("./index");
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  base = `http://127.0.0.1:${address.port}`;
});
beforeEach(() => {
  restoreStubs();
  stub(
    prisma.user,
    "findUnique",
    async ({ where }: { where: { id?: string; email?: string } }) =>
      users.find((user) => user.id === where.id || user.email === where.email) || null,
  );
  stub(prisma, "$transaction", async () => {
    throw new Error("Unexpected transaction: real database access is forbidden in these tests.");
  });
});
after(async () => {
  restoreStubs();
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await prisma.$disconnect();
});

function cookie(index: number) {
  return `sellora_session=${createSessionToken(users[index])}`;
}
async function request(
  path: string,
  options: {
    method?: string;
    user?: number;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
) {
  return fetch(`${base}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(path === "/api/orders" && options.method === "POST"
        ? { "Idempotency-Key": randomBytes(24).toString("hex") }
        : {}),
      ...(options.user !== undefined && { Cookie: cookie(options.user) }),
      ...options.headers,
    },
    ...(options.body !== undefined && { body: JSON.stringify(options.body) }),
  });
}

test("verified login sets an HttpOnly SameSite cookie without returning a password", async () => {
  const res = await request("/api/auth/login", {
    method: "POST",
    body: { email: users[0].email, password },
  });
  assert.equal(res.status, 200);
  const session = res.headers.get("set-cookie") || "";
  assert.match(session, /HttpOnly/);
  assert.match(session, /SameSite=Strict/);
  assert.equal((await res.json()).user.password, undefined);
  const followup = await request("/api/orders", { headers: { Cookie: session.split(";")[0] } });
  assert.equal(followup.status, 403); // Authenticated customer is still not an admin.
});

test("wrong passwords cannot get a session", async () => {
  const res = await request("/api/auth/login", {
    method: "POST",
    body: { email: users[0].email, password: "wrong" },
  });
  assert.equal(res.status, 401);
  assert.equal(res.headers.get("set-cookie"), null);
});

test("production cookies use Secure and the __Host prefix", async () => {
  process.env.NODE_ENV = "production";
  try {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: { email: users[0].email, password },
    });
    assert.equal(res.status, 200);
    assert.match(
      res.headers.get("set-cookie") || "",
      /^__Host-sellora_session=.*; Path=\/;.*; HttpOnly; Secure; SameSite=Strict/,
    );
  } finally {
    process.env.NODE_ENV = "test";
  }
});

test("registration cannot grant admin based on email or a client role", async () => {
  let role: string | undefined;
  stub(prisma.user, "create", async ({ data }: { data: Record<string, unknown> }) => {
    role = String(data.role);
    return { ...data, id: "new-customer" };
  });
  const res = await request("/api/auth/register", {
    method: "POST",
    body: { email: "admin-new@example.test", password, role: "admin" },
  });
  assert.equal(res.status, 201);
  assert.equal(role, "customer");
  assert.equal((await res.json()).user.role, "customer");
});

test("logout clears the server session cookie", async () => {
  const res = await request("/api/auth/logout", { method: "POST", user: 0 });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("set-cookie") || "", /sellora_session=;/);
  assert.match(res.headers.get("set-cookie") || "", /Expires=Thu, 01 Jan 1970/);
});

test("forged, expired, inactive and password-invalidated sessions are denied", async () => {
  const token = createSessionToken(users[0]);
  assert.throws(() => verifySessionToken(`${token.slice(0, -1)}!`));
  const forged = await request("/api/orders/order-1/tracking", {
    headers: { Cookie: `sellora_session=${token.slice(0, -1)}!` },
  });
  assert.equal(forged.status, 401);
  const expired = createSessionToken(users[0], Date.now() - 9 * 60 * 60 * 1000);
  assert.equal(
    (await request("/api/orders", { headers: { Cookie: `sellora_session=${expired}` } })).status,
    401,
  );
  for (const change of [{ isActive: false }, { password: "changed-password-hash" }]) {
    stub(prisma.user, "findUnique", async () => ({ ...users[0], ...change }));
    assert.equal((await request("/api/orders", { user: 0 })).status, 401);
  }
});

test("missing AUTH_SECRET fails closed without writing to the database", async () => {
  const saved = process.env.AUTH_SECRET;
  delete process.env.AUTH_SECRET;
  try {
    assert.equal((await request("/api/orders")).status, 503);
  } finally {
    process.env.AUTH_SECRET = saved;
  }
});

test("cross-origin cookie writes are rejected", async () => {
  assert.equal(
    (
      await request("/api/orders/order-1/status", {
        method: "PATCH",
        user: 2,
        body: { status: "PROCESSING" },
        headers: { Origin: "https://attacker.example" },
      })
    ).status,
    403,
  );
});

test("private order routes and role-management routes require verified identity", async () => {
  for (const [method, path] of [
    ["GET", "/api/orders"],
    ["GET", "/api/orders/order-1/tracking"],
    ["GET", "/api/customer/orders?userId=other"],
    ["GET", "/api/seller/orders/seller-1"],
    ["GET", "/api/admin/stats"],
    ["GET", "/api/admin/sales-analytics"],
    ["PATCH", "/api/orders/order-1/status"],
    ["PATCH", "/api/seller/orders/order-1/fulfillment"],
    ["PATCH", "/api/users/customer-1/role"],
    ["PUT", "/api/users/customer-1"],
    ["PATCH", "/api/admin/sellers/seller-1/verification"],
  ]) {
    const res = await request(path, {
      method,
      ...(method !== "GET" && {
        body: { role: "admin", sellerId: "seller-1", status: "PROCESSING" },
      }),
    });
    assert.equal(res.status, 401, `${method} ${path}`);
  }
});

test("customer-supplied roles and seller IDs cannot authorize status updates", async () => {
  for (const path of ["/api/orders/order-1/status", "/api/seller/orders/order-1/fulfillment"]) {
    assert.equal(
      (
        await request(path, {
          method: "PATCH",
          user: 0,
          body: { role: "admin", sellerId: "seller-1", status: "PROCESSING" },
        })
      ).status,
      403,
    );
  }
  assert.equal(
    (
      await request("/api/users/customer-1/role", {
        method: "PATCH",
        user: 0,
        body: { role: "admin" },
      })
    ).status,
    403,
  );
  assert.equal((await request("/api/seller/orders/other-seller", { user: 1 })).status, 403);
});

test("database roles are rechecked rather than trusted from an old session", async () => {
  stub(prisma.user, "findUnique", async () => ({ ...users[2], role: "customer" }));
  assert.equal((await request("/api/orders", { user: 2 })).status, 403);
});

test("customer order lists ignore forged userId and email filters", async () => {
  let where;
  stub(prisma.order, "findMany", async (args: { where: unknown }) => {
    where = args.where;
    return [];
  });
  const res = await request("/api/customer/orders?userId=other&email=other@example.test", {
    user: 0,
  });
  assert.equal(res.status, 200);
  assert.deepEqual(where, { userId: "customer-1" });
});

test("tracking rejects another customer's order using the scoped query", async () => {
  let where;
  stub(prisma, "$transaction", async (fn: (tx: unknown) => unknown) =>
    fn({
      order: {
        findFirst: async (args: { where: unknown }) => {
          where = args.where;
          return null;
        },
      },
    }),
  );
  const res = await request("/api/orders/other-order/tracking", { user: 0 });
  assert.equal(res.status, 404);
  assert.deepEqual(where, { id: "other-order", userId: "customer-1" });
});

test("both existing status endpoints use a transaction and the verified actor", async () => {
  for (const [path, user] of [
    ["/api/orders/order-1/status", 2],
    ["/api/seller/orders/order-1/fulfillment", 1],
  ] as const) {
    let write: any;
    stub(prisma, "$transaction", async (fn: (tx: unknown) => unknown, options: any) => {
      assert.equal(options.isolationLevel, "Serializable");
      return fn({
        order: {
          findUnique: async () => ({
            id: "order-1",
            orderNumber: "ORD-1",
            status: "PENDING",
            updatedAt: new Date(),
            items: [{ product: { sellerId: "seller-1" } }],
          }),
          update: async (args: any) => {
            write = args;
            return { id: "order-1", orderNumber: "ORD-1", ...args.data };
          },
        },
      });
    });
    const res = await request(path, {
      method: "PATCH",
      user,
      body: { status: "PROCESSING", actorId: "forged", sellerId: "forged", note: "Packing" },
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).historyCreated, true);
    assert.deepEqual(write.data.trackingEvents.create, {
      status: "PROCESSING",
      note: "Packing",
      actorId: users[user].id,
    });
  }
});

test("checkout nests the initial PENDING event and never links a guest by a claimed ID/email", async () => {
  let data: any;
  stub(prisma, "$transaction", async (fn: (tx: unknown) => unknown) =>
    fn({
      product: {
        findMany: async () => [{ id: "product-1", status: "APPROVED", price: 100, stock: 10 }],
        updateMany: async () => ({ count: 1 }),
      },
      order: {
        findUnique: async () => null,
        create: async (args: { data: Record<string, unknown> }) => {
          data = args.data;
          return { id: "created-order", ...data };
        },
      },
    }),
  );
  const payload = {
    customerName: "Buyer",
    customerEmail: users[0].email,
    userId: users[0].id,
    shippingAddress: "Address",
    totalAmount: 100,
    items: [{ productId: "product-1", quantity: 1, price: 100 }],
  };
  const guest = await request("/api/orders", { method: "POST", body: payload });
  assert.equal(guest.status, 201);
  assert.equal(data.userId, null);
  assert.deepEqual(data.trackingEvents, { create: { status: "PENDING", actorId: null } });
  const signedIn = await request("/api/orders", {
    method: "POST",
    user: 0,
    body: { ...payload, userId: "forged", customerEmail: "other@example.test" },
  });
  assert.equal(signedIn.status, 201);
  assert.equal(data.userId, users[0].id);
  assert.deepEqual(data.trackingEvents.create, { status: "PENDING", actorId: users[0].id });
});

test("checkout HTTP errors never return a successful receipt or write an initial event", async () => {
  let writes = 0;
  stub(prisma, "$transaction", async (fn: (tx: unknown) => unknown) =>
    fn({
      product: {
        findMany: async () => [{ id: "product-1", price: 100, stock: 0, status: "APPROVED" }],
        updateMany: async () => {
          writes++;
          return { count: 0 };
        },
      },
      order: {
        findUnique: async () => null,
        create: async () => {
          writes++;
          throw new Error("must not write");
        },
      },
    }),
  );
  const body = {
    customerName: "Buyer",
    customerEmail: "buyer@example.test",
    shippingAddress: "Local",
    totalAmount: 100,
    items: [{ productId: "product-1", quantity: 1, price: 100 }],
  };
  const stock = await request("/api/orders", { method: "POST", body });
  assert.equal(stock.status, 409);
  assert.equal((await stock.json()).success, undefined);
  assert.equal(writes, 0);
  const missingKey = await request("/api/orders", {
    method: "POST",
    body,
    headers: { "Idempotency-Key": "" },
  });
  assert.equal(missingKey.status, 400);
  assert.equal(writes, 0);
  const expired = await request("/api/orders", {
    method: "POST",
    body: { ...body, requireSession: true },
  });
  assert.equal(expired.status, 401);
  assert.equal(writes, 0);
});

test("HTTP checkout replay returns the same order and decrements stock once", async () => {
  let saved: Record<string, unknown> | null = null,
    reservations = 0,
    creates = 0;
  stub(prisma, "$transaction", async (fn: (tx: unknown) => unknown) =>
    fn({
      product: {
        findMany: async () => [{ id: "product-1", price: 100, stock: 5, status: "APPROVED" }],
        updateMany: async () => {
          reservations++;
          return { count: 1 };
        },
      },
      order: {
        findUnique: async () => saved,
        create: async ({ data }: { data: Record<string, unknown> }) => {
          creates++;
          saved = {
            ...data,
            items: [{ productId: "product-1", quantity: 1, price: 100, product: {} }],
          };
          return saved;
        },
      },
    }),
  );
  const body = {
    customerName: "Buyer",
    customerEmail: "buyer@example.test",
    shippingAddress: "Local",
    totalAmount: 100,
    items: [{ productId: "product-1", quantity: 1, price: 100 }],
  };
  const headers = { "Idempotency-Key": "http-checkout-retry-key-0001" };
  const first = await request("/api/orders", { method: "POST", user: 0, body, headers });
  const second = await request("/api/orders", { method: "POST", user: 0, body, headers });
  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  const a = await first.json(),
    b = await second.json();
  assert.equal(a.order.id, b.order.id);
  assert.equal(b.replayed, true);
  assert.equal(reservations, 1);
  assert.equal(creates, 1);
});

test("seller fulfillment and general status routes reject foreign and mixed-seller orders before writes", async () => {
  for (const path of ["/api/orders/order-1/status", "/api/seller/orders/order-1/fulfillment"]) {
    for (const sellerIds of [["other"], ["seller-1", "other"], [null], []]) {
      let writes = 0;
      stub(prisma, "$transaction", async (fn: (tx: unknown) => unknown) =>
        fn({
          order: {
            findUnique: async () => ({
              id: "order-1",
              status: "PENDING",
              updatedAt: new Date(),
              items: sellerIds.map((sellerId) => ({ product: { sellerId } })),
            }),
            update: async () => {
              writes++;
              throw new Error("unauthorized write");
            },
          },
        }),
      );
      const response = await request(path, {
        method: "PATCH",
        user: 1,
        body: { status: "PROCESSING", sellerId: "seller-1", role: "admin" },
      });
      assert.equal(response.status, 403);
      assert.equal(writes, 0);
    }
  }
});

test("pending and suspended sellers cannot bypass fulfillment approval using client roles", async () => {
  for (const sellerStatus of ["PENDING", "SUSPENDED"]) {
    stub(prisma.user, "findUnique", async () => ({ ...users[1], sellerStatus }));
    const result = await request("/api/seller/orders/order-1/fulfillment", {
      method: "PATCH",
      user: 1,
      body: { status: "PROCESSING", role: "admin" },
    });
    assert.equal(result.status, 403);
  }
});

test("product ownership cannot be stolen to acquire order-write permission", async () => {
  stub(prisma.product, "findUnique", async () => ({
    sellerId: "other-seller",
    status: "APPROVED",
  }));
  const res = await request("/api/products/other-product", {
    method: "PUT",
    user: 1,
    body: { sellerId: "seller-1" },
  });
  assert.equal(res.status, 404);
});

test("public product reviews do not select private order or customer identifiers", async () => {
  let query: any;
  stub(prisma.review, "findMany", async (args: any) => {
    query = args;
    return [];
  });
  assert.equal((await request("/api/products/product-1/reviews")).status, 200);
  assert.equal(query.select.order, undefined);
  assert.equal(query.select.orderId, undefined);
  assert.equal(query.select.userId, undefined);
  assert.equal(query.select.user.select.email, undefined);
});
