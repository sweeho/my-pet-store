# Fulfil only approved purchase orders

## Why

SWHM-T-0214 reports that `fulfillment/status.ts`'s `markOrderCompleted` completes an order that is
still `PENDING` or was explicitly `DENIED`, because its guard excludes only `null` and `COMPLETED`
and never requires `APPROVED`. Re-verified on this sprint branch by executing the code rather than
reading it — a throwaway integration test seeded orders directly and called the real functions:

- `markOrderCompleted` on a `DENIED` order returned `true` and left the row `COMPLETED`.
- `markOrderCompleted` on a `PENDING` order left the row `COMPLETED`.
- `processOrder` on a `DENIED` order with stock on hand shipped the line, **deducted inventory from
  100 to 95**, returned an invoice, and set the order `COMPLETED`.

The third result is not in the report, and it is what decides the shape of this change. The defect
is not only that a denial is overwritten; it is that a denied order is **fulfilled** — goods are
committed out of inventory and an invoice is produced for an order an administrator refused.
Guarding only the status write would leave that worse than it is today: shipped lines, deducted
stock, and an order permanently reading `DENIED`. So the gate belongs at the start of the fulfilment
pass, not only at its last step.

The root cause is an ordering of sprints, not a mistake in either of them. `fulfillment/` was
authored in `swhm-i-0010-order-fulfillment-shipping`, when `PENDING` and `COMPLETED` were the only
statuses a fulfilment run could meet, so "not already completed" was a complete guard.
`swhm-i-0011-order-approval-workflow` then introduced `PENDING → APPROVED | DENIED` as a gate in
front of fulfilment and correctly changed nothing under `fulfillment/`: no requirement in its delta
governs the fulfilment transition, so moving that code would have changed `fulfillment-management`
behaviour with no delta authorising it. The gap is between the two capabilities' specs, and neither
one is wrong on its own terms. `fulfillment-management` never said which orders may be fulfilled,
because when it was written every order that existed could be; `order-approval` scopes only its own
re-processing guard.

## What Changes

- **Require `APPROVED` to fulfil.** `fulfillment/fulfillment.ts`'s `processOrder` reads the order's
  status after confirming the order exists, and returns `null` without checking inventory, shipping
  a line or building an invoice when the status is anything other than `APPROVED`. An unknown order
  id still raises `OrderNotFoundError`, so the route still answers 404.
- **Require `APPROVED` to complete.** `fulfillment/status.ts`'s `markOrderCompleted` becomes a
  positive test — it writes `COMPLETED` only from `APPROVED`, and reports no change otherwise. The
  `null` and already-`COMPLETED` cases keep their existing answers as a consequence rather than as
  named exceptions.
- **Say so in the spec of record.** `fulfillment-management` gains a requirement stating the gate —
  the thing that was never specified — and its completion requirement is modified to name `APPROVED`
  as the status completion is reached from, with regression scenarios for the denied and pending
  cases that are wrong today.
- **Fix the tests that pin the current behaviour.** Sixteen existing assertions across three files
  seed orders as `PENDING` and expect them to fulfil; they are re-seeded as `APPROVED` and their
  "stays PENDING" expectations become "stays APPROVED". The browser journey needs the same
  correction and does not get it for free — see § Impact.
- **No new interface.** No exported signature changes, no schema change, no migration, no new error
  class and no new HTTP status. A non-approved order is answered 200 with a null invoice and its own
  unchanged status, exactly as an out-of-stock order already is.

## Impact

- **`fulfillment-management`** — one ADDED requirement (_Fulfil only approved purchase orders_) and
  one MODIFIED requirement (_Mark purchase orders as completed when all items are fulfilled_),
  reproducing both scenarios it already carries with `APPROVED` named in them and gaining a
  regression scenario for a re-run over a completed order.
- **`order-approval`** — unchanged. Its own guard is correct and this change does not touch it.
- **Code** — `fulfillment/status.ts` and `fulfillment/fulfillment.ts` only.
- **Tests** — `fulfillment/status.test.ts`, `fulfillment/fulfillment.test.ts`,
  `routes/api/fulfillment/process.post.test.ts` and `e2e/fulfillment.spec.ts`.
- **The browser journey will break unless it is corrected in the same commit.**
  `e2e/fulfillment.spec.ts` signs in as the seeded `jps_admin` account, places a real order through
  `POST /api/order`, and fulfils it expecting an invoice. That order is `PENDING`, not `APPROVED`:
  auto-approval reads the placing customer's `profiles.preferred_language`
  (`order/order.ts:65-72`), `jps_admin` is seeded straight into `auth_users` by `db/client.ts:68-71`
  and never gets a `profiles` row, only `account/customer.ts:40` creates one, and
  `decideApproval(null, …)` returns `PENDING` for a null locale (`order/approval.ts:20-23`). After
  this change that journey correctly fulfils nothing, so the spec must approve the order through
  `POST /api/admin/orders/decisions` between placing it and fulfilling it. This is the one part of
  the blast radius no unit tier reports, and it is observed only in CI.
- **Root docs** — `ARCHITECTURE.md` § Key Decisions gains one bullet, because the invariant this
  change establishes binds work beyond it: a capability that moves an order toward shipment reads
  the approval decision first. Nothing else moves — no capability is gained or lost, no topology,
  data model or integration point changes, and no design token, type scale, grid, interaction
  pattern or accessibility standard changes.

## Follow-ups / out of scope

Found while root-causing, not covered by SWHM-T-0214, and left for a later sprint. Planning has no
defect-creation authority by design, so they are recorded here rather than filed.

- **An auto-approved order never gets a supplier purchase order.** `order/decision.ts:41-43` calls
  `createSupplierPo` when an administrator approves, but `order/order.ts:107` sets `APPROVED` at
  placement for a small order and creates no PO row. `ARCHITECTURE.md` § Integration points
  describes the supplier PO as "a row the fulfilment capability reads", and fulfilment does not in
  fact read it — `fulfillment/fulfillment.ts` reads `orders` and `order_line_item` directly. So two
  approved orders reach fulfilment by different paths and only one of them leaves a PO behind.
  Requiring `APPROVED` is equivalent in effect and far smaller, which is why this change does not
  reach for the PO row; whether the PO is the record fulfilment should key on is a design question
  for whoever next touches that seam.
- **The seeded administrator has no profile, so every order it places is `PENDING`** regardless of
  amount, while an ordinary customer's identical order is auto-approved. That is development-data
  asymmetry rather than a product rule, and it is why the browser journey above has to approve its
  own order explicitly. Seeding a `profiles` row for `jps_admin` would remove the difference.
- **`fulfillment-management`'s spec of record still opens with a placeholder Purpose** — "TBD -
  created by archiving change swhm-i-0010-order-fulfillment-shipping." `order-approval` carries the
  same placeholder. A delta cannot fix either: the text lives in `openspec/specs/`, which the
  platform owns at archive time. Same carried-forward item recorded in SWHM-S-0010, SWHM-S-0011 and
  SWHM-S-0015 for five other capabilities.
