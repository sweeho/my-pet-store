---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0157
branch: vortex/feat/SWHM-T-0157-line-item-creation-from-cart-contents-1d3f9b9f
upstream: [artifacts/SWHM-S-0014/SWHM-T-0157/PLAN.md]
---

# Summary — SWHM-T-0157: Line item creation from cart contents

## What changed

Added `createLineItems(orderId, sessionId)` to `order/order.ts`. It calls the existing
`toOrderLineItems(sessionId)` seam in `cart/checkout.ts` (built last sprint, no caller until now),
inserts one `order_line_item` row per cart line, and sets the order's `order_amount` to the sum of
`quantity * unitPrice` across those lines. It does not clear the cart and does not wrap anything in
a transaction — both are SWHM-T-0158's, per `PLAN.md`'s scope boundary.

Extended `cart/checkout.ts`'s `toOrderLineItems` additively with `catid` and `productid` — the one
thing the seam didn't already carry, because `CartItem` stores quantity only and resolves
everything else from the catalogue on read (design.md F4). Resolved via `catalog/item.ts`'s
`getItem(itemId, locale)`, which already joins through to `product.catid`/`product.productid`
(`Item.category`/`Item.productId`); `toOrderLineItems` calls it a second time per cart line since
`CartItem` (owned by `cart/cart.ts`, out of scope here) doesn't carry those fields through from
`getCart`'s own internal call. Added `UnknownItemError` as a defensive throw for the case where the
catalogue lookup misses on this second call after `getCart` already resolved it once — unreachable
in practice (no concurrent writer), required by strict null checking on `Item | null`.

`order/order.ts` importing `cart/checkout.ts` is one-directional; `cart/checkout.ts` has no
dependency back on `order/`, so there is no cycle.

## Files

- `order/order.ts` — added `createLineItems(orderId, sessionId)`.
- `order/order.test.ts` — added `describe("createLineItems", ...)`: LI-01 through LI-06, plus
  `seedSession`/`seedFullItem`/`readLineItems` helpers mirroring `cart/checkout.test.ts`'s.
- `cart/checkout.ts` — `toOrderLineItems` now also resolves and returns `catid`/`productid`.
- `cart/checkout.test.ts` — added CO-07 for the two new fields; CO-01 through CO-06 unchanged.

## AC coverage

- AC-1 (3 line items, quantities/unit prices from the cart) — `order/order.test.ts` LI-01.
- AC-2 (categoryId, productId, itemId on each line) — LI-02.
- AC-3 (line numbers 1-upward, contiguous, matching the `(order_id, line_number)` key) — LI-03.
- AC-4 (unit_price captured at placement; a later catalogue price change doesn't affect it) — LI-04.
- AC-5 (quantity_shipped is 0 on a new order) — LI-05.
- AC-6 (order_amount = sum of quantity × unit price, matches the cart's subtotal) — LI-06.
- AC-7 (`toOrderLineItems` carries catid/productid additively; existing assertions unchanged) —
  `cart/checkout.test.ts` CO-07 is new; CO-01 through CO-06 pass unmodified (verified in the red
  run — 13 pre-existing tests passed before any implementation code changed).
- Full `TDD-RESULT: 551 passed, 0 failed` — `tdd-test-result.md`.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  88 passed (88)
      Tests  551 passed (551)
```

`bun run verify:full`'s E2E preflight reported Chromium is genuinely not installed in this
container; fell back to `bun run verify` per the repository's own notes on implementation
containers. This ticket has no user-visible surface (both changed modules are server-side, with no
route wired to `createLineItems` yet) and adds no `e2e/` spec.

## Notes

- No cart clearing and no `db.transaction()` — both are SWHM-T-0158's, which also owns wiring
  `createLineItems` into the placement route, per `PLAN.md`'s scope boundary.
- `db/client.ts`'s demo-order seed inserts `order_line_item` rows without `catid`/`productid`
  (both nullable, unchanged by this ticket) — untouched, out of scope.
