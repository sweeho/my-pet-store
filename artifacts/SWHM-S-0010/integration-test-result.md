---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0010
idea: Not Applicable
branch: vortex/sprint/swhm-s-0010-171cf530
downstream: [artifacts/SWHM-S-0010/qa-test-report.md]
---

# Integration test result — SWHM-S-0010

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list --project=chromium   # confirmed single "chromium" project covers all specs (23 tests, 7 files)
$ bunx playwright install chromium                  # container's cached browser (rev 1223) did not match this project's pinned @playwright/test 1.50.1 (rev 1155); downloaded the matching revision
$ bun run test:e2e -- --project=chromium
```

`playwright.config.ts` declares exactly one project (`chromium`), so `--project=chromium` is the full
covering selection — confirmed with `--list` (23 tests in 7 files) before the run.

## Results

Playwright summary (verbatim): `23 passed (6.3s)`

| Spec                                    | Result | Notes                                                                                                                                                                 |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/catalog.spec.ts` (3 tests)         | pass   | browsing, unknown-category not-found, signed-on locale                                                                                                                |
| `e2e/customer-profile.spec.ts` (1 test) | pass   |                                                                                                                                                                       |
| `e2e/home.spec.ts` (4 tests)            | pass   |                                                                                                                                                                       |
| `e2e/language.spec.ts` (5 tests)        | pass   | includes SWHM-T-0098's new case: `an untranslated product reaches the unavailable-in-language panel, and an unknown product id still reaches Not Found (SWHM-T-0098)` |
| `e2e/legacy-routes.spec.ts` (4 tests)   | pass   |                                                                                                                                                                       |
| `e2e/signon.spec.ts` (3 tests)          | pass   |                                                                                                                                                                       |
| `e2e/smoke.spec.ts` (3 tests)           | pass   |                                                                                                                                                                       |

No failures, no skips.

## Failures

None.

## Skipped

None. No spec file ran zero tests.

E2E-RESULT: chromium 23 passed, 0 failed, 0 skipped
