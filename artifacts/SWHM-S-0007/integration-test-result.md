---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0007
idea: SWHM-I-0005
branch: vortex/sprint/swhm-s-0007-d3b37ac1
downstream: [artifacts/SWHM-S-0007/qa-test-report.md]
---

# Integration test result — SWHM-S-0007

## Commands run

```
$ bun install
$ bunx playwright install chromium   # this container had no browser preinstalled; installed once, then ran the real suite
$ bun run build
$ bunx playwright test --list        # confirmed there is one project (chromium) and it covers all 16 tests in 6 spec files
$ bunx playwright test --project=chromium --reporter=list
```

`playwright.config.ts` declares a single project (`chromium`), so `--project=chromium` is the full
coverage — there is no second (e.g. mobile/emulated) project whose specs would be silently skipped.

## Results

Playwright summary (verbatim): `16 passed (5.9s)`

| Spec                                                                                                                                               | Result | Notes                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------ |
| `e2e/catalog.spec.ts:26` browses categories to products to an item, then finds the same item via search                                            | pass   | pre-existing, unmodified this sprint             |
| `e2e/catalog.spec.ts:68` an unknown category shows a not-found state rather than a blank screen                                                    | pass   | pre-existing                                     |
| `e2e/catalog.spec.ts:76` a signed-on customer's preferred language is used as the catalog locale                                                   | pass   | pre-existing, exercises the new resolution order |
| `e2e/customer-profile.spec.ts:33` views, edits, saves, and keeps the language preference across a new session                                      | pass   | pre-existing                                     |
| `e2e/home.spec.ts:14` shows the hero content and desktop nav                                                                                       | pass   | pre-existing                                     |
| `e2e/home.spec.ts:25` has no vertical scrollbar on common viewport sizes                                                                           | pass   | pre-existing                                     |
| `e2e/home.spec.ts:42` opens and closes the mobile nav from the hamburger button                                                                    | pass   | pre-existing                                     |
| `e2e/language.spec.ts:27` a visitor's language choice on /catalog survives a reload and travels to a category screen                               | pass   | SWHM-T-0076, this sprint                         |
| `e2e/language.spec.ts:49` a signed-on customer's chosen locale is stored in the profile and follows them into a fresh browser context              | pass   | SWHM-T-0076, this sprint                         |
| `e2e/language.spec.ts:96` a visitor switched to 中文 sees Chinese category names, and an unavailable category offers a one-click return to English | pass   | SWHM-T-0076, this sprint                         |
| `e2e/language.spec.ts:122` an unknown item id under a non-default locale reaches Not Found, not the unavailable-in-this-language message           | pass   | SWHM-T-0076, this sprint                         |
| `e2e/signon.spec.ts:33` remembers the username after a sign-in with the checkbox checked                                                           | pass   | pre-existing                                     |
| `e2e/signon.spec.ts:59` redirects an unauthenticated visit to /customer to /signon, then returns there after signing in                            | pass   | pre-existing                                     |
| `e2e/smoke.spec.ts:13` home page loads with no console errors                                                                                      | pass   | pre-existing                                     |
| `e2e/smoke.spec.ts:26` the API responds                                                                                                            | pass   | pre-existing                                     |
| `e2e/smoke.spec.ts:43` a database-backed route responds                                                                                            | pass   | pre-existing                                     |

## Skipped

None — every spec file ran all of its tests; 0 skipped in Playwright's own summary.

E2E-RESULT: chromium 16 passed, 0 failed, 0 skipped
