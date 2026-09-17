---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0021
idea: SWHM-I-0014
branch: vortex/sprint/swhm-s-0021-5e503761
downstream: [artifacts/SWHM-S-0021/qa-test-report.md]
---

# Integration test result — SWHM-S-0021

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list        # confirms one project ("chromium") covers every spec under e2e/, 45 tests in 13 files
$ bun run test:e2e -- --project=chromium
```

Chromium was not preinstalled in this container (`scripts/ensure-playwright-browser.mjs` failed its preflight against the `@playwright/test ~1.50.0` pin, expecting build 1155); installed it with `bun x playwright install chromium` before running.

Ran the full suite twice: once against the DEFECT-1 fix candidate on the ticket branch, and once again after the fix landed, to confirm the fix caused no regression. Both runs are identical in outcome; the second (post-fix) run is quoted below.

## Results

| Spec                                    | Result | Notes                                                                                                          |
| --------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `e2e/admin.spec.ts` (3 tests)           | pass   | orders view sign-in/launch; anonymous and non-admin denial paths                                               |
| `e2e/cart.spec.ts` (6 tests)            | pass   | add/edit/zero/remove lines, persistence across navigation, anonymous access                                    |
| `e2e/catalog.spec.ts` (3 tests)         | pass   | browse → product → item → search; unknown category; locale-aware catalog                                       |
| `e2e/customer-profile.spec.ts` (1 test) | pass   | view/edit/save, language preference across a new session                                                       |
| `e2e/fulfillment.spec.ts` (3 tests)     | pass   | supplier inventory update; fulfilment run incl. SWHM-T-0214 regression                                         |
| `e2e/home.spec.ts` (4 tests)            | pass   | hero + shared header desktop nav; 375px header (AC-7); no vertical scrollbar; no third-party font/host request |
| `e2e/language.spec.ts` (5 tests)        | pass   | locale persistence across reload/profile/session; unavailable-in-language panels                               |
| `e2e/legacy-routes.spec.ts` (4 tests)   | pass   | `/users`, `/users/1`, `/users/profile` → not-found; `GET /api/users` still answers                             |
| `e2e/order-approval.spec.ts` (1 test)   | pass   | select/approve/commit three pending orders                                                                     |
| `e2e/order.spec.ts` (3 tests)           | pass   | place order from cart; empty-cart submission; field-level validation error                                     |
| `e2e/payment.spec.ts` (4 tests)         | pass   | accepted card, unaccepted type, expired card, processor decline                                                |
| `e2e/signon.spec.ts` (3 tests)          | pass   | remember-username; redirect-then-return; catalog browsing doesn't corrupt the post-sign-in redirect            |
| `e2e/smoke.spec.ts` (3 tests)           | pass   | home loads with no console errors; API responds; a DB-backed route responds                                    |

Playwright summary (verbatim): `45 passed (12.7s)` (pre-fix run: `45 passed (12.7s)`; post-fix run: `45 passed (11.3s)`).

## Skipped

None. Every spec file ran at least one test; no file reported a skip.

E2E-RESULT: chromium 45 passed, 0 failed, 0 skipped
