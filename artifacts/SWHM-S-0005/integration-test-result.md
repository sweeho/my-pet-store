---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0005
idea: Not Applicable
branch: vortex/sprint/swhm-s-0005-1423bc6d
downstream: [artifacts/SWHM-S-0005/qa-test-report.md]
---

# Integration test result — SWHM-S-0005

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list --project=chromium   # confirms one project (chromium) covers all 5 spec files
$ bunx playwright install chromium                  # browser was not present in this container; installed once
$ bun run test:e2e -- --project=chromium
```

## Results

| Spec                                    | Result | Notes                                                     |
| --------------------------------------- | ------ | --------------------------------------------------------- |
| `e2e/catalog.spec.ts` (3 tests)         | pass   | browsing, not-found state, locale preference              |
| `e2e/customer-profile.spec.ts` (1 test) | pass   | view/edit/save + language persists across session         |
| `e2e/home.spec.ts` (3 tests)            | pass   | hero/nav, no scrollbar, mobile nav                        |
| `e2e/signon.spec.ts` (2 tests)          | pass   | remember-username, redirect-then-return                   |
| `e2e/smoke.spec.ts` (3 tests)           | pass   | no console errors, API responds, DB-backed route responds |

Playwright summary (verbatim): `12 passed (4.6s)`

No spec covers the light-mode `--destructive-foreground` fix directly — no page renders the
`destructive` button variant yet (confirmed: `grep -rn 'variant="destructive"'` under `src/pages`
and `src/components` matches only `src/components/ui/button.test.tsx`, a unit test). This matches
design.md § D4 ("the wrong trade for a defect whose live blast radius is zero"). The fix is exercised
by `src/theme-tokens.test.ts` (see `qa-test-report.md` § Unit Test Results), not by this E2E suite.

E2E-RESULT: chromium 12 passed, 0 failed, 0 skipped
