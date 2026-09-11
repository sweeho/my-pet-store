---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0002
idea: SWHM-I-0002
branch: vortex/sprint/swhm-s-0002-728cef7d
downstream: [artifacts/SWHM-S-0002/qa-test-report.md]
---

# Integration test result — SWHM-S-0002

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list          # confirmed a single "chromium" project covers all 3 spec files, 8 tests — no mobile/emulated project exists to miss
$ bunx playwright install chromium     # the pinned @playwright/test 1.50.1 expects revision 1155; the container's pre-provisioned /ms-playwright only had 1223, so pretest:e2e's preflight correctly failed fast. Installed 1155 to run for real rather than falling back to `verify`.
$ bun run test:e2e -- --project=chromium
```

## Results

| Spec                                                                                                                   | Result | Notes                                           |
| ---------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------- |
| `e2e/home.spec.ts` › shows the hero content and desktop nav                                                            | pass   | pre-existing                                    |
| `e2e/home.spec.ts` › has no vertical scrollbar on common viewport sizes                                                | pass   | pre-existing                                    |
| `e2e/home.spec.ts` › opens and closes the mobile nav from the hamburger button                                         | pass   | pre-existing                                    |
| `e2e/signon.spec.ts` › remembers the username after a sign-in with the checkbox checked                                | pass   | AC-8, bp_signon cookie round-trip               |
| `e2e/signon.spec.ts` › redirects an unauthenticated visit to /customer to /signon, then returns there after signing in | pass   | AC-9 + AC-10, interception and post-auth return |
| `e2e/smoke.spec.ts` › home page loads with no console errors                                                           | pass   | pre-existing                                    |
| `e2e/smoke.spec.ts` › the API responds                                                                                 | pass   | pre-existing                                    |
| `e2e/smoke.spec.ts` › a database-backed route responds                                                                 | pass   | pre-existing                                    |

Playwright summary: `8 passed (3.7s)`

## Skipped

None — no spec file was wholly or partially skipped; every listed test executed.

E2E-RESULT: chromium 8 passed, 0 failed, 0 skipped
