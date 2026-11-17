// Admin scenarios for the shared isolated-browser harness. Every API response is mocked.
// Run: node --import tsx tests/order-tracking.browser.mjs --admin
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

export async function runAdminBrowserChecks({
  cdp,
  until,
  delay,
  check,
  origin,
  setMode,
  setListStatus,
  reset,
  writes,
  tracking,
  releaseWrites,
}) {
  const text = "document.querySelector('[role=dialog]')?.innerText || ''";
  const evalPage = (expression) => cdp.evaluate(expression);
  cdp.listeners.set("Page.javascriptDialogOpening", () => {
    void cdp.send("Page.handleJavaScriptDialog", { accept: true });
  });
  const click = async (label) =>
    evalPage(
      `(() => {const button=[...document.querySelectorAll('button')].find(button=>button.innerText.trim()===${JSON.stringify(label)});if(!button)throw new Error('Button missing: '+${JSON.stringify(label)});button.focus();button.click();})()`,
    );
  const field = async (name, value) =>
    evalPage(
      `(() => {const element=document.querySelector('[role=dialog] [name="${name}"]');if(!element)throw new Error('Field missing');const prototype=element.tagName==='SELECT'?HTMLSelectElement.prototype:element.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,${JSON.stringify(value)});element.dispatchEvent(new Event(element.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`,
    );
  const waitReady = () =>
    until(
      () =>
        evalPage(
          "Boolean(document.querySelector('[role=dialog] form')) && !document.querySelector('[role=dialog] [aria-busy=true]')",
        ),
      "admin tracking ready",
    );
  const open = async (mode) => {
    setMode(mode);
    await click("Manage tracking");
    await waitReady();
  };
  const close = async () => {
    await click("Close tracking");
    await until(() => evalPage("!document.querySelector('[role=dialog]')"), "tracking close");
  };
  const saved = () =>
    until(
      () =>
        evalPage(
          `(${text}).includes('Update confirmed.') || (${text}).includes('Tracking updated.')`,
        ),
      "confirmed update",
    );
  await cdp.send("Page.navigate", { url: `${origin}/admin` });
  await until(
    () => evalPage("document.body.innerText.includes('SELLORA ADMIN')"),
    "admin dashboard",
  );
  await until(
    () =>
      evalPage(
        "document.querySelector('div.transition-opacity.duration-700')?.classList.contains('pointer-events-none') === false",
      ),
    "startup overlay",
  );
  await evalPage(
    "[...document.querySelectorAll('nav button')].find(button=>button.innerText.trim()==='Orders').click()",
  );
  await until(
    () => evalPage("document.body.innerText.includes('Manage tracking')"),
    "existing order-management tab",
  );
  assert(
    await evalPage(
      "document.body.innerText.includes('Info') && document.body.innerText.includes('Invoice')",
    ),
  );
  check("tracking is integrated into existing order management alongside Info and Invoice actions");
  await open("ready");
  assert.deepEqual(
    await evalPage(
      "[...document.querySelector('[name=status]').options].filter(option=>!option.disabled).map(option=>option.value)",
    ),
    ["PENDING", "PROCESSING", "CANCELLED"],
  );
  assert(await evalPage("document.querySelector('[name=note]').disabled"));
  assert(await evalPage("document.querySelector('form button[type=submit]').disabled"));
  check("PENDING exposes only allowed transitions and unchanged tracking cannot be submitted");
  await field("carrierName", "Admin Test Courier");
  await field("trackingNumber", "ADMIN-PKG-1");
  await field("estimatedDelivery", "2026-11-20");
  const beforeDetail = writes().length;
  setMode("hold-write");
  await click("Save tracking changes");
  await until(() => writes().length === beforeDetail + 1, "pending PATCH");
  assert(!(await evalPage(text)).includes("Update confirmed"));
  assert(await evalPage("document.querySelector('form fieldset').disabled"));
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
  assert(await evalPage("Boolean(document.querySelector('[role=dialog]'))"));
  check("saving waits for backend confirmation, disables edits and prevents accidental close");
  await releaseWrites();
  await saved();
  await waitReady();
  assert.deepEqual(writes().at(-1), {
    carrierName: "Admin Test Courier",
    trackingNumber: "ADMIN-PKG-1",
    estimatedDelivery: "2026-11-20",
  });
  assert.equal(tracking().trackingEvents.length, 1);
  check("delivery-only writes omit status/note and refresh without creating a history event");
  await field("status", "PROCESSING");
  assert(!(await evalPage(text)).includes("Update confirmed"));
  await field("note", "Packing started by the test admin");
  await click("Save tracking changes");
  await until(
    () =>
      evalPage(
        `(${text}).includes('Packing started by the test admin') && (${text}).includes('Tracking updated.')`,
      ),
    "new status history",
  );
  await waitReady();
  assert.equal(tracking().status, "PROCESSING");
  assert.equal(tracking().trackingEvents.at(-1).actorId, "test-admin");
  assert((await evalPage(text)).includes("Changed by: test-admin"));
  check("a status change saves its note, reloads actual history and displays the supplied actor");
  await field("status", "SHIPPED");
  await field("note", "Draft superseded by another administrator");
  const beforeConflict = writes().length;
  setMode("conflict");
  await click("Save tracking changes");
  await until(
    () => evalPage(`(${text}).includes('Latest tracking loaded. Review it and retry')`),
    "409 reload",
  );
  await waitReady();
  assert.equal(writes().length, beforeConflict + 1);
  assert.equal(await evalPage("document.querySelector('[name=status]').value"), "SHIPPED");
  assert.equal(await evalPage("document.querySelector('[name=note]').value"), "");
  assert(await evalPage("document.querySelector('form button[type=submit]').disabled"));
  check(
    "409 reloads the latest state and requires a fresh manual retry without resubmitting the old draft",
  );
  setMode("ready");
  await field("status", "DELIVERED");
  await field("note", "Delivery recorded by the test admin");
  await click("Save tracking changes");
  await until(
    () =>
      evalPage(
        `(${text}).includes('Delivery recorded by the test admin') && (${text}).includes('Tracking updated.')`,
      ),
    "delivery update",
  );
  await waitReady();
  assert(await evalPage("document.querySelector('[name=status]').disabled"));
  const terminalEvents = tracking().trackingEvents.length;
  await field("trackingNumber", "FINAL-TRACKING");
  await click("Save tracking changes");
  await saved();
  await waitReady();
  assert.equal(tracking().trackingEvents.length, terminalEvents);
  check("DELIVERED is terminal while delivery fields remain editable without extra history");
  await field("carrierName", "");
  await field("trackingNumber", "");
  await field("estimatedDelivery", "");
  await click("Save tracking changes");
  await saved();
  await waitReady();
  assert.deepEqual(writes().at(-1), {
    carrierName: null,
    trackingNumber: null,
    estimatedDelivery: null,
  });
  await close();
  check("clearing optional courier, tracking number and delivery date sends explicit null values");

  for (const status of [400, 401, 403, 404, 503]) {
    reset();
    await open("ready");
    await field("carrierName", "Unconfirmed courier");
    setMode(`write-error${status}`);
    await click("Save tracking changes");
    await until(
      () => evalPage("Boolean(document.querySelector('[role=dialog] [role=alert]'))"),
      `write HTTP ${status}`,
    );
    assert(!(await evalPage(text)).includes("Update confirmed"));
    if (status === 401)
      assert(await evalPage("Boolean(document.querySelector('[role=dialog] a[href=\"/login\"]'))"));
    if ([401, 403, 404].includes(status))
      assert(!(await evalPage("Boolean(document.querySelector('[role=dialog] form'))")));
    if (status === 503) assert(await evalPage("document.querySelector('form fieldset').disabled"));
    if (status === 400)
      assert(!(await evalPage("document.querySelector('form fieldset').disabled")));
    await close();
    check(`write HTTP ${status} never reports success and keeps authorization/retry behavior safe`);
  }
  reset();
  await open("ready");
  await field("carrierName", "Network test");
  setMode("write-network");
  await click("Save tracking changes");
  await until(
    () => evalPage(`(${text}).includes('The update was not confirmed')`),
    "ambiguous network failure",
  );
  assert(await evalPage("document.querySelector('form button[type=submit]').disabled"));
  setMode("ready");
  await click("Refresh tracking");
  await waitReady();
  await close();
  check("network failures require a fresh read before another write, with no false success");
  reset();
  await open("ready");
  await field("status", "PROCESSING");
  setMode("conflict-read-fail");
  await click("Save tracking changes");
  await until(
    () => evalPage(`(${text}).includes('Could not reload the latest tracking')`),
    "failed conflict reload",
  );
  assert(!(await evalPage("Boolean(document.querySelector('[role=dialog] form'))")));
  setMode("ready");
  await click("Refresh tracking");
  await waitReady();
  await close();
  check("a failed 409 reload blocks edits until the current tracking can be fetched");
  reset();
  await open("ready");
  await field("carrierName", "Confirmed courier");
  setMode("saved-read-fail");
  await click("Save tracking changes");
  await until(
    () =>
      evalPage(
        `(${text}).includes('Update confirmed, but the latest history could not be loaded')`,
      ),
    "confirmed write with failed history reload",
  );
  assert(!(await evalPage("Boolean(document.querySelector('[role=dialog] form'))")));
  setMode("ready");
  await click("Refresh tracking");
  await waitReady();
  assert.equal(
    await evalPage("document.querySelector('[name=carrierName]').value"),
    "Confirmed courier",
  );
  await close();
  check("confirmed writes and failed history refreshes are reported separately");
  for (const status of [401, 403, 404, 503]) {
    reset();
    setMode(`error${status}`);
    await click("Manage tracking");
    await until(
      () => evalPage("Boolean(document.querySelector('[role=dialog] [role=alert]'))"),
      `tracking read HTTP ${status}`,
    );
    assert(!(await evalPage("Boolean(document.querySelector('[role=dialog] form'))")));
    await close();
    check(`tracking read HTTP ${status} cannot expose an editable admin form`);
  }
  reset();
  await open("ready");
  await field("status", "CANCELLED");
  await field("note", "Cancelled by the test admin");
  await click("Save tracking changes");
  await until(
    () =>
      evalPage(
        `(${text}).includes('Cancelled by the test admin') && (${text}).includes('Tracking updated.')`,
      ),
    "cancellation",
  );
  await waitReady();
  assert(await evalPage("document.querySelector('[name=status]').disabled"));
  await close();
  check("CANCELLED is terminal and its recorded note is retained in history");
  reset();
  await open("empty");
  assert((await evalPage(text)).includes("No tracking updates have been recorded"));
  await close();
  check("empty admin history has an honest empty state");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  reset();
  await open("long");
  const dimensions = await evalPage(
    "(() => {const dialog=document.querySelector('[role=dialog]');const rect=dialog.getBoundingClientRect();return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:innerWidth,height:innerHeight,scroll:dialog.scrollWidth,client:dialog.clientWidth};})()",
  );
  assert(
    dimensions.left >= 0 &&
      dimensions.right <= dimensions.width + 1 &&
      dimensions.top >= 0 &&
      dimensions.bottom <= dimensions.height + 1,
    JSON.stringify(dimensions),
  );
  assert(dimensions.scroll <= dimensions.client + 1, JSON.stringify(dimensions));
  const screenshot = await cdp.send("Page.captureScreenshot", { format: "png" });
  const screenshotPath = join(tmpdir(), "sellora-phase4-admin-tracking-mobile.png");
  await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
  console.log(`Admin mobile screenshot: ${screenshotPath}`);
  await close();
  check("admin tracking fits mobile screens with long tracking IDs and notes");
  setMode("ready");
  setListStatus(403);
  await cdp.send("Page.reload");
  await until(
    () => evalPage("Boolean(document.querySelector('main [role=alert]'))"),
    "admin listing forbidden",
  );
  assert(!(await evalPage("document.body.innerText")).includes("Manage tracking"));
  check("a local admin label cannot bypass a server-denied order listing");
  setListStatus(200);
  await evalPage(
    "localStorage.setItem('sellora_user',JSON.stringify({id:'test-customer',email:'test@example.test',role:'customer'}))",
  );
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source:
      "localStorage.setItem('sellora_user',JSON.stringify({id:'test-customer',email:'test@example.test',role:'customer'}))",
  });
  await cdp.send("Page.reload");
  await until(
    () => evalPage("document.body.innerText.includes('Administrator Access Required')"),
    "non-admin route guard",
  );
  assert(!(await evalPage("document.body.innerText")).includes("Manage tracking"));
  assert(!(await evalPage("document.body.innerText")).includes("Sample Admin"));
  check("non-admin browser sessions see the existing access guard without sample credentials");
  await delay(50);
}
