// Real Chromium UI checks with intercepted test responses. Never accesses the backend/database.
// Run: node --import tsx tests/order-tracking.browser.mjs
// Set CHROME_PATH if Chrome/Edge is not installed in a standard Windows location.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, realpathSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { basename, join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { customerOrder, trackingOrder } from "./fixtures/order-tracking.ts";

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function freePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function until(action, label, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await action()) return;
    await delay(100);
  }
  throw new Error(`Timed out: ${label}`);
}
class Devtools {
  nextId = 0;
  pending = new Map();
  listeners = new Map();
  constructor(url) {
    this.socket = new WebSocket(url);
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const entry = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) entry?.reject(new Error(message.error.message));
        else entry?.resolve(message.result);
      } else this.listeners.get(message.method)?.(message.params);
    });
  }
  async send(method, params = {}) {
    await this.ready;
    const id = ++this.nextId;
    const promise = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.socket.send(JSON.stringify({ id, method, params }));
    return promise;
  }
  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result?.value;
  }
}

const executable = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find((path) => path && existsSync(path));
assert(executable, "Set CHROME_PATH to an installed Chromium browser.");
const temporaryRoot = realpathSync(tmpdir());
const profile = mkdtempSync(join(temporaryRoot, "sellora-tracking-browser-"));
const webPort = await freePort();
const debugPort = await freePort();
const origin = `http://127.0.0.1:${webPort}`;
let viteLog = "";
const vite = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    String(webPort),
    "--strictPort",
  ],
  { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
);
vite.stdout.on("data", (data) => {
  viteLog += data;
});
vite.stderr.on("data", (data) => {
  viteLog += data;
});
const browser = spawn(
  executable,
  [
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--disable-extensions",
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${debugPort}`,
    "about:blank",
  ],
  { windowsHide: true, stdio: "ignore" },
);
let cdp;
let checks = 0;
const errors = [];
const held = [];
const trackingRequests = [];
let mode = "ready";
let listStatus = 200;
const secondOrder = { ...customerOrder, id: "test-order-2", orderNumber: "ORD-TEST-2" };
const check = (label) => {
  checks++;
  console.log(`PASS: ${label}`);
};
const dialogText = "document.querySelector('[role=dialog]')?.innerText || ''";
try {
  await until(async () => {
    try {
      return (await fetch(origin)).ok;
    } catch {
      return false;
    }
  }, "Vite startup");
  let targets;
  await until(async () => {
    try {
      targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
      return targets.some((target) => target.type === "page");
    } catch {
      return false;
    }
  }, "Chromium startup");
  cdp = new Devtools(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
  cdp.listeners.set("Runtime.exceptionThrown", (event) =>
    errors.push(event.exceptionDetails.exception?.description || event.exceptionDetails.text),
  );
  const fulfill = async (requestId, status, body) =>
    cdp.send("Fetch.fulfillRequest", {
      requestId,
      responseCode: status,
      responseHeaders: [
        { name: "Content-Type", value: "application/json" },
        { name: "Cache-Control", value: "no-store" },
      ],
      body: Buffer.from(JSON.stringify(body)).toString("base64"),
    });
  const trackingFor = (id) => {
    const order = structuredClone(trackingOrder);
    if (id === secondOrder.id) {
      order.id = secondOrder.id;
      order.orderNumber = secondOrder.orderNumber;
    }
    if (mode === "empty")
      Object.assign(order, {
        status: "PENDING",
        carrierName: null,
        trackingNumber: null,
        estimatedDelivery: null,
        trackingEvents: [],
      });
    if (mode === "cancelled") Object.assign(order, { status: "CANCELLED", trackingEvents: [] });
    if (mode === "delivered") {
      Object.assign(order, { status: "DELIVERED", updatedAt: "2026-11-19T05:00:00.000Z" });
      order.trackingEvents.push({
        id: "event-4",
        status: "DELIVERED",
        note: "Delivery recorded in test response",
        createdAt: order.updatedAt,
      });
    }
    if (mode === "long") {
      order.carrierName = "Courier".repeat(17);
      order.trackingNumber = "TRACK".repeat(32);
      order.trackingEvents[2].note = "LongTrackingNote".repeat(130);
    }
    return order;
  };
  cdp.listeners.set("Fetch.requestPaused", (event) => {
    void (async () => {
      const path = new URL(event.request.url).pathname;
      if (!event.request.url.startsWith(`${origin}/`)) {
        return cdp.send("Fetch.fulfillRequest", {
          requestId: event.requestId,
          responseCode: 200,
          responseHeaders: [
            {
              name: "Content-Type",
              value: event.resourceType === "Stylesheet" ? "text/css" : "application/octet-stream",
            },
          ],
          body: "",
        });
      }
      if (!path.startsWith("/api/"))
        return cdp.send("Fetch.continueRequest", { requestId: event.requestId });
      if (path === "/api/customer/orders")
        return fulfill(
          event.requestId,
          listStatus,
          listStatus === 200 ? [customerOrder, secondOrder] : { error: "test session expired" },
        );
      if (path.startsWith("/api/orders/") && path.endsWith("/tracking")) {
        const id = decodeURIComponent(path.split("/")[3]);
        trackingRequests.push(event.request.url);
        if (mode === "hold") {
          held.push({ requestId: event.requestId, id });
          return;
        }
        if (mode === "network")
          return cdp.send("Fetch.failRequest", {
            requestId: event.requestId,
            errorReason: "InternetDisconnected",
          });
        if (/^error\d+$/.test(mode))
          return fulfill(event.requestId, Number(mode.slice(5)), { error: "test error" });
        return fulfill(event.requestId, 200, { success: true, order: trackingFor(id) });
      }
      // Intercept every other API request as well: none reaches the backend proxy.
      return fulfill(event.requestId, 200, path === "/api/settings" ? {} : []);
    })().catch((error) => {
      if (!/Invalid InterceptionId/.test(error.message)) errors.push(error.message);
    });
  });
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `localStorage.setItem('sellora_user', ${JSON.stringify(JSON.stringify({ id: "test-customer", email: "test@example.test", firstName: "Test", role: "customer" }))});`,
  });
  await cdp.send("Page.navigate", { url: `${origin}/account` });
  await until(
    () => cdp.evaluate("document.body.innerText.toLowerCase().includes('customer command center')"),
    "account page",
  );
  await until(
    () =>
      cdp.evaluate(
        "document.querySelector('div.transition-opacity.duration-700')?.classList.contains('pointer-events-none') === false",
      ),
    "existing startup overlay completion",
  );
  await cdp.evaluate(
    "[...document.querySelectorAll('nav button')].find(button => button.innerText.includes('My Orders')).click()",
  );
  await until(
    () =>
      cdp.evaluate(
        "[...document.querySelectorAll('button')].some(button => button.innerText.trim() === 'Track Order')",
      ),
    "customer order list",
  );
  const click = async (label, index = 0) =>
    cdp.evaluate(
      `(() => { const button = [...document.querySelectorAll('button')].filter(button => button.innerText.trim() === ${JSON.stringify(label)})[${index}]; if (!button) throw new Error('Button missing'); button.focus(); button.click(); })()`,
    );
  const open = async (nextMode, index = 0) => {
    mode = nextMode;
    await click("Track Order", index);
    await until(
      () => cdp.evaluate("Boolean(document.querySelector('[role=dialog]'))"),
      "tracking modal",
    );
  };
  const close = async () => {
    await click("Close tracking");
    await until(
      () => cdp.evaluate("!document.querySelector('[role=dialog]')"),
      "tracking modal close",
    );
  };

  await open("hold");
  await until(
    () => cdp.evaluate(`(${dialogText}).includes('Loading order tracking')`),
    "loading state",
  );
  check("loading is displayed while the tracking response is pending");
  mode = "ready";
  await until(async () => held.length > 0, "intercepted tracking request");
  for (const first of held.splice(0)) {
    try {
      await fulfill(first.requestId, 200, { success: true, order: trackingFor(first.id) });
    } catch (error) {
      if (!/Invalid InterceptionId/.test(error.message)) throw error;
    }
  }
  await until(
    () => cdp.evaluate(`(${dialogText}).includes('Handed to the courier')`),
    "tracking history",
  );
  const readyText = await cdp.evaluate(dialogText);
  for (const value of ["ORD-TEST-1", "Test Courier", "TEST-PKG-123", "Test street", "Test Laptop"])
    assert(readyText.includes(value), value);
  assert(!/24 - 48|Thermal QC|refunded/i.test(readyText));
  assert.equal(
    await cdp.evaluate(
      "document.querySelectorAll('[aria-label=\"Recorded tracking history\"] li').length",
    ),
    3,
  );
  check(
    "the existing modal displays tracking response fields, chronological history and original package/address details",
  );
  for (let count = 0; count < 12; count++) {
    await cdp.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
    await cdp.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
    assert(await cdp.evaluate("Boolean(document.activeElement.closest('[role=dialog]'))"));
  }
  check("keyboard focus stays inside the open modal");
  mode = "delivered";
  await click("Refresh tracking");
  await until(
    () => cdp.evaluate(`(${dialogText}).includes('Delivery recorded in test response')`),
    "tracking refresh",
  );
  assert.equal(
    await cdp.evaluate(
      "document.querySelector('[aria-current=step] > span:last-child')?.innerText",
    ),
    "Delivered",
  );
  check("refresh replaces the current status and history with the next response");
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await until(() => cdp.evaluate("!document.querySelector('[role=dialog]')"), "Escape close");
  assert.equal(await cdp.evaluate("document.activeElement.innerText.trim()"), "Track Order");
  check("Escape closes the dialog and restores focus to Track Order");

  for (const status of [401, 403, 404, 503]) {
    await open(`error${status}`);
    await until(
      () => cdp.evaluate("Boolean(document.querySelector('[role=dialog] [role=alert]'))"),
      `HTTP ${status} state`,
    );
    assert(!(await cdp.evaluate(dialogText)).includes("Test Courier"));
    if (status === 401)
      assert(
        await cdp.evaluate("Boolean(document.querySelector('[role=dialog] a[href=\"/login\"]'))"),
      );
    await close();
    check(`HTTP ${status} shows an actionable error without stale tracking details`);
  }
  await open("network");
  await until(
    () => cdp.evaluate(`(${dialogText}).includes('Check your connection')`),
    "network error",
  );
  mode = "ready";
  await click("Try again");
  await until(() => cdp.evaluate(`(${dialogText}).includes('Test Courier')`), "successful retry");
  await close();
  check("network failures can be retried successfully");
  await open("empty");
  await until(
    () => cdp.evaluate(`(${dialogText}).includes('No tracking updates have been recorded')`),
    "empty history",
  );
  assert.equal((await cdp.evaluate(dialogText)).match(/Not provided/g)?.length, 3);
  await close();
  check("empty history and all missing delivery fields display honest empty states");
  await open("cancelled");
  await until(
    () => cdp.evaluate(`(${dialogText}).includes('This order has been cancelled')`),
    "cancelled order",
  );
  assert.equal(
    await cdp.evaluate("document.querySelector('[aria-label=\"Order progress steps\"]')"),
    null,
  );
  await close();
  check("cancelled orders have no misleading delivered/refunded progress");

  await open("hold");
  await until(async () => held.length > 0, "request to cancel");
  const cancelled = held.shift();
  await close();
  await open("ready", 1);
  await until(
    () =>
      cdp.evaluate(
        `(${dialogText}).includes('ORD-TEST-2') && (${dialogText}).includes('Test Courier')`,
      ),
    "second order",
  );
  try {
    await fulfill(cancelled.requestId, 200, { success: true, order: trackingFor(cancelled.id) });
  } catch {
    /* Browser already cancelled it. */
  }
  await delay(150);
  assert(!(await cdp.evaluate(dialogText)).includes("ORD-TEST-1"));
  await close();
  check("closing a pending request and opening another order cannot display stale data");

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await open("long");
  await until(
    () => cdp.evaluate(`(${dialogText}).includes('LongTrackingNote')`),
    "mobile long content",
  );
  const size = await cdp.evaluate(
    "(() => { const dialog=document.querySelector('[role=dialog]'); const rect=dialog.getBoundingClientRect(); return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:innerWidth,height:innerHeight,scroll:dialog.scrollWidth,client:dialog.clientWidth}; })()",
  );
  assert(
    size.left >= 0 &&
      size.right <= size.width + 1 &&
      size.top >= 0 &&
      size.bottom <= size.height + 1,
    JSON.stringify(size),
  );
  assert(size.scroll <= size.client + 1, JSON.stringify(size));
  const image = await cdp.send("Page.captureScreenshot", { format: "png" });
  const screenshot = join(temporaryRoot, "sellora-phase3-tracking-mobile.png");
  await writeFile(screenshot, Buffer.from(image.data, "base64"));
  console.log(`Mobile screenshot: ${screenshot}`);
  await close();
  check("mobile tracking fits the viewport and wraps long courier IDs and notes");
  listStatus = 401;
  await cdp.send("Page.reload");
  await until(
    () => cdp.evaluate("Boolean(document.querySelector('main a[href=\"/login\"]'))"),
    "expired customer list session",
  );
  assert(!(await cdp.evaluate("document.body.innerText")).includes("No Orders Placed Yet"));
  check(
    "an expired account-list session offers sign-in instead of pretending the customer has no orders",
  );
  assert(trackingRequests.every((url) => !url.includes("email=") && !url.includes("userId=")));
  assert.deepEqual(errors, []);
  console.log(
    `Browser checks: ${checks} passed. API responses were intercepted fixtures; no real API/database integration was tested.`,
  );
} catch (error) {
  console.error(viteLog.slice(-2500));
  console.error("Browser errors:", errors);
  if (cdp) {
    try {
      console.error(
        "Page:",
        await cdp.evaluate(
          "({url:location.href,text:document.body.innerText.slice(0,4000),storedUser:localStorage.getItem('sellora_user')})",
        ),
      );
    } catch {
      /* Browser disconnected. */
    }
  }
  throw error;
} finally {
  if (cdp) {
    try {
      await cdp.send("Browser.close");
    } catch {
      /* Already closed. */
    }
    cdp.socket.close();
  }
  browser.kill();
  vite.kill();
  // Verify the exact temporary target before any recursive cleanup.
  const target = resolve(profile);
  if (
    target.startsWith(`${temporaryRoot}${sep}`) &&
    basename(target).startsWith("sellora-tracking-browser-")
  ) {
    await rm(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }).catch(() =>
      console.log(`Temporary browser profile retained: ${target}`),
    );
  }
}
