---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0017
ticket: SWHM-T-0192
branch: vortex/feat/SWHM-T-0192-order-fulfilment-processing-797542a8
upstream: [artifacts/SWHM-S-0017/SWHM-T-0192/PLAN.md]
downstream: [artifacts/SWHM-S-0017/qa-test-report.md]
---

# Summary — SWHM-T-0192: Order fulfilment processing

## What changed

Added `fulfillment/fulfillment.ts`'s `processOrder(orderId, shippingDate?)`, the orchestrator that
walks an order's lines inside one `db.transaction`, skipping shipped lines, shipping what
`checkInventory` allows, completing the order only when every line went out, and returning the
invoice XML from `createInvoice` or `null` when nothing shipped this run. No screen is built here —
PLAN.md § Design reference states none is in scope for this ticket, and the ticket's ownership list
carries no UI file.

## Files

- `fulfillment/fulfillment.ts` — new; `processOrder`, composing `checkInventory`/`reduceQuantity`
  (inventory.ts), `isAlreadyShipped`/`markLineShipped`/`readLineItems` (line-items.ts),
  `markOrderCompleted` (status.ts) and `createInvoice` (invoice.ts). No held-quantity comparison, no
  status string and no XML appears in this file — those stay in the four dependency modules, which
  are unmodified.
- `fulfillment/fulfillment.test.ts` — new; see `tdd-test-result.md`.

## AC coverage

- AC-1 (invoice XML returned on successful fulfillment) — `fulfillment.ts`'s final `createInvoice`
  call, when `fulfilledLines.length > 0`; `fulfillment.test.ts › PT-02`.
- AC-2 (null returned when no items fulfilled) — the `fulfilledLines.length === 0` branch;
  `› PT-03`.
- AC-3 (a partially fillable order ships what it can, and a second run tops up without double
  deduction) — `checkInventory`'s per-line, non-transactional stock check plus `isAlreadyShipped`'s
  skip; `› PT-04` (partial run) and `› PT-05` (second run after restocking, deducting the
  already-shipped item exactly once across both runs).

## Verification

```
$ bun --bun vitest run fulfillment/fulfillment.test.ts
 Test Files  1 passed (1)
      Tests  7 passed (7)

$ bun run verify
✓ lint  ✓ typecheck
 Test Files  105 passed (105)
      Tests  668 passed (668)
```

`bun run verify:full` also ran; its `test:e2e` step fails only at the Chromium preflight (container
has no browser installed — the same limitation six prior tickets in this sprint recorded in
`AGENTS.md`), not retried per that note. Full detail and the red→green proof are in
`tdd-test-result.md`.

## Notes

`shippingDate` defaults to `new Date()` in the function signature rather than being read from a
clock inside the transaction body, so every test in `fulfillment.test.ts` passes a fixed date
explicitly (PLAN.md step 7) — none of the assertions depend on wall-clock time.

Two behaviours beyond the stated acceptance criteria were also asserted, since PLAN.md's Definition
of Done and design.md § Spec discrepancies S6 name them directly: an already-shipped line is skipped
without an inventory check (`› PT-06`), and a failure partway through the pass leaves no deduction,
no shipped-quantity write and no status change (`› PT-07`).
