---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0017
idea: SWHM-I-0010
branch: vortex/sprint/swhm-s-0017-0206b1e7
downstream: [artifacts/SWHM-S-0017/qa-test-report.md]
---

# Integration test result — SWHM-S-0017

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list        # confirmed single "chromium" project covers all 12 spec files, 43 tests
$ bunx playwright install chromium   # container's pre-installed chromium-1223 did not match @playwright/test ~1.50.0's expected build 1155; installed the matching build
$ bun run test:e2e -- --project=chromium
```

Only one Playwright project (`chromium`) is declared in `playwright.config.ts`, so `--project=chromium` covers every spec under `e2e/`; `--list` confirmed 43 tests across 12 files with none excluded.

## Results

| Spec                                    | Result | Notes                                                                                                                                                                                                                |
| --------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/admin.spec.ts` (4 tests)           | pass   | pre-existing, unaffected by this sprint                                                                                                                                                                              |
| `e2e/cart.spec.ts` (6 tests)            | pass   | pre-existing                                                                                                                                                                                                         |
| `e2e/catalog.spec.ts` (3 tests)         | pass   | pre-existing                                                                                                                                                                                                         |
| `e2e/customer-profile.spec.ts` (1 test) | pass   | pre-existing                                                                                                                                                                                                         |
| `e2e/fulfillment.spec.ts` (2 tests)     | pass   | **this sprint** — inventory update journey (sign-in → `/supplier` → `/supplier/inventory` → tick+submit one row) and the fulfilment idempotence journey (place order → process → process again, no double-deduction) |
| `e2e/home.spec.ts` (4 tests)            | pass   | pre-existing                                                                                                                                                                                                         |
| `e2e/language.spec.ts` (6 tests)        | pass   | pre-existing                                                                                                                                                                                                         |
| `e2e/legacy-routes.spec.ts` (4 tests)   | pass   | pre-existing                                                                                                                                                                                                         |
| `e2e/order.spec.ts` (3 tests)           | pass   | pre-existing                                                                                                                                                                                                         |
| `e2e/payment.spec.ts` (4 tests)         | pass   | pre-existing                                                                                                                                                                                                         |
| `e2e/signon.spec.ts` (3 tests)          | pass   | pre-existing                                                                                                                                                                                                         |
| `e2e/smoke.spec.ts` (3 tests)           | pass   | pre-existing                                                                                                                                                                                                         |

Playwright summary (verbatim): `43 passed (13.1s)`

## Skipped

None. No spec file ran zero tests; the skip count in the summary line is 0.

E2E-RESULT: chromium 43 passed, 0 failed, 0 skipped
