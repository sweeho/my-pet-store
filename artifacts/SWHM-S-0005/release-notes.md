---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0005
idea: Not Applicable
branch: vortex/sprint/swhm-s-0005-1423bc6d
upstream: [artifacts/SWHM-S-0005/qa-test-report.md]
---

# Release notes — SWHM-S-0005

## Fixed

- Text on destructive controls — the red "delete"-style buttons — is now readable in the light theme. It was previously painted in exactly the button's own background colour, so the label was invisible. (SWHM-T-0005)

**Nothing changes on screen today.** No page in My Pet Store currently uses the destructive button style, so there is no screen where the label was visibly missing and none where it now appears. The fix matters for the next destructive control added — it will be readable on arrival rather than shipping invisible.

## Upgrade notes

None. No migration, configuration change, feature flag or breaking change. A single colour value in the light theme moved from red to white; nothing a deployment needs to do.

## Not included

The dark theme's destructive colours were not touched. That pair is legible but measures 2.63:1, below the 4.5:1 WCAG AA minimum for normal text — a distinct problem from the light-theme one this sprint fixed, recorded as finding F1 in `artifacts/SWHM-S-0005/sprint-summary.md` for a later sprint.

Only the destructive pair is covered by the new automated contrast check. The other theme colour pairs are unverified.

## Verification

Verified at integration QA — see `artifacts/SWHM-S-0005/qa-test-report.md` (PASS, no defects found).

## Compliance / Control Evidence

| Control                        | Evidence                | Location                                  | Status    | Exception |
| ------------------------------ | ----------------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded      | this file               | `artifacts/SWHM-S-0005/release-notes.md`  | Satisfied | —         |
| Release verified before land   | QA PASS verdict         | `artifacts/SWHM-S-0005/qa-test-report.md` | Satisfied | —         |
| Known limitations communicated | `## Not included` above | this file                                 | Satisfied | —         |
