---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0016
idea: SWHM-I-0009
branch: vortex/sprint/swhm-s-0016-da83b0d8
downstream: [artifacts/SWHM-S-0016/qa-test-report.md]
---

# Integration test result — SWHM-S-0016

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright install chromium   # container had no browser cached; installed once, no --with-deps (no root)
$ bunx playwright test --list --project=chromium   # confirmed single "chromium" project covers all 11 spec files, 41 tests
$ bunx playwright test --project=chromium
```

`playwright.config.ts` declares exactly one project (`chromium`), so `--project=chromium` is the full covering selection — there is no mobile/emulated project to miss.

## Results

Playwright summary: `41 passed (11.3s)`

| Spec                           | Result | Notes                                        |
| ------------------------------ | ------ | -------------------------------------------- |
| `e2e/admin.spec.ts`            | pass   | 4/4                                          |
| `e2e/cart.spec.ts`             | pass   | 6/6                                          |
| `e2e/catalog.spec.ts`          | pass   | 3/3                                          |
| `e2e/customer-profile.spec.ts` | pass   | 1/1                                          |
| `e2e/home.spec.ts`             | pass   | 4/4                                          |
| `e2e/language.spec.ts`         | pass   | 6/6                                          |
| `e2e/legacy-routes.spec.ts`    | pass   | 4/4                                          |
| `e2e/order.spec.ts`            | pass   | 3/3                                          |
| `e2e/payment.spec.ts`          | pass   | 4/4 — the sprint's own new spec (AC-1..AC-4) |
| `e2e/signon.spec.ts`           | pass   | 3/3                                          |
| `e2e/smoke.spec.ts`            | pass   | 3/3                                          |

`e2e/payment.spec.ts` cases, individually:

- `an accepted card with a future expiry shows the in-flight state, then authorizes and confirms the order (AC-2, AC-3, AC-4)` — pass
- `an unaccepted card type is refused against the card type field, and no order is placed (AC-3)` — pass
- `an expired card is refused against the expiry field naming the exact expiry, and no order is placed (AC-1)` — pass
- `a processor decline leaves the shopper on the payment screen with no order placed and no charge` — pass

No failures. No skips. Every spec file ran its full set of tests.

E2E-RESULT: chromium 41 passed, 0 failed, 0 skipped
