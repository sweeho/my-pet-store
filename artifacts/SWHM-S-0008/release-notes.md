---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0008
idea: Not Applicable
branch: vortex/sprint/swhm-s-0008-6b835023
upstream: [artifacts/SWHM-S-0008/qa-test-report.md]
---

# Release notes — SWHM-S-0008

A maintenance release. Everything below is a fix; nothing new was added and no existing behaviour was intentionally altered.

## Fixed

- The home page now takes you somewhere. The top navigation offers **Catalog** and **My account**, "Log in" opens the sign-on screen, and "Get started" opens the catalogue — previously every one of these links did nothing when clicked. (SWHM-T-0081)
- The store's logo is now the store's own mark. The home page no longer loads its logo image from an unrelated third-party website. (SWHM-T-0080)
- Three demo screens listing invented people ("Alice Johnson", "Bob Smith", "Charlie Brown") at `/users`, `/users/1` and `/users/profile` are gone. Those addresses now show the normal page-not-found screen. (SWHM-T-0082)
- An item's detail page shows a recognisable placeholder picture instead of a broken-image icon when its photograph is unavailable. The item's name still describes the picture for screen readers, unchanged. (SWHM-T-0083)
- On a catalogue screen that has not been translated into the language you are reading, the panel's **Change language** button now works every time. Previously it worked only until the language menu in the page header had been opened once, after which it stopped responding for the rest of the visit. (SWHM-T-0084)
- The store's logo, in both the header and the mobile menu, now returns you to the home page instead of doing nothing. (Found during release verification and fixed before release; see `integration-defects-resolution.md`, DEFECT-1)

## Not included

- **Photographs for the 20 catalogue items.** The placeholder above is a degradation, not the picture: the store still has no image files for its seeded catalogue, so every item detail page shows the same placeholder. Supplying the photographs is a content decision — tracked as SWHM-T-0090.
- **The remaining template leftovers.** The project README still documents the demo screens removed in this release, and an unused placeholder API address remains in the source. Neither is visible to anyone using the store — tracked as SWHM-T-0091.

## Upgrade notes

None. No migration, configuration change, feature flag or breaking change. The `/api/users` endpoint and the `users` table behind it are unchanged — only the three demo _screens_ were removed.

## Verification

Verified at integration QA on the integrated sprint branch — see `artifacts/SWHM-S-0008/qa-test-report.md` (PASS: 11 of 11 specification scenarios, 302 unit tests, 20 browser tests).

## Compliance / Control Evidence

| Control                                  | Evidence                                           | Location                                                  | Status    | Exception |
| ---------------------------------------- | -------------------------------------------------- | --------------------------------------------------------- | --------- | --------- |
| Release contents recorded                | this file                                          | `artifacts/SWHM-S-0008/release-notes.md`                  | Satisfied | —         |
| Release verified before land             | QA PASS verdict, 11/11 scenarios                   | `artifacts/SWHM-S-0008/qa-test-report.md`                 | Satisfied | —         |
| Known limitations disclosed              | § Not included, both carrying a backlog ticket key | this file                                                 | Satisfied | —         |
| Release scope traceable to specification | OpenSpec change, three delta specs                 | `openspec/changes/swhm-s-0008-bugfix-found-by-inspector/` | Satisfied | —         |
