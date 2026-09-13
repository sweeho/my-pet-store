---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0007
idea: SWHM-I-0005
branch: vortex/sprint/swhm-s-0007-d3b37ac1
upstream: [artifacts/SWHM-S-0007/SPRINT-PLAN.md, artifacts/SWHM-S-0007/PLANNING-NOTES.md]
downstream: [artifacts/SWHM-S-0007/sprint-summary.md]
---

# QA test report — SWHM-S-0007

## Executive Summary

**Verdict: PASS.** All 12 acceptance criteria for SWHM-I-0005 (Multi-Language Support) hold on the
integrated sprint branch. Verified by running the real gate (`bun run verify`: lint, typecheck,
297/297 unit tests), executing the real E2E suite (16/16 passed, 0 failed, 0 skipped — see
`integration-test-result.md`), and manually exercising every catalogue screen and every catalog API
endpoint across all three locales (en_US, ja_JP, zh_CN) plus the unsupported `de_DE` case the delta
spec's null scenario depends on. No defects found; `integration-defects-resolution.md` is empty.

## E2E Test Status

Executed. `16 passed (5.9s)`, 0 failed, 0 skipped, across all 6 spec files (`catalog.spec.ts`,
`customer-profile.spec.ts`, `home.spec.ts`, `language.spec.ts`, `signon.spec.ts`, `smoke.spec.ts`).
Full command, per-spec table and the marker line are in `artifacts/SWHM-S-0007/integration-test-result.md`.
The four new `language.spec.ts` tests (SWHM-T-0076) and all three pre-existing `catalog.spec.ts`
tests passed in the same run — nothing regressed.

## Unit Test Results

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(no output — clean)
$ tsc --build
(no output — clean)
$ NODE_ENV=test bun --bun vitest run
 Test Files  55 passed (55)
      Tests  297 passed (297)
   Duration  4.71s
```

297/297, matching the count reported by SWHM-T-0075's own summary (the last ticket to add tests
this sprint; SWHM-T-0076 added E2E-only, no unit tests).

## Code Review

No notable concerns observed while verifying. Two incidental observations, neither a defect:

- `document.documentElement.lang` is set to the raw locale token (`en_US`, `ja_JP`, `zh_CN`) rather
  than a hyphenated BCP-47 tag (`en-US`). This matches the pre-existing convention already used on
  the profile screen (`src/pages/customer.tsx:144,189`, shipped before this sprint), so it is
  consistent with the codebase, not a regression introduced here.
- Design fidelity (advisory, does not affect this verdict): compared the built category screen
  against `artifacts/SWHM-S-0007/design/mockup-category-page-in-language-menu-open.html` (ja_JP,
  menu open) and `mockup-category-page-in-no-content-in-this-lang.html` (zh_CN, empty state) by
  running the app and taking screenshots at the mockups' authored 1440×900 viewport. Layout, the
  trigger's position and content, the three-option menu with locale-code secondary labels and check
  mark, the footnote copy, and the empty-state heading/body/two-action copy all match the mockups
  verbatim. One minor deviation: the empty-state mockup shows a small globe icon centered above the
  "No products in 中文 yet" heading; the built page omits it. Cosmetic only.

## Coverage Summary

No coverage tool is configured in this project (`package.json` / `vitest.config.ts` carry no
`coverage` script or config). Verified via the full test-runner output above (297/297) and the
executed E2E suite (16/16); no coverage percentage is available to report.

## Issues Found

None.

Scenario verdicts — `openspec/changes/swhm-i-0005-multi-language-support/specs/internationalization/spec.md`:

SCENARIO-VERDICT: Multi-language support / Catalog displayed in selected language — pass
SCENARIO-VERDICT: Locale-based content retrieval / Category is retrieved in specified locale — pass
SCENARIO-VERDICT: Locale-based content retrieval / Missing locale content returns null — pass
SCENARIO-VERDICT: Language preference persistence / User language preference is stored — pass
SCENARIO-VERDICT: Locale parameter propagation / Locale is used in all queries — pass

Verified: `catalog/category.test.ts:28-33`, `catalog/product.test.ts:35-40`,
`catalog/item.test.ts:94-99` (null on missing locale, including the `de_DE` case the scenario
itself uses); `GET /api/catalog/categories?locale=ja_JP` and `?locale=zh_CN` returned localized
names/descriptions; `GET /api/catalog/search?q=bird&locale=ja_JP` returned Japanese-localized
results; `e2e/language.spec.ts` test 2 (signed-on locale persists into a fresh browser context).

Sprint-level acceptance criteria (from the ticket/idea), all PASS:

| #   | Criterion                                                           | Evidence                                                                                                         |
| --- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | Supports en_US, ja_JP, zh_CN                                        | `account/vocabulary.ts` `LANGUAGES`; verified in UI and API                                                      |
| 2   | Catalog queries return locale-specific content                      | `GET /api/catalog/categories?locale=…` for all three locales                                                     |
| 3   | Missing locale data returns null, no fallback                       | `de_DE` and `zh_CN` product/item checks above; no English leakage observed                                       |
| 4   | Preference stored in profile, applied by default                    | `e2e/language.spec.ts` test 2; `catalog.spec.ts:76`                                                              |
| 5   | Language control on all 4 catalogue screens                         | manually verified home/category/product/item screens all show the control                                        |
| 6   | Visitor switch survives reload + navigation                         | `e2e/language.spec.ts` test 1; manual reload check (犬 still shown after reload)                                 |
| 7   | Signed-on switch saved to profile, follows to new browser           | `e2e/language.spec.ts` test 2 (fresh browser context)                                                            |
| 8   | Empty category/product → named-language message + one-click English | manual check on `DOGS?locale=zh_CN`; "View in English (US)" click verified working                               |
| 9   | Item missing-translation vs unknown-id distinguished                | manual check: `BIRDS-PARROTS-1?locale=zh_CN` → unavailable message; `NO-SUCH-ITEM?locale=ja_JP` → Not Found page |
| 10  | en_US behavior unchanged                                            | pre-existing `catalog.spec.ts` (3 tests) pass unmodified                                                         |
| 11  | UI labels stay English                                              | manual check: "Search", "Previous", "Next" all English under ja_JP                                               |
| 12  | `html lang` matches displayed language                              | Playwright check: `en_US` → `lang="en_US"`, switch to `日本語` → `lang="ja_JP"`, persists after reload           |

## Recommendation

**Proceed — fire `validation.all_acs_passed`.** Every acceptance criterion and delta-spec scenario
passed with no defects found; no future-sprint DEFECT is warranted.
