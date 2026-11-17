// Fixture-only checkout regression checks. Every /api request is intercepted.
import assert from "node:assert/strict";

export const checkoutLaptop = {
  id: "dynamic-checkout-laptop",
  name: "Fixture Checkout Laptop",
  price: 100,
  img: "/logo.png",
  cpu: "Fixture CPU",
  gpu: "Fixture GPU",
  ram: "16GB",
  processor: "Intel i7",
  category: "Gaming",
  stock: 3,
  status: "APPROVED",
  badgeColor: "cyan",
  badge: "TEST",
};

export function createCheckoutMock({ cdp, fulfill }) {
  let mode = "success";
  const writes = [],
    addresses = [],
    held = [];
  const confirm = (requestId) =>
    fulfill(requestId, 201, {
      success: true,
      order: { id: "fixture-order", orderNumber: "ORD-CHECKOUT-FIXTURE", totalAmount: 100 },
    });
  return {
    writes,
    addresses,
    mode(value) {
      mode = value;
    },
    async release() {
      mode = "success";
      for (const id of held.splice(0)) await confirm(id);
    },
    async handle(event) {
      const url = new URL(event.request.url),
        path = url.pathname;
      if (path === "/api/products") return fulfill(event.requestId, 200, [checkoutLaptop]);
      if (path.startsWith("/api/products/")) {
        if (mode === "product-missing")
          return fulfill(event.requestId, 404, { error: "Not found" });
        return fulfill(event.requestId, 200, {
          ...checkoutLaptop,
          ...(mode === "product-empty" ? { stock: 0 } : {}),
          ...(mode === "product-unapproved" ? { status: "PENDING_APPROVAL" } : {}),
        });
      }
      if (path === "/api/orders" && event.request.method === "POST") {
        const key = Object.entries(event.request.headers).find(
          ([name]) => name.toLowerCase() === "idempotency-key",
        )?.[1];
        writes.push({ key, body: JSON.parse(event.request.postData) });
        if (mode === "hold") {
          held.push(event.requestId);
          return;
        }
        if (mode === "network")
          return cdp.send("Fetch.failRequest", {
            requestId: event.requestId,
            errorReason: "InternetDisconnected",
          });
        if (mode.startsWith("error"))
          return fulfill(event.requestId, Number(mode.slice(5)), {
            error: "Fixture checkout rejected",
          });
        if (mode === "invalid-receipt")
          return fulfill(event.requestId, 200, {
            success: true,
            offline: true,
            order: { orderNumber: "ORD-FAKE" },
          });
        return confirm(event.requestId);
      }
      if (path === "/api/customer/addresses" && event.request.method === "POST") {
        addresses.push(JSON.parse(event.request.postData));
        return fulfill(event.requestId, 201, { success: true, address: { id: "fixture-address" } });
      }
      // Never allow an unhandled API call through to the real backend proxy.
      return fulfill(event.requestId, 200, []);
    },
  };
}

export async function runCheckoutBrowserChecks({ cdp, until, delay, check, origin, mock }) {
  const evaluate = (expression) => cdp.evaluate(expression);
  const field = async (name, value) => {
    await evaluate(
      `(()=>{const e=document.querySelector('form [name="${name}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
    await delay(50);
  };
  const navigate = async (path) => {
    // A same-path navigation can initially still expose the previous form.
    // Wait for the replacement document before filling any inputs.
    await evaluate("document.__checkoutLeaving = true");
    await cdp.send("Page.navigate", { url: origin + path });
    await until(
      () =>
        evaluate(
          `!document.__checkoutLeaving&&location.pathname===${JSON.stringify(path)}&&Boolean(document.querySelector('form input[name=name]'))`,
        ),
      "checkout form",
    );
  };
  const fill = async () => {
    for (const [name, value] of Object.entries({
      name: "Fixture Buyer",
      email: "fixture@example.test",
      phone: "0000000000",
      address: "Fixture address",
      city: "Fixture City",
      zipCode: "00000",
    }))
      await field(name, value);
    assert(await evaluate("document.querySelector('form').checkValidity()"));
  };
  const submit = () => evaluate("document.querySelector('form').requestSubmit()");
  const success = () =>
    until(
      () =>
        evaluate(
          "document.body.innerText.includes('Order Confirmed!') && document.body.innerText.includes('ORD-CHECKOUT-FIXTURE')",
        ),
      "confirmed receipt",
    );
  const cart = [{ product: checkoutLaptop, quantity: 1 }];
  const freshCart = async () => {
    // Only this isolated browser's fixture storage is reset; never a database.
    await evaluate(
      `localStorage.setItem('sellora-cart',${JSON.stringify(JSON.stringify(cart))});sessionStorage.removeItem('sellora_pending_checkout')`,
    );
    await navigate("/checkout");
    await fill();
  };
  await navigate(`/checkout/${checkoutLaptop.id}`);
  await fill();
  assert(!(await evaluate("document.body.innerText")).includes("Your cart is empty"));
  check("Buy Now loads a dynamic API laptop and checkout form with an empty cart");
  mock.mode("hold");
  const count = mock.writes.length;
  await evaluate(
    "document.querySelector('form').requestSubmit();document.querySelector('form').requestSubmit()",
  );
  await until(() => mock.writes.length === count + 1, "held checkout request");
  assert(await evaluate("document.querySelector('form fieldset').disabled"));
  assert(!(await evaluate("document.body.innerText")).includes("Order Confirmed!"));
  assert.match(mock.writes.at(-1).key, /^[A-Za-z0-9_-]{16,128}$/);
  assert.equal(mock.writes.at(-1).body.items.length, 1);
  assert.equal(mock.writes.at(-1).body.items[0].productId, checkoutLaptop.id);
  check("rapid duplicate submissions send one keyed request and cannot show success while pending");
  await mock.release();
  await success();
  check("Buy Now success is displayed only after a confirmed backend receipt");

  for (const mode of ["error409", "error401", "error503", "invalid-receipt"]) {
    mock.mode(mode);
    await freshCart();
    await evaluate("document.querySelector('form input[type=checkbox]').click()");
    const addresses = mock.addresses.length;
    await submit();
    await until(
      () =>
        evaluate(
          "Boolean(document.querySelector('[role=alert]')) && !document.querySelector('form fieldset').disabled",
        ),
      "checkout error " + mode,
    );
    assert(!(await evaluate("document.body.innerText")).includes("Order Confirmed!"));
    assert(!(await evaluate("document.body.innerText")).includes("ORD-FAKE"));
    assert.equal(await evaluate("JSON.parse(localStorage.getItem('sellora-cart')).length"), 1);
    assert.equal(mock.addresses.length, addresses);
    check(mode + " shows a clear error, retains the cart, and never saves an address/receipt");
  }
  mock.mode("network");
  await freshCart();
  await submit();
  await until(() => evaluate("Boolean(document.querySelector('[role=alert]'))"), "network failure");
  const retryKey = mock.writes.at(-1).key;
  mock.mode("hold");
  await evaluate("document.__checkoutLeaving = true");
  await cdp.send("Page.reload");
  await until(
    () =>
      evaluate(
        "!document.__checkoutLeaving&&Boolean(document.querySelector('form input[name=name]'))",
      ),
    "reload after ambiguous failure",
  );
  await fill();
  const retryCount = mock.writes.length;
  await submit();
  await until(() => mock.writes.length === retryCount + 1, "retry after reload");
  assert.equal(mock.writes.at(-1).key, retryKey);
  check(
    "network failure and page reload reuse the same request key instead of creating a new attempt",
  );
  await mock.release();
  await success();
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('sellora-cart')).length"), 0);
  check("cart is cleared only after a successful confirmed retry");

  await freshCart();
  await evaluate("document.querySelector('form input[type=checkbox]').click()");
  const addressCount = mock.addresses.length;
  await submit();
  await success();
  await until(
    () => mock.addresses.length === addressCount + 1,
    "optional address after confirmation",
  );
  check("optional address-book write runs only after the order has been confirmed");

  const unrelatedCart = [{ product: { ...checkoutLaptop, id: "other-laptop" }, quantity: 2 }];
  await evaluate(
    `localStorage.setItem('sellora-cart',${JSON.stringify(JSON.stringify(unrelatedCart))})`,
  );
  await navigate(`/checkout/${checkoutLaptop.id}`);
  await fill();
  await submit();
  await success();
  assert.equal(
    await evaluate("JSON.parse(localStorage.getItem('sellora-cart'))[0].product.id"),
    "other-laptop",
  );
  check("Buy Now does not clear an unrelated existing cart");

  for (const mode of ["product-missing", "product-empty", "product-unapproved"]) {
    mock.mode(mode);
    await cdp.send("Page.navigate", { url: `${origin}/checkout/${checkoutLaptop.id}` });
    await until(
      () =>
        evaluate(
          "Boolean(document.querySelector('[role=alert]')) && !document.querySelector('form')",
        ),
      mode,
    );
    check(mode + " disables checkout with an actionable error instead of a catalog fallback");
  }
  mock.mode("success");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await navigate(`/checkout/${checkoutLaptop.id}`);
  assert(await evaluate("document.documentElement.scrollWidth<=innerWidth+2"));
  check("shared Buy Now checkout fits mobile without horizontal overflow");
}
