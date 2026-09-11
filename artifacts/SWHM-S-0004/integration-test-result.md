---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0004
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
downstream: [artifacts/SWHM-S-0004/qa-test-report.md]
---

# Integration test result — SWHM-S-0004

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list --project=chromium   # confirms project selection covers every spec
$ bun run test:e2e -- --project=chromium
```

Single Playwright project (`chromium`) is declared in `playwright.config.ts`; `--project=chromium` therefore covers every spec under `e2e/`, confirmed by the `--list` run (12 tests, 5 files).

The container's pre-provisioned `/ms-playwright/chromium-1223` did not match the pinned `@playwright/test@~1.50.1`, which needs build `1155` — `pretest:e2e`'s preflight correctly failed fast on the first attempt. Ran `bunx playwright install chromium` (fetched build 1155), matching the remediation already recorded for this same environment gap in `artifacts/SWHM-S-0002/integration-test-result.md` and `artifacts/SWHM-S-0003/integration-test-result.md`. This is an environment-provisioning gap in the QA container image, not a defect in the sprint's code — no DEFECT filed for it, no fix-in-place round consumed.

The first full run surfaced one failing spec, `e2e/customer-profile.spec.ts` (pre-existing SWHM-S-0003 coverage, not part of this sprint's catalog scope) — diagnosed and fixed in place; see `integration-defects-resolution.md` DEFECT-1. Results below are from the re-run after that fix.

## Results

| Spec                                                                                                                   | Result | Notes                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| `e2e/catalog.spec.ts` › browses categories to products to an item, then finds the same item via search                 | pass   | 1.3s — AC-1 (categories/products/items with names+descriptions), full browse-then-search journey            |
| `e2e/catalog.spec.ts` › an unknown category shows a not-found state rather than a blank screen                         | pass   | 356ms                                                                                                       |
| `e2e/catalog.spec.ts` › a signed-on customer's preferred language is used as the catalog locale                        | pass   | 901ms — AC-4, locale parameter filters content                                                              |
| `e2e/customer-profile.spec.ts` › views, edits, saves, and keeps the language preference across a new session           | pass   | 1.8s — pre-existing SWHM-S-0003 coverage; DEFECT-1 fixed in place (see `integration-defects-resolution.md`) |
| `e2e/home.spec.ts` › shows the hero content and desktop nav                                                            | pass   | 352ms — pre-existing                                                                                        |
| `e2e/home.spec.ts` › has no vertical scrollbar on common viewport sizes                                                | pass   | 503ms — pre-existing                                                                                        |
| `e2e/home.spec.ts` › opens and closes the mobile nav from the hamburger button                                         | pass   | 481ms — pre-existing                                                                                        |
| `e2e/signon.spec.ts` › remembers the username after a sign-in with the checkbox checked                                | pass   | 867ms — pre-existing                                                                                        |
| `e2e/signon.spec.ts` › redirects an unauthenticated visit to /customer to /signon, then returns there after signing in | pass   | 759ms — pre-existing                                                                                        |
| `e2e/smoke.spec.ts` › home page loads with no console errors                                                           | pass   | 212ms — pre-existing                                                                                        |
| `e2e/smoke.spec.ts` › the API responds                                                                                 | pass   | 12ms — pre-existing                                                                                         |
| `e2e/smoke.spec.ts` › a database-backed route responds                                                                 | pass   | 103ms — pre-existing                                                                                        |

Playwright summary (verbatim, post-fix run): `12 passed (4.4s)`

## Skipped

None — every spec file ran and every test in it passed; no wholly-skipped file.

E2E-RESULT: chromium 12 passed, 0 failed, 0 skipped
