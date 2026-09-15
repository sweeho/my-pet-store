---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0009
idea: Not Applicable
branch: vortex/sprint/swhm-s-0009-bd3fbd00
upstream: [artifacts/SWHM-S-0009/qa-test-report.md]
---

# Release notes — SWHM-S-0009

A maintenance release. Everything below is a fix; nothing new was added and no existing behaviour was intentionally altered.

## Fixed

- **Catalogue items now show their own pictures.** Every item in the store has its own illustration — the four parrots and finches, the four cats, the four dogs, the four fish and the four reptiles are each drawn distinctly. Previously every item detail page showed the same grey placeholder, because the store had no picture files at all. (SWHM-T-0095)
- **Signing in takes you somewhere sensible again.** If you browsed the catalogue before signing in, the store used to send you to a page of raw technical data after you signed in. Now you land on the welcome screen, exactly as you do when you sign in without browsing first. Signing in after being asked to authenticate for a specific page still returns you to that page, unchanged. (SWHM-T-0097)
- **The store no longer loads anything from other companies' servers.** Every page was quietly fetching a typeface from Google's font service on each visit. Nothing in the store used that typeface, so removing it changes nothing you see — but the store's pages no longer depend on, or report your visit to, an outside service. (SWHM-T-0094)

## Not included

- **Photographs of the animals.** The pictures above are illustrations, not photographs. Supplying real product photography is a content and licensing decision rather than a code one — tracked as SWHM-T-0090, whose scope now needs narrowing or closing in light of this release.
- **The remaining template leftovers.** The project README still documents screens removed two releases ago, an unused placeholder API address remains in the source, and an empty configuration file inherited from the template is still tracked. None is visible to anyone using the store — tracked as SWHM-T-0091.

## Upgrade notes

None for anyone using the store. Two notes for anyone running or building it:

- The `unplugin-fonts` dependency was removed. Run the project's install step after taking this release so your lockfile matches.
- A request to a protected address that a page makes in the background is now answered `401` instead of being redirected to the sign-on page. No existing screen depended on the redirect — the one caller already treated any non-OK answer as "not signed in" — but anything new that reads a protected address in the background should expect the `401`.

No migration, configuration change, feature flag or breaking API change. `AccessVerdict`, `evaluateAccess`, the protected-resource list and the sign-on response body are all unchanged.

## Verification

Verified at integration QA on the integrated sprint branch — see `artifacts/SWHM-S-0009/qa-test-report.md` (PASS: 13 of 13 specification scenarios, 311 unit tests, 22 browser tests, no defects found).

## Compliance / Control Evidence

| Control                                | Evidence                                                            | Location                                                     | Status    | Exception                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------- |
| Change specified before implementation | OpenSpec change — proposal, design, three delta specs, tagged tasks | `openspec/changes/swhm-s-0009-bugfix-swhm-t-0094-swhm-t-00/` | Satisfied | —                                                                                                    |
| Change verified before release         | QA report, PASS verdict, 13/13 scenarios                            | `artifacts/SWHM-S-0009/qa-test-report.md`                    | Satisfied | —                                                                                                    |
| Defects dispositioned                  | 0 found at integration QA; empty set recorded and marked COMPLETE   | `artifacts/SWHM-S-0009/integration-defects-resolution.md`    | Satisfied | —                                                                                                    |
| Tests executed                         | 311 unit + 22 E2E green on the integrated branch                    | `artifacts/SWHM-S-0009/integration-test-result.md`           | Satisfied | Browser tier not runnable in implementation containers; executed in CI and at integration QA instead |
| Release contents recorded              | these notes and the sprint summary                                  | `artifacts/SWHM-S-0009/`                                     | Satisfied | —                                                                                                    |
