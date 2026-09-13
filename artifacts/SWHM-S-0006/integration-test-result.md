---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0006
idea: Not Applicable
branch: vortex/sprint/swhm-s-0006-e3b91808
downstream: [artifacts/SWHM-S-0006/qa-test-report.md]
---

# Integration test result — SWHM-S-0006

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list
$ bun run test:e2e --project=chromium
```

Chromium was not preinstalled in this container (`node scripts/ensure-playwright-browser.mjs` reported it missing at `/ms-playwright/chromium-1155/chrome-linux/chrome`). Installed it with `bunx playwright install chromium` (no `--with-deps`, which needs root and failed here) before running the suite.

`bunx playwright test --list` confirmed all 12 tests in 5 spec files land under the single `chromium` project declared in `playwright.config.ts` — there is no second (e.g. mobile/emulated) project to also select.

## Results

Playwright summary (final run): `12 passed (4.0s)`

| Spec                                                                                                                    | Result | Notes                          |
| ----------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------ |
| `e2e/catalog.spec.ts:26` browses categories to products to an item, then finds the same item via search                 | pass   | 1.3s                           |
| `e2e/catalog.spec.ts:68` an unknown category shows a not-found state rather than a blank screen                         | pass   | 420ms                          |
| `e2e/catalog.spec.ts:76` a signed-on customer's preferred language is used as the catalog locale                        | pass   | 988ms                          |
| `e2e/customer-profile.spec.ts:33` views, edits, saves, and keeps the language preference across a new session           | pass   | 1.7s (SWHM-T-0059 target spec) |
| `e2e/home.spec.ts:14` shows the hero content and desktop nav                                                            | pass   | —                              |
| `e2e/home.spec.ts:25` has no vertical scrollbar on common viewport sizes                                                | pass   | 541ms                          |
| `e2e/home.spec.ts:42` opens and closes the mobile nav from the hamburger button                                         | pass   | 398ms                          |
| `e2e/signon.spec.ts:33` remembers the username after a sign-in with the checkbox checked                                | pass   | 786ms                          |
| `e2e/signon.spec.ts:59` redirects an unauthenticated visit to /customer to /signon, then returns there after signing in | pass   | 697ms                          |
| `e2e/smoke.spec.ts:13` home page loads with no console errors                                                           | pass   | 182ms                          |
| `e2e/smoke.spec.ts:26` the API responds                                                                                 | pass   | 11ms                           |
| `e2e/smoke.spec.ts:43` a database-backed route responds                                                                 | pass   | 81ms                           |

0 failed, 0 skipped. No spec file ran zero tests.

## Flake check on the ticket's own target

SWHM-T-0059 exists specifically because `e2e/customer-profile.spec.ts:33` flaked on a blind 5000ms content-assertion timeout under load. Ran the full suite three times to check the fix holds:

1. First run — `12 passed (5.6s)`; target spec passed in 2.3s.
2. Second run — the whole run failed before any test executed: `Error: Timed out waiting 120000ms from config.webServer.` No spec ran (0 attempted). This is a `webServer` (Vite dev server) startup failure in this container, not a test or assertion failure — nothing about the app or the fix under test was exercised. Per rules of engagement on flakes/outages outside the change, retried rather than bisected.
3. Third run — `12 passed (4.0s)`; target spec passed in 1.7s.

The second run's timeout is recorded here for transparency but is not counted as an E2E failure: Playwright never started a test, so there is no spec-level result to attribute to it, and it is not reproducible (immediate retry succeeded cleanly). The `E2E-RESULT` marker below reflects the third (clean, full) run.

## Skipped

None.

E2E-RESULT: chromium 12 passed, 0 failed, 0 skipped
