---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0006
idea: Not Applicable
branch: vortex/sprint/swhm-s-0006-e3b91808
upstream: [artifacts/SWHM-S-0006/qa-test-report.md]
---

# Release notes — SWHM-S-0006

## Fixed

- The customer profile page and the sign-on welcome page no longer show a blank white screen while they load. Both now say what they are doing — "Checking access…", then "Loading account…" — and the profile shows its "Customer Profile" heading from the moment it opens instead of only once the account has arrived. (SWHM-T-0059)

Previously these pages rendered nothing at all until two requests had completed one after the other, with no indication that anything was happening. On a slow or busy server a visitor could not tell a loading page from a broken one.

The wait itself has not changed length — the pages load in the same time they always did. What changed is that the wait is now visible.

## Accessibility

The new indicators are announced to screen readers as status updates, without stealing focus from what the reader is on. This is now the project's standard for any screen that waits on data — recorded in `DESIGN.md` § Loading states.

## Upgrade notes

None. No migration, configuration change, feature flag or breaking change. Two components and one browser test changed; nothing a deployment needs to do.

## Not included

**No multi-language work shipped in this sprint**, despite its name. The sprint is titled "Multi-Language Support" and its change is filed under `swhm-s-0006-multi-language-support`, but the only committed ticket was the unrelated render-timing defect above. Multi-language support remains unbuilt.

The catalogue pages still render blank while they load — they have the same shape this sprint fixed on the profile page, but were not touched. Recorded as finding F1 in `artifacts/SWHM-S-0006/sprint-summary.md` for a later sprint.

## Verification

Verified at integration QA — see `artifacts/SWHM-S-0006/qa-test-report.md` (PASS, no defects found). Unit suite 250/250, all 12 browser specs green, and the previously-flaky profile test run three separate times rather than once.

## Compliance / Control Evidence

| Control                        | Evidence                | Location                                  | Status    | Exception |
| ------------------------------ | ----------------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded      | this file               | `artifacts/SWHM-S-0006/release-notes.md`  | Satisfied | —         |
| Release verified before land   | QA PASS verdict         | `artifacts/SWHM-S-0006/qa-test-report.md` | Satisfied | —         |
| Known limitations communicated | `## Not included` above | this file                                 | Satisfied | —         |
