---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0008
branch: vortex/sprint/swhm-s-0008-6b835023
downstream: [artifacts/SWHM-S-0008/qa-test-report.md]
---

# Integration test result — SWHM-S-0008

## Commands run

```
$ bun install
$ bun run build
$ bunx playwright test --list          # confirmed 20 tests / 7 spec files, all under the single "chromium" project — no project selection gap
$ bunx playwright install chromium     # container shipped Chromium 1223; this project's pinned @playwright/test ~1.50.0 (installed 1.50.1) expects build 1155 — see "Environment note" below
$ bun run test:e2e -- --project=chromium
```

## Results

| Spec                                    | Result | Notes                                                                                                                                                               |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e/catalog.spec.ts` (3 tests)         | pass   | browse categories→product→item→search; unknown category; signed-on customer locale                                                                                  |
| `e2e/customer-profile.spec.ts` (1 test) | pass   | view/edit/save profile, locale persists across a new session                                                                                                        |
| `e2e/home.spec.ts` (3 tests)            | pass   | hero + desktop nav, no vertical scrollbar, mobile nav open/close                                                                                                    |
| `e2e/language.spec.ts` (4 tests)        | pass   | locale survives reload; signed-on locale follows account; 中文 category names + "View in English" recovery; unknown item under non-default locale reaches Not Found |
| `e2e/legacy-routes.spec.ts` (4 tests)   | pass   | `/users`, `/users/1`, `/users/profile` all render not-found; `GET /api/users` still answers from the database                                                       |
| `e2e/signon.spec.ts` (2 tests)          | pass   | remembers username; unauthenticated `/customer` redirects to `/signon` and returns                                                                                  |
| `e2e/smoke.spec.ts` (3 tests)           | pass   | home loads with no console errors; API responds; a database-backed route responds                                                                                   |

Playwright summary: `20 passed (5.3s)`

## Environment note

`scripts/ensure-playwright-browser.mjs` initially failed the `pretest:e2e` hook: the container's
pre-installed Chromium was build 1223, but this project's pinned `@playwright/test` (`~1.50.0`,
installed `1.50.1`) resolves `chromium.executablePath()` to build 1155, which was not present.
`bunx playwright install chromium` fetched the matching 1155 build; the run above is against that
build. This is an environment/pin mismatch, not a product defect — no ticket or DEFECT filed for it.

## Additional ad-hoc browser verification (not part of the committed suite)

The committed suite exercises the untranslated-screen recovery via the panel's **"View in
English (US)"** one-click button (`e2e/language.spec.ts:96`), not the panel's own **"Change
language"** dropdown that SWHM-T-0084 added (`UnavailableInLanguage`'s own `LanguageSwitcher`,
`label="Change language"`). That control is covered by a real-browser regression cycle at the unit
tier (`UL-05` in `UnavailableInLanguage.test.tsx`, using `@testing-library/user-event`'s real
pointer+click dispatch, not a bare `.click()`). To close the gap between that and a real browser,
two disposable Playwright probes were run manually (not committed — see `qa-test-report.md` §
E2E Test Status for why):

```
$ bunx playwright test --project=chromium -g "QA probe"
  ✓ panel's own Change language menu opens with a real mouse click, twice in a row (489ms)
  1 passed (2.2s)
```

Opened the panel's "Change language" menu with a real `page.click()`, closed it with `Escape`,
then opened it again on the same button instance — both opens showed the menu items. This is
exactly RC-2's failure mode (`r.current === "mouse"` after one real press) and it does not
reproduce post-fix.

```
$ bunx playwright test --project=chromium -g "item image 404s"
  FINAL IMG SRC: /images/placeholder.svg
  IMAGE RESPONSES: ["404 http://localhost:5178/images/birds/african-grey.jpg","200 http://localhost:5178/images/placeholder.svg"]
  1 passed (2.5s)
```

Confirmed the seeded `/images/birds/african-grey.jpg` genuinely 404s (D-4's documented residual)
and the `<img>` falls back to `/images/placeholder.svg`, which loads.

```
$ bunx playwright test --project=chromium -g "manifest resolves"
  TITLE: My Pet Store
  MANIFEST STATUS: 200
  MANIFEST NAME: My Pet Store
```

These three probes are additional evidence gathered during AC verification; they are not new
regression specs and were deleted after running (see `qa-test-report.md`).

## Skipped

None. All 7 spec files ran their full test count; no spec file was wholly skipped.

E2E-RESULT: chromium 20 passed, 0 failed, 0 skipped
