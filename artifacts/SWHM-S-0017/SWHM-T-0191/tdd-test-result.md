---
ticket: SWHM-T-0191
title: Line item shipment tracking
---

## Test cases

File: `fulfillment/line-items.test.ts` (integration, `server` Vitest project — reaches `db/client.ts`).

| ID    | Covers                                                                                                                              |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| LT-01 | Sanity: file runs in the `server` (node) project, not `client` (jsdom)                                                              |
| LT-02 | `readLineItems` orders lines by `line_number`, independent of insert order                                                          |
| LT-03 | `readLineItems` returns the full `FulfillmentLine` shape                                                                            |
| LT-04 | `readLineItems` scopes to the requested `orderId` only                                                                              |
| LT-05 | `isAlreadyShipped` is `true` for quantity=50/quantityShipped=50 — AC "Shipped line items are skipped"                               |
| LT-06 | `isAlreadyShipped` is `true` for the "partially shipped" scenario's identical GIVEN (S6) — AC "Partially shipped items are skipped" |
| LT-07 | `isAlreadyShipped` is `false` when quantityShipped < quantity                                                                       |
| LT-08 | `markLineShipped` sets `quantity_shipped = quantity` (50) — AC "Shipped quantity is set to ordered quantity"                        |
| LT-09 | `markLineShipped` writes the full quantity (100) — AC "Shipped quantity tracks fulfillment progress"                                |
| LT-10 | `markLineShipped` writes only the targeted `(order_id, line_number)` pair, sibling line untouched                                   |

## Red run

Before `fulfillment/line-items.ts` existed:

```
$ bun run test -- fulfillment/line-items.test.ts
 FAIL  |server| fulfillment/line-items.test.ts [ fulfillment/line-items.test.ts ]
Error: Cannot find module './line-items' imported from /workspace/repo/fulfillment/line-items.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

## Green run

After implementing `fulfillment/line-items.ts`:

```
$ bun run test -- fulfillment/line-items.test.ts
 Test Files  1 passed (1)
      Tests  10 passed (10)
```

Full pre-commit gate (`bun run verify:full`, which runs `verify` — lint + typecheck + full unit suite — then `test:e2e`):

```
$ bun run verify:full
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0     → pass
$ tsc --build                                                                   → pass
$ NODE_ENV=test bun --bun vitest run
 Test Files  101 passed (101)
      Tests  640 passed (640)
$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
error: script "pretest:e2e" exited with code 1
```

E2E's browser preflight reports Chromium genuinely missing in this container (documented in `AGENTS.md` § Notes from previous agents — implementation containers do not ship Chromium). Per that note, not retried and no browser installed; `verify` (lint + typecheck + the full 640-test unit suite) is the gate that applies here and is green. The browser tier runs in CI and at INTEGRATION_QA.

No pre-existing failures were introduced: the full suite was 101 files / 640 tests passing, up from 100/630 before this ticket's 10 new tests.

TDD-RESULT: 640 passed, 0 failed
