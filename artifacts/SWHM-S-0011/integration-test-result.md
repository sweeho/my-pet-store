---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0011
idea: Not Applicable
branch: vortex/sprint/swhm-s-0011-71ab47fb
downstream: [artifacts/SWHM-S-0011/qa-test-report.md]
---

# Integration test result — SWHM-S-0011

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright install chromium   # container had no browser preinstalled; installed before running
$ bun run test:e2e -- --project=chromium
```

All run against the integrated sprint branch at commit `2b65730` (`vortex/sprint/swhm-s-0011-71ab47fb`).

## Results

Playwright summary (verbatim): `24 passed (6.5s)`

| Spec                                                                                                                                                                                  | Result | Notes                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| `e2e/catalog.spec.ts:26` › browses categories to products to an item, then finds the same item via search                                                                             | pass   | —                                                                       |
| `e2e/catalog.spec.ts:78` › an unknown category shows a not-found state rather than a blank screen                                                                                     | pass   | —                                                                       |
| `e2e/catalog.spec.ts:86` › a signed-on customer's preferred language is used as the catalog locale                                                                                    | pass   | —                                                                       |
| `e2e/customer-profile.spec.ts:33` › views, edits, saves, and keeps the language preference across a new session                                                                       | pass   | —                                                                       |
| `e2e/home.spec.ts:14` › shows the hero content and desktop nav                                                                                                                        | pass   | —                                                                       |
| `e2e/home.spec.ts:25` › has no vertical scrollbar on common viewport sizes                                                                                                            | pass   | —                                                                       |
| `e2e/home.spec.ts:42` › requests no font, stylesheet, or preconnect hint from a third-party host                                                                                      | pass   | —                                                                       |
| `e2e/home.spec.ts:69` › opens and closes the mobile nav from the hamburger button                                                                                                     | pass   | —                                                                       |
| `e2e/language.spec.ts:27` › a visitor's language choice on /catalog survives a reload and travels to a category screen                                                                | pass   | —                                                                       |
| `e2e/language.spec.ts:49` › a signed-on customer's chosen locale is stored in the profile and follows them into a fresh browser context                                               | pass   | —                                                                       |
| `e2e/language.spec.ts:96` › a visitor switched to 中文 sees Chinese category names, and an unavailable category offers a one-click return to English                                  | pass   | —                                                                       |
| `e2e/language.spec.ts:122` › an unknown item id under a non-default locale reaches Not Found, not the unavailable-in-this-language message                                            | pass   | —                                                                       |
| `e2e/language.spec.ts:131` › an untranslated product reaches the unavailable-in-language panel, and an unknown product id still reaches Not Found (SWHM-T-0098)                       | pass   | —                                                                       |
| `e2e/language.spec.ts:151` › an untranslated category reaches the unavailable-in-language panel naming the category, and an unknown category id still reaches Not Found (SWHM-T-0105) | pass   | sprint's own scenario — asserts "This category has nothing translated…" |
| `e2e/legacy-routes.spec.ts:17` › /users renders the not-found screen, not the boilerplate scaffold                                                                                    | pass   | —                                                                       |
| `e2e/legacy-routes.spec.ts:17` › /users/1 renders the not-found screen, not the boilerplate scaffold                                                                                  | pass   | —                                                                       |
| `e2e/legacy-routes.spec.ts:17` › /users/profile renders the not-found screen, not the boilerplate scaffold                                                                            | pass   | —                                                                       |
| `e2e/legacy-routes.spec.ts:26` › GET /api/users still answers with rows from the database                                                                                             | pass   | —                                                                       |
| `e2e/signon.spec.ts:33` › remembers the username after a sign-in with the checkbox checked                                                                                            | pass   | —                                                                       |
| `e2e/signon.spec.ts:59` › redirects an unauthenticated visit to /customer to /signon, then returns there after signing in                                                             | pass   | —                                                                       |
| `e2e/signon.spec.ts:88` › browsing the catalog anonymously does not corrupt the post-sign-in redirect                                                                                 | pass   | —                                                                       |
| `e2e/smoke.spec.ts:13` › home page loads with no console errors                                                                                                                       | pass   | —                                                                       |
| `e2e/smoke.spec.ts:26` › the API responds                                                                                                                                             | pass   | —                                                                       |
| `e2e/smoke.spec.ts:43` › a database-backed route responds                                                                                                                             | pass   | —                                                                       |

24 of 24 specs, one project (`chromium` — the only project declared in `playwright.config.ts`; `bunx playwright test --list` confirms every one of the 24 tests runs under it, so no project selection was missed).

## Notes on browser availability

`scripts/ensure-playwright-browser.mjs` failed the first `bun run test:e2e -- --project=chromium` attempt with "Chromium browser is not installed" — this validation container did not ship one preinstalled, contrary to `AGENTS.md`'s general expectation. Ran `bunx playwright install chromium` (successful download), then re-ran the E2E script, which then executed for real and produced the results above. No manual/heuristic substitute was used at any point.

E2E-RESULT: chromium 24 passed, 0 failed, 0 skipped
