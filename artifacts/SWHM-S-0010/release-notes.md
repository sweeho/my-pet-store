---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0010
idea: Not Applicable
branch: vortex/sprint/swhm-s-0010-171cf530
upstream: [artifacts/SWHM-S-0010/qa-test-report.md]
---

# Release notes — SWHM-S-0010

A maintenance release with a single fix. Nothing new was added, and no existing behaviour was intentionally altered.

## Fixed

- **A product that has not been translated yet says so, instead of claiming it does not exist.** Viewing a product in a language it has no translation for used to show the store's "page not found" screen — a dead end with no way back and no hint that anything was reachable. It now shows the same panel the individual item pages already showed: a heading naming the language, a line saying nothing has gone wrong, a button to view the product in English (US), and a control to switch to another language. A product address that genuinely does not exist still shows page-not-found, exactly as before. (SWHM-T-0098)
- **Category pages get the same treatment.** A category with no translation in the language you are reading now offers the same recovery panel rather than the page-not-found screen. This is not reachable with the store's own languages — every category is translated into all three — but it was the same dead end sitting in the code, and it closed alongside the product one.

## Known issue in this release

- **A category page's untranslated message calls the category an "item".** On the category path described above, the panel's text reads "This item has nothing translated into …". The heading, the buttons and the recovery itself are all correct; only that one noun is wrong, and only on the category page. Reaching it requires requesting a language the store does not offer, by editing the address directly — the language switcher cannot produce it. Found while verifying this release and tracked as SWHM-T-0105; still an improvement on the dead end that stood there before.

## Not included

- **Photographs of the animals.** Catalogue pictures remain illustrations, not photographs — tracked as SWHM-T-0090, whose scope still needs narrowing or closing.
- **The remaining template leftovers.** The project README still documents screens removed three releases ago, an unused placeholder API address remains in the source, and an empty configuration file inherited from the template is still tracked. None is visible to anyone using the store — tracked as SWHM-T-0091.

## Upgrade notes

None. No migration, configuration change, feature flag or breaking change, and nothing to reinstall.

For anyone building on the code: the shared catalogue fetch hook now reports _why_ a read found nothing — "no such thing" or "exists, not translated" — in place of the yes/no flag it returned before. Every catalogue screen was updated with it, and no server response shape moved.

## Verification

Verified at integration QA on the integrated sprint branch — see `artifacts/SWHM-S-0010/qa-test-report.md` (PASS: 5 of 5 specification scenarios, 318 unit tests, 23 browser tests, no defects found). The known issue above was found afterwards, at sprint close, in text no specification scenario constrains.

## Compliance / Control Evidence

| Control                                | Evidence                                                         | Location                                                     | Status    | Exception                                                                                            |
| -------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------- |
| Change specified before implementation | OpenSpec change — proposal, design, one delta spec, tagged tasks | `openspec/changes/swhm-s-0010-bugfix-swhm-t-0098-product-d/` | Satisfied | —                                                                                                    |
| Change verified before release         | QA report, PASS verdict, 5/5 scenarios                           | `artifacts/SWHM-S-0010/qa-test-report.md`                    | Satisfied | —                                                                                                    |
| Defects dispositioned                  | 0 at integration QA; 1 found at close, filed as SWHM-T-0105      | `artifacts/SWHM-S-0010/sprint-summary.md`                    | Satisfied | —                                                                                                    |
| Tests executed                         | 318 unit + 23 E2E green on the integrated branch                 | `artifacts/SWHM-S-0010/integration-test-result.md`           | Satisfied | Browser tier not runnable in implementation containers; executed in CI and at integration QA instead |
| Release contents recorded              | these notes and the sprint summary                               | `artifacts/SWHM-S-0010/`                                     | Satisfied | —                                                                                                    |
