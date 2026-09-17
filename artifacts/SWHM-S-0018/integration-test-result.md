---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0018
idea: SWHM-I-0011
branch: vortex/sprint/swhm-s-0018-12051c41
downstream: [artifacts/SWHM-S-0018/qa-test-report.md]
---

# Integration test result — SWHM-S-0018

## Commands run

```
$ bun install
$ bun run build
$ bun run test:e2e
```

`playwright.config.ts` defines a single `chromium` project with no `testMatch` restriction, so `playwright test` (invoked by `test:e2e`) already covers every spec under `e2e/` — confirmed with `bunx playwright test --list`, which listed all 44 tests under `[chromium]` across 13 spec files, including `e2e/order-approval.spec.ts`, this sprint's own spec.

The container's installed Chromium (`/ms-playwright/chromium-1223`) did not match the pinned `@playwright/test ~1.50.0` build (`1155`), so `pretest:e2e`'s browser-presence check failed on the first attempt. Ran `bunx playwright install chromium` once to fetch build 1155, then re-ran `test:e2e` for the real result below.

## Results

| Spec                           | Result | Notes                                                                                                                                                                                                             |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/admin.spec.ts`            | pass   | 4 tests                                                                                                                                                                                                           |
| `e2e/cart.spec.ts`             | pass   | 6 tests                                                                                                                                                                                                           |
| `e2e/catalog.spec.ts`          | pass   | 3 tests                                                                                                                                                                                                           |
| `e2e/customer-profile.spec.ts` | pass   | 1 test                                                                                                                                                                                                            |
| `e2e/fulfillment.spec.ts`      | pass   | 2 tests                                                                                                                                                                                                           |
| `e2e/home.spec.ts`             | pass   | 4 tests                                                                                                                                                                                                           |
| `e2e/language.spec.ts`         | pass   | 6 tests                                                                                                                                                                                                           |
| `e2e/legacy-routes.spec.ts`    | pass   | 4 tests                                                                                                                                                                                                           |
| `e2e/order-approval.spec.ts`   | pass   | 1 test — this sprint's journey: sign on as admin, place three orders, select all three on `/admin/orders-approval`, Approve, Commit, and confirm they leave the pending view and read APPROVED on `/admin/orders` |
| `e2e/order.spec.ts`            | pass   | 3 tests                                                                                                                                                                                                           |
| `e2e/payment.spec.ts`          | pass   | 4 tests                                                                                                                                                                                                           |
| `e2e/signon.spec.ts`           | pass   | 3 tests                                                                                                                                                                                                           |
| `e2e/smoke.spec.ts`            | pass   | 3 tests                                                                                                                                                                                                           |

Playwright summary: `44 passed (12.4s)`

No spec file ran zero tests; no test skipped.

## Skipped

None.

E2E-RESULT: chromium 44 passed, 0 failed, 0 skipped
