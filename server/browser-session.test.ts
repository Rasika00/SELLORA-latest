import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { getCurrentUser, logout, setCurrentUser } from "../src/lib/auth";

const saved = new Map<string, PropertyDescriptor | undefined>();
function replaceGlobal(key: string, value: unknown) {
  saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
}

beforeEach(() => {
  const values = new Map<string, string>();
  replaceGlobal("window", { dispatchEvent: () => true });
  replaceGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
  setCurrentUser({ id: "customer-1", email: "buyer@example.test", role: "customer" });
});
afterEach(() => {
  for (const [key, descriptor] of saved) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  saved.clear();
});

test("browser logout waits for server cookie clearance before clearing local identity", async () => {
  let complete!: (response: Response) => void;
  replaceGlobal("fetch", (url: string, options: RequestInit) => {
    assert.equal(url, "/api/auth/logout");
    assert.equal(options.method, "POST");
    assert.equal(options.credentials, "same-origin");
    return new Promise<Response>((resolve) => {
      complete = resolve;
    });
  });
  const pending = logout();
  assert.equal(getCurrentUser()?.id, "customer-1");
  complete(new Response("{}", { status: 200 }));
  await pending;
  assert.equal(getCurrentUser(), null);
});

test("failed server logout keeps local identity rather than reporting success", async () => {
  replaceGlobal("fetch", async () => new Response("{}", { status: 503 }));
  await assert.rejects(logout(), /Sign out failed/);
  assert.equal(getCurrentUser()?.id, "customer-1");
});

test("network failure during logout keeps local identity", async () => {
  replaceGlobal("fetch", async () => {
    throw new Error("network unavailable");
  });
  await assert.rejects(logout(), /network unavailable/);
  assert.equal(getCurrentUser()?.id, "customer-1");
});
