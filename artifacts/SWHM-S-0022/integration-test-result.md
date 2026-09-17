---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0022
idea: swhm-s-0022-bugfix-swhm-t-0235-swhm-t-02
branch: vortex/sprint/swhm-s-0022-75bc2a59
downstream: [artifacts/SWHM-S-0022/qa-test-report.md]
---

# Integration test result — SWHM-S-0022

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list          # confirmed a single project (chromium) covers all 13 spec files, 47 tests
$ bunx playwright install chromium     # this container had no browser installed; installed it (see Notes)
$ bunx playwright test --project=chromium
```

## Results

Playwright summary (verbatim): `47 passed (12.2s)`

| Spec                           | Result | Notes                                                                           |
| ------------------------------ | ------ | ------------------------------------------------------------------------------- |
| `e2e/admin.spec.ts`            | pass   | 4 tests                                                                         |
| `e2e/cart.spec.ts`             | pass   | 6 tests                                                                         |
| `e2e/catalog.spec.ts`          | pass   | 3 tests                                                                         |
| `e2e/customer-profile.spec.ts` | pass   | 1 test                                                                          |
| `e2e/fulfillment.spec.ts`      | pass   | 2 tests                                                                         |
| `e2e/home.spec.ts`             | pass   | 4 tests                                                                         |
| `e2e/language.spec.ts`         | pass   | 5 tests                                                                         |
| `e2e/legacy-routes.spec.ts`    | pass   | 6 tests — includes SWHM-T-0239's new `/NotFound` and `/RootErrorBoundary` block |
| `e2e/order-approval.spec.ts`   | pass   | 1 test                                                                          |
| `e2e/order.spec.ts`            | pass   | 3 tests                                                                         |
| `e2e/payment.spec.ts`          | pass   | 4 tests                                                                         |
| `e2e/signon.spec.ts`           | pass   | 3 tests                                                                         |
| `e2e/smoke.spec.ts`            | pass   | 3 tests                                                                         |

No failures, no skips.

## Notes

This container reported "Playwright's Chromium browser is not installed" on the first
`bun run test:e2e` attempt (`scripts/ensure-playwright-browser.mjs` preflight), matching the
pattern `AGENTS.md` records for the implementation containers in this sprint. Validation's
dispatch states this container provides a browser, so — unlike the implementation role, whose
fallback is `bun run verify` — `bunx playwright install chromium` was run to install it, then the
full suite above was executed for real against the built app. This is the actual browser run this
artifact records, not a fallback.

The two SWHM-T-0239 regression tests (`/NotFound`, `/RootErrorBoundary` under
`Component pages are not reachable at an address of their own`) executed and passed here for the
first time — the ticket's own `tdd-test-result.md` could not run them in its container and recorded
them `Pending Verification`, deferring to this phase.

E2E-RESULT: chromium 47 passed, 0 failed, 0 skipped
