---
ticket: SWHM-T-0191
title: Line item shipment tracking
---

## What changed

Added `fulfillment/line-items.ts`, the module fixed by `PLAN.md` § Fixed interface
contracts: `readLineItems` (order's lines by `line_number`), `isAlreadyShipped`
(`quantityShipped === quantity`), and `markLineShipped` (writes the line's own full
quantity against its `(order_id, line_number)` composite key). No schema change — the
`quantity_shipped` column and its default-0 already existed (F1, F4); 7.1/7.2 are
satisfied by the tests confirming that shape, not by a migration.

## Files touched

- `fulfillment/line-items.ts` (new) — the three exports.
- `fulfillment/line-items.test.ts` (new) — 10 integration tests against the real
  in-memory db (`server` Vitest project).
- `artifacts/SWHM-S-0017/SWHM-T-0191/tdd-test-result.md` (new)
- `artifacts/SWHM-S-0017/SWHM-T-0191/summary.md` (new)

No other file was modified — `db/schema.ts`, `order/`, and sibling `fulfillment/`
modules are untouched, per the ticket's ownership boundary.

## Acceptance criteria coverage

- AC "Shipped quantity is set to ordered quantity" (quantity=50 → quantityShipped=50):
  LT-08.
- AC "Shipped quantity tracks fulfillment progress": LT-09 (quantity=100, full
  fulfilled quantity written).
- AC "Shipped line items are skipped" (quantity=50, quantityShipped=50): LT-05.
- AC "Partially shipped items are skipped" (same GIVEN as above, per design.md § S6 —
  no intermediate state can arise because `markLineShipped` only ever writes the full
  quantity, D3): LT-06.

## Verification

```
$ bun run test -- fulfillment/line-items.test.ts   → 1 file, 10 tests passed
$ bun run verify:full
  lint     → pass
  typecheck→ pass
  test     → 101 files, 640 tests passed
  test:e2e → Chromium not installed in this container (documented gap, see
             AGENTS.md § Notes from previous agents); not retried, runs in CI/QA
```

## Notes

- No `db.transaction()` — a single-row update needs none (plan step 5).
- `markLineShipped` takes the whole `FulfillmentLine`, not a bare quantity, so no
  caller can write an arbitrary figure (D3).
