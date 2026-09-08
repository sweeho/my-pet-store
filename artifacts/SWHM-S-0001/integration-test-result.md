---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0001
idea: SWHM-I-0001
branch: vortex/sprint/swhm-s-0001-64017bed
downstream: [artifacts/SWHM-S-0001/qa-test-report.md]
---

# Integration test result — SWHM-S-0001

## Commands run

```
$ bun install
$ rm -rf .output dist auto-imports.d.ts && bun run build
$ bunx playwright test --list          # confirms one project ("chromium") covers all specs
$ bunx playwright install chromium     # container's pre-baked browser (chromium-1223) did not match
                                        # the pinned @playwright/test ~1.50.0 (needs chromium-1155);
                                        # PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 did not block an explicit install
$ bun run test:e2e -- --project=chromium
```

`playwright test --list` confirmed a single Playwright project (`chromium`) with `testMatch` covering
both spec files — no mobile/emulated project exists in `playwright.config.ts`, so `--project=chromium`
is the full covering selection.

## Results

| Spec                                                                           | Result | Notes |
| ------------------------------------------------------------------------------ | ------ | ----- |
| `e2e/home.spec.ts` › shows the hero content and desktop nav                    | pass   | 458ms |
| `e2e/home.spec.ts` › has no vertical scrollbar on common viewport sizes        | pass   | 533ms |
| `e2e/home.spec.ts` › opens and closes the mobile nav from the hamburger button | pass   | 600ms |
| `e2e/smoke.spec.ts` › home page loads with no console errors                   | pass   | 393ms |
| `e2e/smoke.spec.ts` › the API responds                                         | pass   | 325ms |
| `e2e/smoke.spec.ts` › a database-backed route responds                         | pass   | 357ms |

Playwright summary: `6 passed (3.3s)`

No spec file was wholly skipped; no failures.

E2E-RESULT: chromium 6 passed, 0 failed, 0 skipped
