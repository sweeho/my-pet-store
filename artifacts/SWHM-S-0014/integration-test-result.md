---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0014
idea: SWHM-I-0008
branch: vortex/sprint/swhm-s-0014-61fcd4b6
upstream: [artifacts/SWHM-S-0014/SPRINT-PLAN.md]
downstream: [artifacts/SWHM-S-0014/qa-test-report.md]
---

# Integration test result — SWHM-S-0014

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright install chromium   # container's pinned chromium-1223 did not match
                                       # @playwright/test ~1.50.0's expected build 1155
$ bun run test:e2e -- --project=chromium   # first run — see Failures
$ bunx playwright test e2e/order.spec.ts --project=chromium   # re-run after fix
$ bunx playwright test --project=chromium   # full-suite re-run after fix
```

`playwright test --list` confirms a single Playwright project (`chromium`) covers all 37 specs
under `e2e/` — no mobile/emulated project selection is needed.

## Results (final run, after DEFECT-1 fixed in place)

| Spec                                    | Result | Notes                                                                       |
| --------------------------------------- | ------ | --------------------------------------------------------------------------- |
| `e2e/admin.spec.ts` (4 tests)           | pass   | —                                                                           |
| `e2e/cart.spec.ts` (5 tests)            | pass   | —                                                                           |
| `e2e/catalog.spec.ts` (3 tests)         | pass   | —                                                                           |
| `e2e/customer-profile.spec.ts` (1 test) | pass   | —                                                                           |
| `e2e/home.spec.ts` (4 tests)            | pass   | —                                                                           |
| `e2e/language.spec.ts` (6 tests)        | pass   | —                                                                           |
| `e2e/legacy-routes.spec.ts` (4 tests)   | pass   | —                                                                           |
| `e2e/order.spec.ts` (3 tests)           | pass   | first run: 1 failed (DEFECT-1, see below); fixed in place, re-run: 3 passed |
| `e2e/signon.spec.ts` (3 tests)          | pass   | —                                                                           |
| `e2e/smoke.spec.ts` (3 tests)           | pass   | —                                                                           |

Playwright summary (final run): `37 passed (12.0s)`

## Failures (first run, before fix)

`e2e/order.spec.ts:126` › "places an order from a populated cart reached through /cart's control, confirms it with an order id and the shopper's email, empties the cart, and gives a second order a higher id" — timed out waiting for `getByRole('group', { name: /^Your order Id is \d+$/ })` to be visible on `/order-completed`. Root cause and fix logged as DEFECT-1 in `artifacts/SWHM-S-0014/integration-defects-resolution.md`. First-run summary: `1 failed`, `36 passed (15.3s)`.

## Skipped

None. Every spec file ran its full set of tests in both the first and final runs — no wholly-skipped file.

E2E-RESULT: chromium 37 passed, 0 failed, 0 skipped
