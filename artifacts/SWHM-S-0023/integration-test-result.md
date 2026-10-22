---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0023
idea: swhm-s-0023-bugfix-swhm-t-0096-inspector
branch: vortex/sprint/swhm-s-0023-8ac9cbb9
upstream: [artifacts/SWHM-S-0023/SPRINT-PLAN.md]
downstream: [artifacts/SWHM-S-0023/qa-test-report.md]
---

# Integration test result — SWHM-S-0023

## Commands run

```
$ bun install
$ bun run build                          # exit 0
$ bunx playwright install chromium       # exit 0
$ bunx playwright test --list            # Total: 47 tests in 13 files (single project: chromium)
$ bunx playwright test --project=chromium
```

## Results

Playwright summary line, verbatim: `47 passed (13.9s)` (exit 0; no failed, no skipped).

| Spec                         | Passed | Failed | Skipped |
| ---------------------------- | ------ | ------ | ------- |
| e2e/admin.spec.ts            | 4      | 0      | 0       |
| e2e/cart.spec.ts             | 6      | 0      | 0       |
| e2e/catalog.spec.ts          | 3      | 0      | 0       |
| e2e/customer-profile.spec.ts | 1      | 0      | 0       |
| e2e/fulfillment.spec.ts      | 3      | 0      | 0       |
| e2e/home.spec.ts             | 4      | 0      | 0       |
| e2e/language.spec.ts         | 6      | 0      | 0       |
| e2e/legacy-routes.spec.ts    | 6      | 0      | 0       |
| e2e/order-approval.spec.ts   | 1      | 0      | 0       |
| e2e/order.spec.ts            | 3      | 0      | 0       |
| e2e/payment.spec.ts          | 4      | 0      | 0       |
| e2e/signon.spec.ts           | 3      | 0      | 0       |
| e2e/smoke.spec.ts            | 3      | 0      | 0       |

No spec file ran zero of its tests. Counts come from the `✓` lines of the real run.

## Notes

This sprint changes no file in this repository (SWHM-T-0096 was deferred at planning; the fix site is the Vortex inspection platform). The suite is a regression run of the unchanged product.

E2E-RESULT: chromium 47 passed, 0 failed, 0 skipped
