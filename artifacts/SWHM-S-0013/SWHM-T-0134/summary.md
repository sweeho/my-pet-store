---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0134
branch: vortex/feat/SWHM-T-0134-add-items-to-the-cart-ff5e6fa0
upstream: [artifacts/SWHM-S-0013/SWHM-T-0134/PLAN.md]
downstream: [SWHM-T-0135, SWHM-T-0136, SWHM-T-0137 append to cart/cart.ts]
---

# Summary — SWHM-T-0134: Add items to the cart

## What changed

Added `getCart` and `addItem` to `cart/cart.ts`, where `count`, `lineTotal` and `subtotal` first
exist — all derived on read from `cart/repository.ts`'s rows and `catalog/item.ts`'s `getItem`
(design.md D6), never stored. `addItem` upserts the summed quantity on a duplicate add and rejects
an item id the catalogue has no item for by throwing `UnknownItemError`. Landed the two routes
(`GET`/`POST /api/cart`), both public per design.md D3 — session resolved via
`useSignOnSession`, no `j_signon` check, no protected-resources entry. Added a quantity field and
an Add to Cart control to the item detail screen; the control has no mockup (PLAN.md § Design
reference), so it was built from the existing screen's own idiom (label+input pattern from
`src/pages/signon.tsx`, `Button` from `src/components/ui/button.tsx`) below the existing price
line, with the rest of the screen untouched.

Per S1, the cart line's `unitCost` is `item.unit_cost`, not the `item.listPrice` the item screen
itself still displays — implemented exactly as PLAN.md and design.md direct, not a bug.

## Files

- `cart/cart.ts` — new: `getCart`, `addItem`, `UnknownItemError`.
- `cart/cart.test.ts` — new: CT-01..CT-10.
- `routes/api/cart/index.get.ts` (+ `.test.ts`) — new: public `GET /api/cart`.
- `routes/api/cart/index.post.ts` (+ `.test.ts`) — new: public `POST /api/cart`, 400 on an unknown item id.
- `src/pages/catalog/item/[itemId].tsx` (+ `.test.tsx`) — added the quantity field, Add to Cart button and a status line; no other change to the screen.

## AC coverage

- AC-1..AC-3 (specified/default/duplicate quantity) — `cart/cart.test.ts` CT-01, CT-02, CT-03.
- AC-4, AC-5 (subtotal, single and multi-item) — CT-04, CT-05.
- AC-6 (fixed `getCart`/`addItem` contract, default-quantity equivalence) — `cart/cart.ts`; CT-02.
- AC-7 (`unitCost` is `unit_cost`, `lineTotal = unitCost × quantity`) — `cart/cart.ts`'s `toCartItem`; CT-09.
- AC-9 (`count` is distinct lines, not summed quantities) — CT-06.
- AC-8, AC-10 (route status codes/bodies, no session required) — `routes/api/cart/index.get.test.ts`, `index.post.test.ts`.
- AC-11 (quantity field + Add to Cart control, wired to the entered quantity) — `[itemId].test.tsx` PT-09, PT-10.
- AC-12 (all four new test files pass) — see `tdd-test-result.md`, `TDD-RESULT: 454 passed, 0 failed`.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  79 passed (79)
      Tests  454 passed (454)
```

`bun run verify:full`'s E2E preflight reported Chromium is genuinely not installed in this
container; fell back to `bun run verify` per the repository's own notes on implementation
containers. This ticket adds no `e2e/` spec — the browser tier runs at INTEGRATION_QA and in CI.

## Notes

- No mockup exists for the item detail screen's Add to Cart control (only the cart screen itself
  is mocked, owned by SWHM-T-0138); built to the existing screen's idiom per PLAN.md § Design
  reference.
- `cart/cart.ts` is left easy to extend: `getCart` and `addItem` only, ready for `removeItem`
  (SWHM-T-0135), `updateItem` (SWHM-T-0136) and `clearCart` (SWHM-T-0137) to append in order.
