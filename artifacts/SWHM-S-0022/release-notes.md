---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0022
idea: swhm-s-0022-bugfix-swhm-t-0235-swhm-t-02
branch: vortex/sprint/swhm-s-0022-75bc2a59
upstream: [artifacts/SWHM-S-0022/qa-test-report.md]
---

# Release notes — SWHM-S-0022

## Fixed

- Two pages that were never meant to be visited are no longer reachable. Typing `/RootErrorBoundary` used to show a bare "An error occurred. Please try again later." page with nothing actually wrong and no way onward; typing `/NotFound` used to show the not-found screen at a second address of its own. Both now show the not-found screen, the same one any unrecognised address has always shown. (SWHM-T-0239)

## Upgrade notes

None. No database migration, no configuration change, no feature flag, and nothing a user has to do. No screen anyone was meant to visit changed in any way.

## Not included

- **A dispatched agent run can still be stranded without a codebase context (SWHM-T-0235).** This was the sprint's other committed defect. It is fully diagnosed, but it belongs to the platform that runs the agents rather than to the store, and no change to this application can fix it — so it ships unfixed and stays open. It affects nobody using the store.
- `RootErrorBoundary.tsx` is now unreachable but still present, and nothing in the application renders it. Whether to wire up an error boundary or remove the file is a question for a sprint that is actually asking about error handling.

## Verification

Verified at integration QA against the merged sprint branch — see `artifacts/SWHM-S-0022/qa-test-report.md` (PASS: 8 of 8 scenarios, 902 unit tests, 47 end-to-end tests, no defects found).

## Compliance / Control Evidence

| Control                                  | Evidence produced                  | Location                                  | Status    | Exception |
| ---------------------------------------- | ---------------------------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded                | this file                          | `artifacts/SWHM-S-0022/release-notes.md`  | Satisfied | —         |
| Release verified before land             | QA PASS verdict, no defects found  | `artifacts/SWHM-S-0022/qa-test-report.md` | Satisfied | —         |
| Known limitations communicated           | § Not included, naming SWHM-T-0235 | this file                                 | Satisfied | —         |
| Breaking changes and migrations declared | § Upgrade notes — none             | this file                                 | Satisfied | —         |
