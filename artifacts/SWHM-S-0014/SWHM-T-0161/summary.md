---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0161
branch: vortex/feat/SWHM-T-0161-empty-cart-refuses-order-placement-28c706fd
upstream: [artifacts/SWHM-S-0014/SWHM-T-0161/PLAN.md]
downstream: [artifacts/SWHM-S-0014/qa-test-report.md]
---

# Summary — SWHM-T-0161: Empty cart refuses order placement

## What changed

Added `ShoppingCartEmptyOrderError` in a new `order/errors.ts` (chose a new file over adding it
beside `OrderValidationError` in `order/validation.ts` — the two guard different things, cart
state vs. submitted field shape, and share no fields). `placeOrder` now checks the cart via
`getCart` before its transaction and throws that error on an empty one; the route maps it to a
400 with `{ error, emptyCart: true }`; the order form navigates to `/cart` with
`{ state: { emptyCart: true } }` on that specific response instead of showing a form alert; the
cart page renders the fixed message as its own `role="alert"` when that state is present,
alongside its existing (untouched) empty-state block.

## Files

- `order/errors.ts` (new) + `order/errors.test.ts` (new) — the error class and its message.
- `order/order.ts` — the emptiness check, before the transaction.
- `order/order.test.ts` — 4 new cases (EC-01–EC-04); updated `OT-01`–`OT-07` to seed a populated
  cart (`seedPopulatedSession`) and `LI-01`–`LI-06` to mint their throwaway order row directly
  (`seedOrderRow`, bypassing `placeOrder`) now that an empty cart is refused.
- `routes/api/order/index.post.ts` — catches the error, maps to 400.
- `routes/api/order/index.post.test.ts` — new `PO-05`; `PO-04` updated to seed a cart item.
- `src/pages/enter-order-information.tsx` + `.test.tsx` — the `emptyCart`-flagged navigation;
  new `EOI-16`.
- `src/pages/cart.tsx` + `src/pages/cart.test.tsx` — the alert; new `CPT-13`/`CPT-14`.

## AC coverage

- AC-1 (`ShoppingCartEmptyOrderError` raised, shopper redirected) — `order/order.ts`'s guard +
  `enter-order-information.tsx`'s `emptyCart` branch, covered by `EC-01`/`EC-02` and `EOI-16`.
- AC-2 (non-empty cart still creates the order) — `EC-04` and the already-passing `OT`/`CC`
  suites (now seeded with items).
- AC-3 (an empty-cart POST writes no order and no line item) — `EC-01`'s before/after row
  counts.
- AC-4 (checked before any write) — the guard sits above `db.transaction(...)` in `order/order.ts`,
  covered by `EC-01` (counts) and `EC-03` (a cart just emptied refuses the same way).
- AC-5 (arrival at `/cart` shows the exact message) — `cart.tsx`'s alert, covered by `CPT-13`.
- AC-6 (class named `ShoppingCartEmptyOrderError`, exported from `order/`) — `order/errors.ts`,
  covered by `ERR-02`.

## Verification

```
$ bun --bun vitest run order/errors.test.ts order/order.test.ts routes/api/order/index.post.test.ts src/pages/enter-order-information.test.tsx src/pages/cart.test.tsx
 Test Files  5 passed (5)
      Tests  62 passed (62)

$ bun run verify        # lint + typecheck + full unit suite
 Test Files  91 passed (91)
      Tests  577 passed (577)
```

`bun run verify:full`'s E2E tier fails only on this container's missing Chromium
(`ensure-playwright-browser.mjs`), per AGENTS.md's known containers-ship-no-Chromium note; E2E is
observed in CI / integration QA. See `tdd-test-result.md` — `TDD-RESULT: 577 passed, 0 failed`.

## Notes

- The route response's `emptyCart: true` flag and the client's matching check are this ticket's
  own contract (nothing upstream fixes it) — it is how the form tells this refusal apart from a
  field-validation 400, both of which are 400s with an `error` string.
- Adding the guard broke 13 pre-existing tests that called `placeOrder` against a session with no
  cart items (`OT-01`–`OT-07`, `LI-01`–`LI-06` in `order/order.test.ts`, `PO-04` in the route
  test) — all were exercising row-writing behaviour unrelated to cart contents, so each was
  updated to seed a cart item (or, for `LI-*`, to mint its throwaway order row directly instead
  of going through `placeOrder`, since two separate `createLineItems` calls against the same
  order — one from `placeOrder`'s own populated-cart call, one from the test — would otherwise
  collide on `(order_id, line_number)`).
