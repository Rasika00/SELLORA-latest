import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { adminTrackingOrder } from "../../../tests/fixtures/admin-order-tracking";
import { createTrackingDraft, allowedNextStatuses } from "../../lib/admin-order-tracking";
import { ORDER_STATUSES } from "../../lib/api/order-tracking";
import { AdminTrackingForm } from "./AdminOrderTrackingModal";
import { TrackingDetails } from "../account/OrderTrackingModal";

for (const status of ORDER_STATUSES) {
  test(`admin form disables invalid transitions for ${status}`, () => {
    const order = { ...adminTrackingOrder, status };
    const html = renderToStaticMarkup(
      <AdminTrackingForm
        order={order}
        draft={createTrackingDraft(order)}
        onChange={() => {}}
        onSubmit={() => {}}
        busy={false}
        blocked={false}
      />,
    );
    const options = [...html.matchAll(/<option([^>]*)value="([^"]+)"([^>]*)>/g)];
    assert.equal(options.length, ORDER_STATUSES.length);
    for (const [, before, value, after] of options)
      assert.equal(
        `${before}${after}`.includes("disabled"),
        value !== status && !allowedNextStatuses(status).includes(value as typeof status),
      );
    assert.equal(
      /<select[^>]*\sdisabled(?:=|\s|>)/.test(html),
      status === "DELIVERED" || status === "CANCELLED",
    );
    assert.match(html, /<textarea[^>]*\sdisabled(?:=|\s|>)/);
  });
}
test("tracking notes become available only when changing status", () => {
  const draft = { ...createTrackingDraft(adminTrackingOrder), status: "PROCESSING" };
  const html = renderToStaticMarkup(
    <AdminTrackingForm
      order={adminTrackingOrder}
      draft={draft}
      onChange={() => {}}
      onSubmit={() => {}}
      busy={false}
      blocked={false}
    />,
  );
  assert.doesNotMatch(html, /<textarea[^>]*\sdisabled(?:=|\s|>)/);
  assert.match(html, /visible to the customer/);
  assert.doesNotMatch(html, /<button[^>]*\sdisabled(?:=|\s|>)/);
});
test("saving and reload-required forms disable every editable field and the submit button", () => {
  for (const [busy, blocked] of [
    [true, false],
    [false, true],
  ]) {
    const html = renderToStaticMarkup(
      <AdminTrackingForm
        order={adminTrackingOrder}
        draft={{ ...createTrackingDraft(adminTrackingOrder), carrierName: "Courier" }}
        onChange={() => {}}
        onSubmit={() => {}}
        busy={busy}
        blocked={blocked}
      />,
    );
    assert.match(html, /<fieldset[^>]*\sdisabled(?:=|\s|>)/);
    assert.match(html, /<button[^>]*\sdisabled(?:=|\s|>)/);
  }
});
test("admin tracking history includes supplied actor IDs and automatic-event attribution", () => {
  const html = renderToStaticMarkup(
    <TrackingDetails
      showActorInfo
      order={{
        ...adminTrackingOrder,
        trackingEvents: [
          adminTrackingOrder.trackingEvents[0],
          {
            id: "event-2",
            status: "PROCESSING",
            note: "Packing",
            actorId: "test-admin",
            createdAt: "2026-11-17T03:00:00.000Z",
          },
        ],
      }}
    />,
  );
  assert.match(html, /Automatic update/);
  assert.match(html, /Changed by: test-admin/);
  assert.match(html, /Packing/);
  assert.match(html, /dateTime="2026-11-17T03:00:00.000Z"/);
});
