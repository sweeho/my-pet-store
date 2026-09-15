---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0010
idea: Not Applicable
branch: vortex/sprint/swhm-s-0010-171cf530
upstream:
  [
    artifacts/SWHM-S-0010/SPRINT-PLAN.md,
    artifacts/SWHM-S-0010/SWHM-T-0098/fix-note.md,
    artifacts/SWHM-S-0010/SWHM-T-0098/tdd-test-result.md,
  ]
downstream: [artifacts/SWHM-S-0010/sprint-summary.md]
---

# QA test report — SWHM-S-0010

## Executive Summary

**Verdict: PASS.** SWHM-S-0010 is a single-ticket bugfix (SWHM-T-0098): the product and category
detail screens now distinguish a missing-translation 404 from a genuine not-found 404, via a fix to
the shared `useCatalogFetch` hook in `src/pages/catalog/shared.ts`. Verified on the integrated sprint
branch (commit `2fc2e9a`, merged): `bun run verify` (lint + typecheck + unit) is green at 318/318
tests, and the full Playwright E2E run is green at 23/23, including the new SWHM-T-0098 case. All five
scenarios in the change's delta spec (`internationalization` capability) verify pass. No defects
found; `integration-defects-resolution.md` is empty by design.

## E2E Test Status

Full run executed: `bun run test:e2e -- --project=chromium` → `23 passed (6.3s)`, 0 failed, 0 skipped.
Full command, per-spec table and Playwright's real output are in `integration-test-result.md`; not
duplicated here.

Scenario-level verdicts against
`openspec/changes/swhm-s-0010-bugfix-swhm-t-0098-product-d/specs/internationalization/spec.md`
(Requirement: "Language recovery from an untranslated screen"), each backed by the evidence named:

SCENARIO-VERDICT: Language recovery from an untranslated screen / Language can be changed from the untranslated screen — pass (`UnavailableInLanguage.test.tsx` UL-04, unit; `LanguageSwitcher`/`onChangeLocale` wired unchanged into the product and category screens' missing-translation branch, verified by inspection of `product/[productId].tsx` and `category/[categoryId].tsx`)
SCENARIO-VERDICT: Language recovery from an untranslated screen / The control still works after the language has already been changed — pass (`UnavailableInLanguage.test.tsx` UL-05, unit, regression test for repeated use)
SCENARIO-VERDICT: Language recovery from an untranslated screen / An untranslated product offers recovery instead of a not-found screen — pass (`e2e/language.spec.ts` SWHM-T-0098 case, executed above; `product/[productId].test.tsx` PT-02b, unit)
SCENARIO-VERDICT: Language recovery from an untranslated screen / The untranslated screen names the kind of thing it is describing — pass (`e2e/language.spec.ts` SWHM-T-0098 case asserts "This product has nothing translated…"; `UnavailableInLanguage.test.tsx` UL-03b, unit, `entity="product"`)
SCENARIO-VERDICT: Language recovery from an untranslated screen / A catalogue entry that does not exist still reaches the not-found screen — pass (`e2e/language.spec.ts` SWHM-T-0098 case: `NO-SUCH-PRODUCT` reaches Not Found; `product/[productId].test.tsx` PT-02, unit, unchanged)

No SPEC-GAP found — every requirement scenario has covering evidence.

## Unit Test Results

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  56 passed (56)
      Tests  318 passed (318)
   Duration  4.87s
```

Matches the ticket's own green run recorded in `artifacts/SWHM-S-0010/SWHM-T-0098/tdd-test-result.md`
(`TDD-RESULT: 318 passed, 0 failed`) — re-executed independently here on the integrated sprint branch
with the same result.

## Code Review

Reviewed `2fc2e9a` (the squash-merged SWHM-T-0098 commit) incidentally while verifying: `useCatalogFetch`
now parses the 404 body defensively (falls back to `"not-found"` on a missing/unparseable body, per
design.md D2); `MissingReason` is declared once in `shared.ts` rather than duplicated; the item screen's
page-local `useItemFetch` was deleted in favor of the shared hook with no rendered-output change; the
product and category screens branch on `reason` ahead of their existing, untouched `showUnavailable`
empty-list path. No notable concerns observed — the change matches its design note (D1–D4) and stays
within its declared file ownership.

## Coverage Summary

No coverage tool is declared in this project (`package.json` has no `coverage` script; `vitest.config.ts`
configures no coverage provider). Verified via the full test suite instead: 56 test files / 318 tests
green, spanning all five files SWHM-T-0098 owns (`shared.test.ts`, `product/[productId].test.tsx`,
`category/[categoryId].test.tsx`, `item/[itemId].test.tsx`, `UnavailableInLanguage.test.tsx`) plus the
extended `e2e/language.spec.ts`, per `tdd-test-result.md`'s test-case table.

## Issues Found

None. `integration-defects-resolution.md` records an empty defect set
(`INTEGRATION_DEFECTS_RESOLUTION: COMPLETE`).

## Recommendation

Proceed. Fire `validation.all_acs_passed` — every acceptance criterion holds, no defects were found,
and `integration-defects-resolution.md` needs no fix-in-place round.
