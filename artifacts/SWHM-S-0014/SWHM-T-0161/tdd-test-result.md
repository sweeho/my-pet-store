---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0161
branch: vortex/feat/SWHM-T-0161-empty-cart-refuses-order-placement-28c706fd
upstream: [artifacts/SWHM-S-0014/SWHM-T-0161/PLAN.md]
---

# TDD result — SWHM-T-0161

## Test cases

| Test                                                   | Covers           | Intent                                                                                                                                        |
| ------------------------------------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `order/errors.test.ts › ERR-01`–`ERR-03`               | AC-6             | `ShoppingCartEmptyOrderError` is an `Error`, defaults to the fixed message, keeps its type with a custom message                              |
| `order/order.test.ts › EC-01`                          | AC-1, AC-3, AC-4 | an empty cart throws before any write — no order row, no line item                                                                            |
| `order/order.test.ts › EC-02`                          | AC-1             | the thrown error carries the exact copy the cart page shows on arrival                                                                        |
| `order/order.test.ts › EC-03`                          | AC-4             | a cart just emptied by removing its only item refuses the same as one that never held items                                                   |
| `order/order.test.ts › EC-04`                          | AC-2             | a non-empty cart still places the order normally                                                                                              |
| `order/order.test.ts › OT-01`–`OT-07`, `LI-01`–`LI-06` | (regression)     | updated to seed a populated cart (or mint the order row directly, for the `createLineItems` tests) now that `placeOrder` refuses an empty one |
| `routes/api/order/index.post.test.ts › PO-05`          | AC-1, AC-3       | `POST /api/order` from an empty-cart session answers 400 with `{ error, emptyCart: true }`                                                    |
| `routes/api/order/index.post.test.ts › PO-04`          | (regression)     | updated to seed a cart item — a valid submission with a non-empty cart still creates the order                                                |
| `src/pages/enter-order-information.test.tsx › EOI-16`  | AC-5             | an `emptyCart` refusal navigates to `/cart` with `{ state: { emptyCart: true } }`, not a form-level alert                                     |
| `src/pages/cart.test.tsx › CPT-13`                     | AC-5             | arriving via that navigation state shows the fixed message as its own `role="alert"`, alongside the untouched empty-state block               |
| `src/pages/cart.test.tsx › CPT-14`                     | (regression)     | arriving normally shows no empty-cart alert                                                                                                   |

## Red run

Each new test file/case, run against the code before its corresponding implementation:

```
$ bun --bun vitest run order/errors.test.ts
Error: Cannot find module './errors' imported from order/errors.test.ts

$ bun --bun vitest run order/order.test.ts
 × EC-01: an empty cart throws ShoppingCartEmptyOrderError and writes no order or line item
   AssertionError: expected function to throw an error, but it didn't
 × EC-02, EC-03 — same cause
 Tests  3 failed | 19 passed (22)

$ bun --bun vitest run routes/api/order/index.post.test.ts
(before the route caught ShoppingCartEmptyOrderError, PO-04 threw unhandled once
order/order.ts's guard was added — the route had nothing to catch it with)
Error: Your shopping cart is empty. Please add items before ordering.
  at placeOrder (order/order.ts:80)

$ bun --bun vitest run src/pages/enter-order-information.test.tsx
 × EOI-16: an empty-cart refusal sends the shopper back to /cart flagged...
   AssertionError: expected "vi.fn()" to be called with arguments: [ '/cart', …(1) ]
   Number of calls: 0

$ bun --bun vitest run src/pages/cart.test.tsx
 × CPT-13: arriving from a refused empty-cart placement shows its own alert...
   TestingLibraryElementError: Unable to find role="alert"
```

## Green run

`bun run verify` — this stack's browser-free full gate (lint + typecheck + complete unit suite).
`bun run verify:full`'s E2E tier was attempted first and fails only on this container's missing
Chromium (`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed"),
matching AGENTS.md's "Implementation containers do not ship a Chromium" note — E2E runs at
CI/integration QA instead:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  91 passed (91)
      Tests  577 passed (577)
```

TDD-RESULT: 577 passed, 0 failed
