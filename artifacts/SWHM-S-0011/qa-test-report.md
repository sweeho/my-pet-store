---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0011
idea: Not Applicable
branch: vortex/sprint/swhm-s-0011-71ab47fb
upstream:
  [
    artifacts/SWHM-S-0011/SPRINT-PLAN.md,
    artifacts/SWHM-S-0011/integration-test-result.md,
    artifacts/SWHM-S-0011/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHM-S-0011/sprint-summary.md]
---

# QA test report — SWHM-S-0011

Note on section list: this report carries the 7 sections named by SWHM-T-0107's acceptance criteria
and by this run's Validation role instructions (`Executive Summary`, `E2E Test Status`,
`Unit Test Results`, `Code Review`, `Coverage Summary`, `Issues Found`, `Recommendation`) — those
instructions are more specific than the general `artifact-qa-test-report` skill's 8-section template
(which adds `Design fidelity`). This sprint's ticket also carries no idea and no design reference
(`artifacts/SWHM-S-0011/SWHM-T-0105/PLAN.md` § Design reference), so a `Design fidelity` section would
have read "no design reference on this idea" regardless.

## Executive Summary

**Verdict: PASS.** The sprint's single ticket, SWHM-T-0105 (category screen's untranslated panel
called the category an "item"), is verified on the integrated sprint branch
(`vortex/sprint/swhm-s-0011-71ab47fb` at commit `2b65730`). `UnavailableInLanguage`'s `entity` prop is
now required and widened to `"category" | "product" | "item"` with no default, every one of its five
call sites across the category, product and item screens passes it explicitly, and the category
screen's missing-translation panel now reads "This category has nothing translated…" instead of "This
item…". All 7 scenarios in the change's delta spec verify pass (see `## Issues Found`). No regression
in the product or item screens' existing text. Full gate green: lint, typecheck, 319/319 unit tests,
build, and 24/24 E2E (including the sprint's own new assertion) all pass. No defects found; nothing
fixed in place; nothing escalated.

## E2E Test Status

24/24 Playwright specs passed, 0 failed, 0 skipped, run for real against the built integrated branch
(container had no preinstalled browser; installed Chromium via `bunx playwright install chromium`
before running). Full command, per-spec table and the `E2E-RESULT:` marker are in
`artifacts/SWHM-S-0011/integration-test-result.md`.

## Unit Test Results

```
$ bun run test
$ NODE_ENV=test bun --bun vitest run
 Test Files  56 passed (56)
      Tests  319 passed (319)
   Duration  4.81s
```

## Code Review

Reviewed the SWHM-T-0105 fix commit (`421b20e`) against `design.md`'s decisions D1–D3:

- D1 (required `entity`, default removed, union widened to include `"category"`) — implemented exactly
  as specified in `UnavailableInLanguage.tsx`; a caller omitting `entity` now fails to compile.
- D2 (`CONTAINER_NOUN` lookup table deleted, body built from `entity` directly) — done; no remaining
  reference to the table.
- D3 (three-tier coverage) — panel tier gained `UL-03c` (category subject, no `noun`); screen tier's
  `PT-02b`-equivalent test in `category/[categoryId].test.tsx` now asserts the body text, not only the
  heading; browser tier gained the category mirror of the product's SWHM-T-0098 assertion, reached via
  `?locale=de_DE` per the design note's § Verification note (no seeded category lacks a `zh_CN` row).
- All five call sites (`category/[categoryId].tsx` ×2, `product/[productId].tsx` ×1 new + 1 pre-existing,
  `item/[itemId].tsx` ×1) pass `entity` explicitly; the diff confirms only the category
  missing-translation branch's rendered text changed — the product and item screens' existing strings
  are byte-identical (`UL-02`, `UL-03`, `UL-03b`, product/item screen tests all pass unchanged).
- File/module ownership matches the ticket's declared list exactly; no fixed contract (API route
  shapes, `MissingReason`, `catalog/seed.ts`, `catalog/locale.ts`, `catalog/types.ts`,
  `useCatalogFetch`'s signature) was touched.

No notable concerns observed.

## Coverage Summary

No coverage tool is declared in this project (`vitest.config.ts` carries no `coverage` block, and
`verify`/`verify:full` do not run one) — confirmed by inspection. Correctness for this change is
established by the unit (319/319), E2E (24/24) and scenario-level verification above, not by a
coverage percentage.

## Issues Found

None. Scenario-by-scenario verdict against
`openspec/changes/swhm-s-0011-bugfix-swhm-t-0105-category/specs/internationalization/spec.md`
(Requirement: "Language recovery from an untranslated screen"):

SCENARIO-VERDICT: Language recovery from an untranslated screen / Language can be changed from the untranslated screen — pass (UL-04/UL-05 component-tier click flows in `UnavailableInLanguage.test.tsx`, `onChangeLocale` wired to `setLocale` in all three screens; pre-existing behaviour, unmodified by this ticket)
SCENARIO-VERDICT: Language recovery from an untranslated screen / The control still works after the language has already been changed — pass (UL-05, regression SWHM-T-0084, asserts a second open-and-select cycle within one render)
SCENARIO-VERDICT: Language recovery from an untranslated screen / An untranslated product offers recovery instead of a not-found screen — pass (`e2e/language.spec.ts:131`, SWHM-T-0098)
SCENARIO-VERDICT: Language recovery from an untranslated screen / The untranslated screen names the kind of thing it is describing — pass (`e2e/language.spec.ts:140` asserts "This product has nothing translated"; UL-03b)
SCENARIO-VERDICT: Language recovery from an untranslated screen / An untranslated category is described as a category — pass (`e2e/language.spec.ts:161` asserts "This category has nothing translated"; UL-03c; category screen test body assertion)
SCENARIO-VERDICT: Language recovery from an untranslated screen / An untranslated item is still described as an item — pass (UL-03 asserts "This item has nothing translated…"; item screen's PT-05 confirms the branch is reached and distinct from not-found)
SCENARIO-VERDICT: Language recovery from an untranslated screen / A catalogue entry that does not exist still reaches the not-found screen — pass (`e2e/language.spec.ts:122,145-148,166-169` and the three screens' own not-found tests)

No SPEC-GAP findings — every observed behaviour is covered by a written scenario.

Full defect/resolution ledger (empty — no defects): `artifacts/SWHM-S-0011/integration-defects-resolution.md`.

## Recommendation

**Proceed.** Every acceptance criterion and every scenario verifies pass on the integrated sprint
branch; no defects were found. Firing `validation.all_acs_passed`.
