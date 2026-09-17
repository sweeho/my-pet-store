---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0019
ticket: SWHM-T-0214
branch: vortex/fix/SWHM-T-0214-fulfilment-completes-an-order-without-re-69acc19a
upstream: [artifacts/SWHM-S-0019/SWHM-T-0214/PLAN.md]
downstream: [artifacts/SWHM-S-0019/qa-test-report.md]
---

# Fix note — SWHM-T-0214: Fulfilment completes an order without requiring APPROVED

## Root cause

`fulfillment/status.ts`'s `markOrderCompleted` guarded against completion by exclusion
(`status === null || status === "COMPLETED"`) rather than by a positive test for the one status
that should be completable. `APPROVED` was never required, so any non-terminal, non-completed
status — including `DENIED` and `PENDING` — passed the guard and was written to `COMPLETED`.
`fulfillment/fulfillment.ts`'s `processOrder` compounded this: nothing before its inventory loop
read the order's status at all, so a `DENIED` order's lines were checked against inventory, shipped,
and invoiced before `markOrderCompleted` was ever reached. Confirmed Planning's RCA in design.md
F1–F4 by re-running the reproduction on this branch: a `DENIED` order holding 100 units shipped its
line, deducted inventory to 95, produced an invoice, and ended `COMPLETED`.

## Fix

Added `isFulfillable(status: OrderStatus): boolean` to `fulfillment/status.ts` — `status ===
"APPROVED"` — as the single place the rule is written (design.md D1, D3). `markOrderCompleted` now
writes `COMPLETED` only when `isFulfillable` is true, keeping its existing answers for an unknown
order and an already-`COMPLETED` one as consequences of the same predicate rather than separate
exclusions. `processOrder` reads the status via `readOrderStatus` immediately after
`readInvoiceOrder` (so an unknown id still raises `OrderNotFoundError` → still 404, AC-4) and
returns `null` before any inventory check, shipped-quantity write or invoice when the order is not
fulfillable (design.md D2). The route handler needed no change — it already answers `{ orderId,
invoice: null, status }` for a null invoice (design.md D4/D9), and now serves that answer for a
refused order too, with the order's own unchanged status.

Fixed at the two points design.md identified rather than adding a third guard in the route: the
predicate lives once in `status.ts`, and both call sites decide through it, so they cannot disagree
again the way the original code did.

## Regression test

- `fulfillment/status.test.ts › ST-07/ST-08/ST-09` — `markOrderCompleted` refuses `PENDING` and
  `DENIED`, leaving the row untouched; `isFulfillable` is true only for `APPROVED`.
- `fulfillment/fulfillment.test.ts › PT-08/PT-09/PT-10` — a `DENIED` and a `PENDING` order holding
  stock ship nothing, deduct no inventory, produce no invoice, and keep their status (AC-1, AC-2); a
  second run over `COMPLETED` changes nothing further (AC-7).
- `routes/api/fulfillment/process.post.test.ts › PT-07/PT-08` — the route answers 200 with `{
invoice: null, status }` unchanged for `DENIED` and `PENDING` orders.
- `e2e/fulfillment.spec.ts` — the browser journey now approves the order it places before
  fulfilling it, and a second case denies an order and asserts the run ships nothing.

Red→green recorded in `tdd-test-result.md`.

## Files touched

- `fulfillment/status.ts` — added `isFulfillable`; `markOrderCompleted`'s guard rewritten as a
  positive test through it.
- `fulfillment/fulfillment.ts` — `processOrder` reads status and refuses a non-fulfillable order
  before any inventory check; corrected a comment that still said "stays PENDING".
- `fulfillment/status.test.ts` — re-seeded APPROVED for the completion-success cases; added
  PENDING/DENIED regression cases and an `isFulfillable` unit test.
- `fulfillment/fulfillment.test.ts` — re-seeded APPROVED across PT-02…PT-07 and corrected their
  "stays PENDING" expectations to APPROVED; added PT-08/PT-09/PT-10 regression cases.
- `routes/api/fulfillment/process.post.test.ts` — `seedOrder` takes a status (default APPROVED);
  corrected two APPROVED-path expectations; added PT-07/PT-08 regression cases.
- `e2e/fulfillment.spec.ts` — approves the placed order before fulfilling it; added a DENIED-order
  case.
