---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0003
idea: SWHM-I-0003
branch: vortex/sprint/swhm-s-0003-849ec4ef
downstream: [artifacts/SWHM-S-0003/qa-test-report.md]
---

# Integration test result — SWHM-S-0003

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list --project=chromium   # confirms project selection covers every spec — one project, "chromium", covers all 4 spec files
$ bun run test:e2e -- --project=chromium
```

Single Playwright project (`chromium`) is declared in `playwright.config.ts`; `--project=chromium` therefore covers every spec under `e2e/`, confirmed by the `--list` run (9 tests, 4 files).

## Results

First invocation of `bun run test:e2e -- --project=chromium` timed out waiting 120s for `config.webServer` to become ready. Diagnosis: this container's pre-installed Playwright browser cache (`/ms-playwright/chromium-1223`) does not match the project's pinned `@playwright/test@~1.50.0`, which requires build **1155** — the `pretest:e2e` preflight (`scripts/ensure-playwright-browser.mjs`) had in fact failed on the very first attempt with an explicit "Chromium browser is not installed" message pointing at the missing `chromium-1155` path. Ran `bunx playwright install chromium`, which fetched build 1155 (166.6 MiB) into `/ms-playwright/chromium-1155`. Immediately confirmed Vite's dev server itself starts and serves `200` in under 100ms both manually and under a direct `curl`, so the webServer timeout was specific to the missing browser binary / first-run disk contention during that fetch, not to the application. Re-ran the full command once more after the install completed; it passed cleanly with no timeout. This is an environment-provisioning gap in the QA container image, not a defect in the sprint's code — no DEFECT filed for it, no fix-in-place round consumed.

| Spec                                                                                                                   | Result | Notes                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/customer-profile.spec.ts` › views, edits, saves, and keeps the language preference across a new session           | pass   | 1.5s — full journey: view → edit → save → last-four-only card display → sign out (`clearCookies`) → sign back in → language preference and `lang` attribute persist |
| `e2e/home.spec.ts` › shows the hero content and desktop nav                                                            | pass   | 385ms                                                                                                                                                               |
| `e2e/home.spec.ts` › has no vertical scrollbar on common viewport sizes                                                | pass   | 594ms                                                                                                                                                               |
| `e2e/home.spec.ts` › opens and closes the mobile nav from the hamburger button                                         | pass   | 505ms                                                                                                                                                               |
| `e2e/signon.spec.ts` › remembers the username after a sign-in with the checkbox checked                                | pass   | 841ms                                                                                                                                                               |
| `e2e/signon.spec.ts` › redirects an unauthenticated visit to /customer to /signon, then returns there after signing in | pass   | 722ms                                                                                                                                                               |
| `e2e/smoke.spec.ts` › home page loads with no console errors                                                           | pass   | 235ms                                                                                                                                                               |
| `e2e/smoke.spec.ts` › the API responds                                                                                 | pass   | 327ms                                                                                                                                                               |
| `e2e/smoke.spec.ts` › a database-backed route responds                                                                 | pass   | 22ms                                                                                                                                                                |

Playwright summary (verbatim, second run): `9 passed (3.7s)`

## Skipped

None — every spec file ran and every test in it passed; no wholly-skipped file.

E2E-RESULT: chromium 9 passed, 0 failed, 0 skipped
