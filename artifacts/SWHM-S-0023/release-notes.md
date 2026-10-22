---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0023
idea: swhm-s-0023-bugfix-swhm-t-0096-inspector
branch: vortex/sprint/swhm-s-0023-8ac9cbb9
upstream: [artifacts/SWHM-S-0023/qa-test-report.md]
---

# Release notes — SWHM-S-0023

## Fixed

Nothing in the store. This release contains no change to the application.

## Upgrade notes

None. No database migration, no configuration change, no feature flag, and nothing a user has to do.

## Not included

- **The automated inspector can leave test accounts behind on a preview screen (SWHM-T-0096).** This was the sprint's only committed defect. It belongs to the platform that inspects the store, not to the store. When the inspector signs up through the store's own forms, the platform keeps no record of the accounts it created, so it cannot remove them afterwards. No change to this application can fix that, so the defect stays open against the platform. It affects nobody using the store.

## Verification

Verified at integration QA against the sprint branch. See `artifacts/SWHM-S-0023/qa-test-report.md`: PASS, with 902 unit tests and 47 end-to-end tests passing and no defects found. This was a regression run of the unchanged product.

## Compliance / Control Evidence

| Control                                  | Evidence produced                  | Location                                  | Status    | Exception |
| ---------------------------------------- | ---------------------------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded                | this file                          | `artifacts/SWHM-S-0023/release-notes.md`  | Satisfied | —         |
| Release verified before land             | QA PASS verdict, no defects found  | `artifacts/SWHM-S-0023/qa-test-report.md` | Satisfied | —         |
| Known limitations communicated           | § Not included, naming SWHM-T-0096 | this file                                 | Satisfied | —         |
| Breaking changes and migrations declared | § Upgrade notes: none              | this file                                 | Satisfied | —         |
