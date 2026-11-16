# Order Tracking — Phase 2

The database schema has **not** been applied. Do not run these APIs against the
shared database until the schema change is separately approved and applied.
There is no automatic migration, seed, reset, or history backfill in this feature.

## Authentication setup

The old login checked a password but did not authenticate later requests. Browser
localStorage, request IDs, roles, and emails are not proof of identity.

Configure a random `AUTH_SECRET` of at least 32 bytes in the backend environment.
Use the same secret across backend instances and keep it out of Git. For example,
generate a value locally with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

No secret has been created or installed by this change. Missing configuration
returns `503` for login, registration and protected endpoints. Guest checkout
remains available without a session.

Existing login/register endpoints retain their response shape and now set a
signed, expiring HttpOnly session cookie. Roles, active status and seller approval
are fetched from the database on authenticated requests. Sessions expire after
eight hours; changing a user's password hash invalidates their existing tokens.
Production cookies require HTTPS (`Secure`, `__Host-` prefix). Cookies use
`SameSite=Strict`; unsafe cross-origin requests are rejected. Use the existing
same-origin `/api` Vite proxy / hosting setup. Different-origin deployments need
an explicit authentication/CORS design; `AUTH_TRUSTED_ORIGINS` only configures the
origin guard, not credentialed CORS or cookie policy.

`POST /api/auth/logout` clears the browser cookie. Existing sign-out handlers wait
for that response. This is a stateless signed session, not a session table:
clearing a cookie does not revoke an already copied token; it expires after eight
hours or when the password hash/secret changes.

Users with old localStorage-only logins must log in again. Self-registration can
create customers or pending sellers, never admins. The earlier email-based admin
assignment has been removed. Existing admin accounts should be reviewed by the
project owner before deployment because earlier registration could grant admin
access based on the email text. This feature does not modify existing roles.

## Existing endpoints reused

- `POST /api/orders`: Order, items and initial `PENDING` event are one nested
  Prisma write. Only a verified session can set `Order.userId` / event `actorId`.
  Guest checkout ignores claimed user IDs and does not attach an order by email.
  Existing checkout totals, item handling, stock handling and response are retained.
- `PATCH /api/orders/:id/status`
- `PATCH /api/seller/orders/:orderId/fulfillment`

Both PATCH endpoints use the same validation/authorization/transaction service.
They accept:

```json
{
  "status": "SHIPPED",
  "carrierName": "Courier name",
  "trackingNumber": "PKG-123",
  "estimatedDelivery": "2026-11-20",
  "note": "Handed to the courier"
}
```

`status` is optional for delivery-only edits. Omitted delivery fields remain
unchanged; `null` clears them, as does an empty string for text fields. Dates must
be a real `YYYY-MM-DD` date (stored as UTC midnight) or an ISO timestamp with a
timezone. Invalid values return `400`. Carrier names are limited to 120 characters,
tracking numbers to 160, notes to 2000.

`courierName` is an alias for `carrierName`; existing `carrierNotes` is an alias for
`note`. Conflicting aliases return `400`. Client identity/actor/role fields are
ignored for authorization and history attribution.

Notes are customer-visible and are saved only when the status changes. A repeated
status never creates another event or saves a new note. Delivery-only edits also
create no history event. The response includes `historyCreated` so this is explicit.
Note-only requests return `400`.

## Transitions and permissions

| Current status | Allowed next statuses |
| -------------- | --------------------- |
| PENDING        | PROCESSING, CANCELLED |
| PROCESSING     | SHIPPED, CANCELLED    |
| SHIPPED        | DELIVERED             |
| DELIVERED      | none                  |
| CANCELLED      | none                  |

Same-status requests are idempotent. Unknown statuses return `400`; illegal
transitions return `409`. Status updates and their history event use a single
Serializable Prisma transaction and nested write. A status/timestamp condition
prevents stale writes; concurrency conflicts return `409` for reload/retry.

Only active admins or approved sellers owning **every** item may change an order.
Because the schema has a single order-wide status, mixed-seller orders require an
admin. Other sellers cannot change someone else's order, even by supplying that
seller's ID. Empty orders and products without sellers require an admin too.

Admin/order listings, deletion, role/approval changes and product ownership writes
are guarded to prevent alternate paths around order security. Customer order and
related private dashboard queries use the authenticated owner. Public product
reviews no longer expose order identifiers/status or customer email addresses.
Customer review deletion remains available for their own reviews.

## Tracking retrieval

`GET /api/orders/:id/tracking` returns `{ success: true, order: ... }` with:

- `id`, `orderNumber`, `status`, `carrierName`, `trackingNumber`, `estimatedDelivery`,
  `createdAt`, `updatedAt`;
- `trackingEvents`, ordered by `createdAt ASC, id ASC`, with each event's ID,
  status, note and timestamp. Only admin responses include event `actorId`.

Admins can read any order. Customers can read only orders linked to their verified
user ID. Approved sellers can read tracking for orders containing their products.
Inaccessible and missing orders both return `404`. No email/order-number lookup
grants private access. Guest orders and old unlinked orders need a separate verified
claim/guest-token flow; this change intentionally does not invent one. Existing
orders without events return an empty history, not fabricated events. Current
status and events are read in a RepeatableRead transaction for a consistent view.

## Verification

```powershell
node --import tsx --test server/order-tracking.test.ts server/order-api.test.ts server/browser-session.test.ts
node node_modules/typescript/bin/tsc --noEmit --pretty false --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --esModuleInterop --types node server/index.ts server/auth.ts server/order-tracking.ts server/order-tracking.test.ts server/order-api.test.ts server/browser-session.test.ts api/index.ts
node node_modules/typescript/bin/tsc --noEmit --pretty false
```

Tests use in-memory Prisma substitutes and an ephemeral local HTTP server, never a
database. They verify inputs, transitions, history writes, permissions, cookie
authentication, ownership filtering, checkout event nesting, and browser logout.
Real PostgreSQL constraints, transaction rollback/concurrency, database deployment,
browser checkout/dashboard flows and production HTTPS/proxy behavior remain
integration checks. Full-project type checking has existing errors in the admin
and seller product `detailedSpecs` objects; these are outside this feature.
