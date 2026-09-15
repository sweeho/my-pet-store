---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0009
idea: Not Applicable
branch: vortex/sprint/swhm-s-0009-bd3fbd00
downstream: [artifacts/SWHM-S-0009/qa-test-report.md]
---

# Integration test result — SWHM-S-0009

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list      # confirmed a single "chromium" project covers all 22 tests / 7 spec files
$ bun run test:e2e -- --project=chromium
```

The container's `/ms-playwright` initially held only revision 1223 (chromium-1223,
chromium_headless_shell-1223); this repo pins `@playwright/test` `~1.50.0`, which requires revision 1155. The `pretest:e2e` preflight (`scripts/ensure-playwright-browser.mjs`) correctly failed fast on
the mismatch rather than hanging. Ran `bun x playwright install chromium` to fetch revision 1155
(downloaded to `/ms-playwright/chromium-1155` and `/ms-playwright/chromium_headless_shell-1155`),
then re-ran the command above, which passed the preflight and executed for real.

## Results

| Spec                                                                                                                                              | Result | Notes                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------ |
| `e2e/catalog.spec.ts` › browses categories to products to an item, then finds the same item via search                                            | pass   | 1.5s                                 |
| `e2e/catalog.spec.ts` › an unknown category shows a not-found state rather than a blank screen                                                    | pass   | 385ms                                |
| `e2e/catalog.spec.ts` › a signed-on customer's preferred language is used as the catalog locale                                                   | pass   | 1.0s                                 |
| `e2e/customer-profile.spec.ts` › views, edits, saves, and keeps the language preference across a new session                                      | pass   | 1.9s                                 |
| `e2e/home.spec.ts` › shows the hero content and desktop nav                                                                                       | pass   | 348ms                                |
| `e2e/home.spec.ts` › has no vertical scrollbar on common viewport sizes                                                                           | pass   | 680ms                                |
| `e2e/home.spec.ts` › requests no font, stylesheet, or preconnect hint from a third-party host                                                     | pass   | 363ms — SWHM-T-0094 regression guard |
| `e2e/home.spec.ts` › opens and closes the mobile nav from the hamburger button                                                                    | pass   | 481ms                                |
| `e2e/language.spec.ts` › a visitor's language choice on /catalog survives a reload and travels to a category screen                               | pass   | 892ms                                |
| `e2e/language.spec.ts` › a signed-on customer's chosen locale is stored in the profile and follows them into a fresh browser context              | pass   | 2.0s                                 |
| `e2e/language.spec.ts` › a visitor switched to 中文 sees Chinese category names, and an unavailable category offers a one-click return to English | pass   | 996ms                                |
| `e2e/language.spec.ts` › an unknown item id under a non-default locale reaches Not Found, not the unavailable-in-this-language message            | pass   | 388ms                                |
| `e2e/legacy-routes.spec.ts` › /users renders the not-found screen, not the boilerplate scaffold                                                   | pass   | 343ms                                |
| `e2e/legacy-routes.spec.ts` › /users/1 renders the not-found screen, not the boilerplate scaffold                                                 | pass   | 398ms                                |
| `e2e/legacy-routes.spec.ts` › /users/profile renders the not-found screen, not the boilerplate scaffold                                           | pass   | 409ms                                |
| `e2e/legacy-routes.spec.ts` › GET /api/users still answers with rows from the database                                                            | pass   | 18ms                                 |
| `e2e/signon.spec.ts` › remembers the username after a sign-in with the checkbox checked                                                           | pass   | 1.1s                                 |
| `e2e/signon.spec.ts` › redirects an unauthenticated visit to /customer to /signon, then returns there after signing in                            | pass   | 675ms                                |
| `e2e/signon.spec.ts` › browsing the catalog anonymously does not corrupt the post-sign-in redirect                                                | pass   | 855ms — SWHM-T-0097 regression guard |
| `e2e/smoke.spec.ts` › home page loads with no console errors                                                                                      | pass   | 300ms                                |
| `e2e/smoke.spec.ts` › the API responds                                                                                                            | pass   | 49ms                                 |
| `e2e/smoke.spec.ts` › a database-backed route responds                                                                                            | pass   | 15ms                                 |

Playwright summary: `22 passed (6.3s)`

Note: `e2e/catalog.spec.ts`'s item-detail scenario (SWHM-T-0095's own-image assertion,
`toHaveAttribute("src", "/images/birds/african-grey.svg")`, plus the no-404-image-response check) is
folded into the first row above — it is the same spec/test SWHM-T-0095 extended, not a separate test.

## Skipped

None — 0 skipped, and no spec file ran zero of its tests.

E2E-RESULT: chromium 22 passed, 0 failed, 0 skipped
