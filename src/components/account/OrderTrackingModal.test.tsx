import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { trackingOrder } from "../../../tests/fixtures/order-tracking";
import { OrderRequestError } from "../../lib/api/order-tracking";
import { OrderRequestErrorNotice, TrackingDetails } from "./OrderTrackingModal";

test("tracking renders actual delivery details, recorded timestamps and event notes", () => {
  const html = renderToStaticMarkup(<TrackingDetails order={trackingOrder} />);
  for (const text of [
    "Test Courier",
    "TEST-PKG-123",
    "Handed to the courier",
    "Preparing your order",
    'aria-current="step"',
    'dateTime="2026-11-18T04:00:00.000Z"',
  ])
    assert(html.includes(text), text);
  assert(html.indexOf("Preparing your order") < html.indexOf("Handed to the courier"));
  assert.doesNotMatch(html, /24 - 48|Thermal QC|Refunded|Express Dispatch/);
});

test("empty history shows its own message without inventing history records", () => {
  const html = renderToStaticMarkup(
    <TrackingDetails order={{ ...trackingOrder, trackingEvents: [] }} />,
  );
  assert.match(html, /No tracking updates have been recorded/);
  assert.doesNotMatch(html, /aria-label="Recorded tracking history"/);
  assert.match(html, /Shipped/);
});

test("missing courier information displays honest empty values", () => {
  const html = renderToStaticMarkup(
    <TrackingDetails
      order={{ ...trackingOrder, carrierName: null, trackingNumber: null, estimatedDelivery: null }}
    />,
  );
  assert.equal((html.match(/Not provided/g) || []).length, 3);
  assert.doesNotMatch(html, /Test Courier|TEST-PKG-123|24 - 48/);
});

test("cancelled orders are never presented as delivered or refunded", () => {
  const html = renderToStaticMarkup(
    <TrackingDetails order={{ ...trackingOrder, status: "CANCELLED", trackingEvents: [] }} />,
  );
  assert.match(html, /This order has been cancelled/);
  assert.doesNotMatch(html, /Order progress steps|refunded|Refunded/);
});

test("unknown statuses do not imply completed delivery stages", () => {
  const html = renderToStaticMarkup(
    <TrackingDetails order={{ ...trackingOrder, status: "AWAITING_PICKUP", trackingEvents: [] }} />,
  );
  assert.match(html, /AWAITING_PICKUP/);
  assert.match(html, /A progress timeline is not available/);
  assert.doesNotMatch(html, /aria-current="step"/);
});

test("tracking notes are escaped as text rather than executed as HTML", () => {
  const html = renderToStaticMarkup(
    <TrackingDetails
      order={{
        ...trackingOrder,
        trackingEvents: [
          { ...trackingOrder.trackingEvents[0], note: '<script>alert("test")</script>' },
        ],
      }}
    />,
  );
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test("expired sessions offer sign-in rather than an email tracking bypass", () => {
  const html = renderToStaticMarkup(
    <OrderRequestErrorNotice error={new OrderRequestError("session", 401)} onRetry={() => {}} />,
  );
  assert.match(html, /href="\/login"/);
  assert.match(html, /Sign in again/);
  assert.doesNotMatch(html, /<input|email=|userId=/);
});

test("network, missing-order and unavailable errors stay actionable", () => {
  for (const kind of [
    "network",
    "not-found",
    "unavailable",
    "forbidden",
    "timeout",
    "invalid-response",
  ] as const) {
    const html = renderToStaticMarkup(
      <OrderRequestErrorNotice error={new OrderRequestError(kind)} onRetry={() => {}} />,
    );
    assert.match(html, /role="alert"/);
    assert.match(html, /Try again/);
  }
});
