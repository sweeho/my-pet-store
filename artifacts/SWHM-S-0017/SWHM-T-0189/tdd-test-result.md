---
ticket: SWHM-T-0189
title: Invoice generation
---

## Test cases

File: `fulfillment/invoice.test.ts` (unit — `createInvoice` is a pure string builder, no db, no clock).

| ID    | Covers                                                                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VT-01 | Invoice includes `poId`, `userId`, `poDate`, `shippingDate` — AC "Invoice includes order metadata"                                                                                                |
| VT-02 | Every field of a fulfilled line (`itemId`, `categoryId`, `productId`, `lineNumber`, `quantity`, `unitPrice`), using the scenario's own figures — AC "Invoice is generated with line item details" |
| VT-03 | `shippingDate` is the parameter's value, not a clock read                                                                                                                                         |
| VT-04 | A `null` `catid`/`productid` renders an empty element, not the string `"null"`                                                                                                                    |
| VT-05 | `&`, `<`, `>`, `"` in an interpolated value are escaped                                                                                                                                           |
| VT-06 | Every fulfilled line in the input array appears in the document                                                                                                                                   |
| VT-07 | `createInvoice` throws `InvoiceGenerationError` when no line items were fulfilled                                                                                                                 |
| VT-08 | `createInvoice` is deterministic given the same arguments (no clock, no database read)                                                                                                            |

## Red run

Before `fulfillment/invoice.ts` existed:

```
$ bun run test -- fulfillment/invoice.test.ts
 FAIL  |server| fulfillment/invoice.test.ts [ fulfillment/invoice.test.ts ]
Error: Cannot find module './invoice' imported from /workspace/repo/fulfillment/invoice.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

## Green run

After implementing `fulfillment/invoice.ts`:

```
$ bun run test -- fulfillment/invoice.test.ts
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

Full pre-commit gate (`bun run verify:full`, which runs `verify` — lint + typecheck + full unit suite — then `test:e2e`):

```
$ bun run verify:full
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0     → pass
$ tsc --build                                                                   → pass
$ NODE_ENV=test bun --bun vitest run
 Test Files  103 passed (103)
      Tests  655 passed (655)
$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
error: script "pretest:e2e" exited with code 1
```

E2E's browser preflight reports Chromium genuinely missing in this container (documented in `AGENTS.md` § Notes from previous agents — implementation containers do not ship Chromium). Per that note, not retried and no browser installed; `verify` (lint + typecheck + the full 655-test unit suite) is the gate that applies here and is green. The browser tier runs in CI and at INTEGRATION_QA.

No pre-existing failures were introduced: adding this ticket's one new test file (8 tests) brought the suite from 102 files/647 tests to 103/655, with zero failures.

TDD-RESULT: 655 passed, 0 failed
