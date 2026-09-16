---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0140
branch: vortex/feat/SWHM-T-0140-checkout-seam-cart-to-order-line-items-12f11c7e
upstream: [artifacts/SWHM-S-0013/SWHM-T-0140/PLAN.md]
downstream: [swhm-i-0008-order-submission-checkout calls toOrderLineItems/clearCartAfterOrder]
---

# Summary — SWHM-T-0140: Checkout seam — cart to order line items

## What changed

Added `cart/checkout.ts`: `toOrderLineItems(sessionId)` maps every current cart line onto the
`order_line_item` shape that already exists in `db/schema.ts` (F10) — `itemid`, `quantity`,
`unitPrice`, `lineNumber` — with no new table and no parallel type. `unitPrice` is the cart line's
`unitCost` captured at call time (a plain value copied out of `getCart`'s result), never a later
reference back to `item.unit_cost`, per the price-paid decision in `ARCHITECTURE.md` § Key
Decisions. `lineNumber` is the 1-based array index, contiguous and unique by construction, matching
the `(order_id, line_number)` composite key the table declares; `order_id` itself is left to the
future caller. `clearCartAfterOrder(sessionId)` delegates to the already-landed `clearCart`
(SWHM-T-0137) rather than deleting rows itself. Per S8/PLAN.md, this ticket builds the seam only —
no order route, page, creation function, or `db/schema.ts` edit; `swhm-i-0008` is the caller.

## Files

- `cart/checkout.ts` — new: `toOrderLineItems`, `clearCartAfterOrder`, the `OrderLineItem` type.
- `cart/checkout.test.ts` — new: CO-01..CO-06.

## AC coverage

- AC-1 (fixed `toOrderLineItems`/`clearCartAfterOrder` signatures) — `cart/checkout.ts`.
- AC-2 (`unitPrice` captured at call time, not a later read) — CO-03: mutates `item.unit_cost` in the db after the call and asserts the returned mapping is unchanged.
- AC-3 (`lineNumber` from 1 upward, no gaps, no repeats) — CO-02.
- AC-4 (empty cart returns `[]`) — CO-04.
- AC-5 (`clearCartAfterOrder` leaves `count` 0, delegates to `clearCart`) — CO-05, CO-06; delegation is structural — `clearCartAfterOrder`'s body is the single call `clearCart(sessionId)`, no row deletion of its own.
- AC-6 (all `cart/checkout.test.ts` assertions pass) — see `tdd-test-result.md`, `TDD-RESULT: 487 passed, 0 failed`.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  83 passed (83)
      Tests  487 passed (487)
```

`bun run verify:full`'s E2E preflight reported Chromium is genuinely not installed in this
container; fell back to `bun run verify` per the repository's own notes on implementation
containers. This ticket has no user-visible surface and adds no `e2e/` spec.
