---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0020
idea: SWHM-I-0012
branch: vortex/sprint/swhm-s-0020-2eb89d94
downstream: [artifacts/SWHM-S-0020/qa-test-report.md]
---

# Integration test result — SWHM-S-0020

This capability (`notifications/`) has no user interface — the idea puts a screen out of scope
and design.md § Phases confirms "no browser-tier spec — this capability has no screen, so nothing
about it is observable in a browser." The three delivery scenarios are proven end to end through
`notifications/notifications.integration.test.ts`, which drives the real call paths
(`applyOrderDecisions`, `processOrder`) under Vitest's `server` project, not Playwright. The full
browser suite was still executed in full against the integrated sprint branch, as a regression
check that nothing this sprint touched (the admin-orders and fulfilment routes, both call
`dispatchQueued()`) broke an existing journey.

## Commands run

```
$ bun install
$ bun run build
$ node scripts/ensure-playwright-browser.mjs   # Chromium missing — installed with:
$ bunx playwright install chromium
$ bunx playwright test --list --project=chromium   # confirmed: 45 tests, 13 spec files, one project (chromium) covers all — no mobile/emulated project exists in playwright.config.ts
$ bunx playwright test --project=chromium
```

## Results

| Spec                           | Result | Notes                                                                           |
| ------------------------------ | ------ | ------------------------------------------------------------------------------- |
| `e2e/admin.spec.ts`            | pass   | access-denial journey                                                           |
| `e2e/cart.spec.ts`             | pass   | 6 tests                                                                         |
| `e2e/catalog.spec.ts`          | pass   | 3 tests                                                                         |
| `e2e/customer-profile.spec.ts` | pass   |                                                                                 |
| `e2e/fulfillment.spec.ts`      | pass   | 3 tests — exercises the fulfilment route that now also calls `dispatchQueued()` |
| `e2e/home.spec.ts`             | pass   | 4 tests                                                                         |
| `e2e/language.spec.ts`         | pass   | 6 tests                                                                         |
| `e2e/legacy-routes.spec.ts`    | pass   | 4 tests                                                                         |
| `e2e/order-approval.spec.ts`   | pass   | exercises the admin-decisions route that now also calls `dispatchQueued()`      |
| `e2e/order.spec.ts`            | pass   | 3 tests                                                                         |
| `e2e/payment.spec.ts`          | pass   | 4 tests                                                                         |
| `e2e/signon.spec.ts`           | pass   | 3 tests                                                                         |
| `e2e/smoke.spec.ts`            | pass   | 3 tests                                                                         |

Playwright summary: `45 passed (15.2s)`

No spec file was skipped or ran zero tests.

## Notifications behaviour — not a browser concern

The four delta-spec requirements (order notification delivery for approval/denial/completion,
notification content, async delivery, customer email retrieval) are proven by
`notifications/notifications.integration.test.ts` under `bun run test` (see
`qa-test-report.md` § Unit Test Results for the full run and the per-scenario verdicts). That
file drives the same production call paths the two E2E-covered routes above call into
(`applyOrderDecisions` for admin decisions, `processOrder` for fulfilment), so the browser run
above is the confirmation that neither call site regressed when `dispatchQueued()` was added to
it, and the Vitest integration test is the confirmation that the notification itself was queued,
resolved and delivered correctly.

E2E-RESULT: chromium 45 passed, 0 failed, 0 skipped
