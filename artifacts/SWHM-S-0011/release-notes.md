---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0011
idea: Not Applicable
branch: vortex/sprint/swhm-s-0011-71ab47fb
upstream: [artifacts/SWHM-S-0011/qa-test-report.md]
---

# Release notes — SWHM-S-0011

## Fixed

- Opening a category that has no translation in the language you are reading now describes it as a category. It previously said "This item has nothing translated into …" on a screen showing a category. (SWHM-T-0105)

## Upgrade notes

None. No migration, configuration change, feature flag or breaking change. No API response shape moved, and the catalogue's content is unchanged.

The product and item screens' equivalent messages are unchanged, as is the "no products in this language yet" message shown when a category's product list is empty.

## Not included

Two related observations were found while investigating this defect and are deliberately not fixed here, since neither is the reported defect and both need a decision rather than a correction:

- A language the store does not offer is still named by its locale code in this panel's heading — "Not available in de_DE yet" rather than a language name. It is only reachable by typing an unsupported language into the address bar, never through the language switcher.
- Every category in the demo catalogue is fully translated into all three offered languages, so this panel cannot be reached on a category through normal browsing. Whether the demo catalogue should include a partly-translated category is a content decision.

Both are recorded in full under `## Follow-ups / out of scope` in `openspec/changes/swhm-s-0011-bugfix-swhm-t-0105-category/proposal.md`, which archives to `openspec/changes/archive/` when this sprint closes.

## Verification

Verified at integration QA — see `artifacts/SWHM-S-0011/qa-test-report.md` (PASS): 319/319 unit tests, 24/24 browser tests, and all 7 scenarios of the _Language recovery from an untranslated screen_ requirement.

## Compliance / Control Evidence

| Control / policy               | Evidence produced               | Location                                  | Status         | Exception |
| ------------------------------ | ------------------------------- | ----------------------------------------- | -------------- | --------- |
| Release contents recorded      | this file                       | `artifacts/SWHM-S-0011/release-notes.md`  | Satisfied      | —         |
| Release verified before land   | QA PASS verdict                 | `artifacts/SWHM-S-0011/qa-test-report.md` | Satisfied      | —         |
| Known limitations communicated | 2 items under `## Not included` | this file                                 | Satisfied      | —         |
| Breaking changes declared      | None in this release            | `Not Applicable`                          | Not Applicable | —         |
