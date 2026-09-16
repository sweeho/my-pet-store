---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0015
idea: Not Applicable
branch: vortex/sprint/swhm-s-0015-3040cbce
downstream: [artifacts/SWHM-S-0015/qa-test-report.md]
---

# Integration test result — SWHM-S-0015

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list
# → single project "chromium", 37 tests across 10 spec files, order.spec.ts included
$ bunx playwright install chromium
# → repo pins @playwright/test ~1.50.0 (browser revision 1155); the container's preinstalled
#   chromium-1223 did not match, so scripts/ensure-playwright-browser.mjs failed fast per its
#   design. Installed the pinned revision rather than retrying or skipping.
$ bun run test:e2e -- --project=chromium
```

## Results

| Spec                                    | Result | Notes                                                                                                                                                                                   |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/admin.spec.ts` (4 tests)           | pass   | —                                                                                                                                                                                       |
| `e2e/cart.spec.ts` (6 tests)            | pass   | —                                                                                                                                                                                       |
| `e2e/catalog.spec.ts` (3 tests)         | pass   | —                                                                                                                                                                                       |
| `e2e/customer-profile.spec.ts` (1 test) | pass   | —                                                                                                                                                                                       |
| `e2e/home.spec.ts` (4 tests)            | pass   | —                                                                                                                                                                                       |
| `e2e/language.spec.ts` (6 tests)        | pass   | —                                                                                                                                                                                       |
| `e2e/legacy-routes.spec.ts` (4 tests)   | pass   | —                                                                                                                                                                                       |
| `e2e/order.spec.ts` (3 tests)           | pass   | includes SWHM-T-0165/0166's target: `order.spec.ts:126` — places an order, confirms it with an order id and the shopper's email, empties the cart, and gives a second order a higher id |
| `e2e/signon.spec.ts` (3 tests)          | pass   | —                                                                                                                                                                                       |
| `e2e/smoke.spec.ts` (3 tests)           | pass   | —                                                                                                                                                                                       |

Playwright summary: `37 passed (10.0s)`

## Skipped

None — no spec file ran zero tests; all 37 selected tests executed.

E2E-RESULT: chromium 37 passed, 0 failed, 0 skipped
