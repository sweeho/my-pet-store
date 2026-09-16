---
ticket: SWHM-T-0188
type: summary
---

# Summary — SWHM-T-0188

## What changed

Added `fulfillment/inventory.ts`: the module that answers whether a line can
be filled and, when it can, takes the stock. Three exports, matching
`PLAN.md`'s fixed interface contracts exactly:

- `getInventoryQuantity(itemid)` — a missing row reads as 0 (D5).
- `checkInventory(line)` — compares held quantity against the line's full
  `quantity` (D3, no partial-line arithmetic); a successful check reduces
  stock as its side effect, a failed one writes nothing.
- `reduceQuantity(itemid, quantity)` — decrements the held quantity.

No transaction is opened in this module — atomicity comes from the caller's
`db.transaction` (SWHM-T-0192), per D2/S2.

## Files touched

- `fulfillment/inventory.ts` (new) — the three exports above.
- `fulfillment/inventory.test.ts` (new) — 7 integration tests against the
  real in-memory db.
- `artifacts/SWHM-S-0017/SWHM-T-0188/tdd-test-result.md` (new)
- `artifacts/SWHM-S-0017/SWHM-T-0188/summary.md` (new, this file)

No other file was modified — `fulfillment/types.ts`, `fulfillment/errors.ts`
and `db/schema.ts` are untouched, per ticket ownership.

## Acceptance criteria coverage

- AC "Inventory check for available items" → IT-03, IT-04 (`checkInventory`
  returns `true` and stock is reduced).
- AC "Inventory check for unavailable items" → IT-05, IT-06 (`checkInventory`
  returns `false`, quantity untouched).
- AC "Inventory quantity is reduced after fulfillment" → IT-04 exactly
  reproduces the scenario's figures: 100 held, 30 ordered → 70 left.
- AC "Inventory reduction is atomic" → satisfied structurally: this module
  performs its read-then-write with no transaction of its own, so it composes
  cleanly inside the caller's single `db.transaction` (D2). The composed
  atomicity guarantee is asserted by that caller's own test, not here.

## Verification

- `bun --bun vitest run fulfillment/inventory.test.ts` — 7/7 passed (red
  confirmed first: module did not exist).
- `bun run verify` (lint + typecheck + full unit suite) — 637/637 tests
  passed, lint and typecheck clean.
- `bun run verify:full` — attempted; its E2E preflight reports Chromium is
  not installed in this container (documented in `AGENTS.md`). This ticket
  adds no screen and no E2E spec, so the fallback to `verify` is the
  documented one, not a gap in this ticket's coverage.
