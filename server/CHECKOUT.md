# Checkout reliability and inventory

`POST /api/orders` now requires an `Idempotency-Key` header (16–128 ASCII letters,
digits, `_` or `-`). The browser generates a random UUID for a checkout attempt.
It retains the key after an unconfirmed/network failure, including a reload.
Session expiry (`401`) also retains it. After signing in again with the same
customer account, retry the original details using the original key. A rejection
received after an earlier unconfirmed request does not clear that pending key.
Checkout stops before sending an order if browser session storage cannot safely
save the pending key. Only a fingerprint and opaque key are stored, not addresses.
Retry with the same key and the same order details. A confirmed replay returns
`200`; a newly committed order returns `201`. Both return `{ success: true,
order, replayed }`. Missing/invalid keys return `400`.

The existing unique `Order.id` is derived from the verified user ID (or guest
scope) and request key using SHA-256. No schema change or process-local cache is
needed. Retries check the saved contact, shipping, items and quoted totals before
returning a receipt. A different payload using an existing key returns `409`.
An idempotency key does not grant tracking access or link a guest order to a user.
Old orders created without keys are not retroactively made replayable.

Order creation uses a Serializable Prisma transaction:

1. Check for an already-committed keyed order.
2. Validate/aggregate quantities and load approved products from the database.
3. Compute prices and totals in integer cents; reject stale/tampered quotes.
4. Reserve stock with conditional atomic decrements, in product ID order.
5. Create the order, items and initial `PENDING` history as one nested write.

Failure rolls back the transaction, including all stock reservations. There is no
post-commit stock update. Serialization/unique conflicts can reconcile an existing
keyed order; otherwise they return `409`, without an automatic write retry.
Known stock/price rejections include `code: "CHECKOUT_REJECTED"`. Other conflicts
remain unconfirmed so the client retains the same key. The client never generates
a receipt or order number locally.

`requireSession: true` asks the server to reject a missing session with `401`;
the browser sends it when a cached login is present. It grants no identity.
Guest checkout remains supported. Client user IDs, emails and roles cannot assign
ownership; only verified session identity sets `Order.userId` and event `actorId`.

Cart `/checkout` and direct `/checkout/:productId` use the same form and submission
controller. Buy Now loads an approved in-stock API product and leaves an unrelated
cart intact. A cart clears only after a confirmed receipt. Optional address-book
saving occurs after confirmation and reports its own failure separately.

The current checkout collects no payment and sends no email. UI text describes
order confirmation rather than payment collection.

## Verification boundary

Automated service/API tests use in-memory transaction fixtures, including simulated
rollback and concurrent snapshots. Browser regressions intercept **every API
request**; no fixture request reaches the real backend. Run the browser suites:

```powershell
node --import tsx tests/order-tracking.browser.mjs
node --import tsx tests/order-tracking.browser.mjs --admin
node --import tsx tests/order-tracking.browser.mjs --checkout
```

Real PostgreSQL write, locking, response-loss/retry and rollback regression tests
need separate approval. Read-only checks must preserve the existing verified order
and all database rows. No seed, migrations, reset or schema deployment is needed
for this change.
