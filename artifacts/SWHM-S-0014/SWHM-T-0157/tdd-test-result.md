---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0157
branch: vortex/feat/SWHM-T-0157-line-item-creation-from-cart-contents-1d3f9b9f
upstream: [artifacts/SWHM-S-0014/SWHM-T-0157/PLAN.md]
---

# TDD result — SWHM-T-0157

## Test cases

| Test                                                                                                                                                                | Covers | Intent                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| `order/order.test.ts › createLineItems › LI-01: creates one line item per cart line, carrying its quantity and unit price from the cart`                            | AC-1   | a 3-line cart produces 3 line items with quantities/unit prices from the cart   |
| `order/order.test.ts › createLineItems › LI-02: each line item carries the catid and productid resolved from the catalogue, alongside itemid`                       | AC-2   | catid/productid/itemid on the stored line item                                  |
| `order/order.test.ts › createLineItems › LI-03: line numbers are assigned from 1 upward, contiguous, matching the (order_id, line_number) key`                      | AC-3   | contiguous 1-upward numbering                                                   |
| `order/order.test.ts › createLineItems › LI-04: unit_price is the price captured at placement — a later catalogue price change leaves it unchanged`                 | AC-4   | price is stored, not re-read from the catalogue                                 |
| `order/order.test.ts › createLineItems › LI-05: quantity_shipped is 0 on a newly created line item`                                                                 | AC-5   | fulfilment starts at 0                                                          |
| `order/order.test.ts › createLineItems › LI-06: order_amount is the sum of quantity times unit price across the line items, matching the cart's subtotal`           | AC-6   | order total ties to the cart's own subtotal arithmetic                          |
| `cart/checkout.test.ts › cart/checkout › CO-07: each line carries the catid and productid resolved from the catalogue, alongside the fields already asserted above` | AC-7   | additive extension to the shared seam; previous sprint's CO-01..CO-06 untouched |

## Red run

`order/order.ts` had no `createLineItems` export and `cart/checkout.ts`'s `toOrderLineItems` did not
carry `catid`/`productid` yet — both test files were extended first, against the pre-existing code
(`cart/checkout.ts` and `order/order.ts` reverted via `git stash`, test files kept):

```
$ bun --bun vitest run order/order.test.ts cart/checkout.test.ts
FAIL  |server| order/order.test.ts > createLineItems > LI-01
TypeError: createLineItems is not a function.
FAIL  |server| order/order.test.ts > createLineItems > LI-02
TypeError: createLineItems is not a function.
FAIL  |server| order/order.test.ts > createLineItems > LI-03
TypeError: createLineItems is not a function.
FAIL  |server| order/order.test.ts > createLineItems > LI-04
TypeError: createLineItems is not a function.
FAIL  |server| order/order.test.ts > createLineItems > LI-05
TypeError: createLineItems is not a function.
FAIL  |server| order/order.test.ts > createLineItems > LI-06
TypeError: createLineItems is not a function.
FAIL  |server| cart/checkout.test.ts > cart/checkout > CO-07
AssertionError: expected [ { itemid: 'checkout-item-9', …(3) } ] to deeply equal [ ObjectContaining{…} ]
  - "catid": "checkout-cat",
  - "productid": "checkout-product-9",

 Test Files  2 failed (2)
      Tests  7 failed | 13 passed (20)
```

The 13 pre-existing tests (OT-01..OT-07, CO-01..CO-06) passed unchanged, confirming the extension is
additive.

## Green run

`createLineItems` added to `order/order.ts`; `catid`/`productid` added to `cart/checkout.ts`'s
`toOrderLineItems`:

```
$ bun --bun vitest run order/order.test.ts cart/checkout.test.ts
 Test Files  2 passed (2)
      Tests  20 passed (20)
```

Then `bun run verify:full` — this stack's full pre-commit gate plus the browser tier:

```
$ bun run verify && bun run test:e2e
$ bun run lint && bun run typecheck && bun run test
 Test Files  88 passed (88)
      Tests  551 passed (551)

$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
error: script "pretest:e2e" exited with code 1
```

Chromium is genuinely not installed in this container (`AGENTS.md` § Notes from previous agents,
"Implementation containers do not ship a Chromium"). This ticket adds no `e2e/` spec and no
user-visible surface (`order/order.ts` and `cart/checkout.ts` are both server-side modules with no
route wired to them yet — SWHM-T-0158 owns the transaction and wiring). Fell back to `bun run verify`
alone, which is fully green:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  88 passed (88)
      Tests  551 passed (551)
```

551 = the pre-existing suite (544, inherited from tickets landed on this branch before it forked)
plus the 7 new tests listed above.

TDD-RESULT: 551 passed, 0 failed
