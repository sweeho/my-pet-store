---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0001
idea: SWHM-I-0001
branch: vortex/sprint/swhm-s-0001-64017bed
upstream: [artifacts/SWHM-S-0001/qa-test-report.md]
---

# Release notes — SWHM-S-0001

First release of My Pet Store. It is the foundation only: the application runs and names itself, with no shopping capability yet.

## Added

- The application is live at `/` and presents itself as **My Pet Store** — the hero heading, the navigation brand label and the page copy all name the product. (SWHM-T-0004)
- The browser tab reads "My Pet Store", and the site can be installed or pinned with the correct name via a new web app manifest, which previously 404ed. (SWHM-T-0004)

## Changed

- The home page no longer shows the starter template's product name, pitch or technology-chip list; the highlights it shows now describe the store. (SWHM-T-0004)

## Upgrade notes

None. This is the first release — there is nothing to migrate from, no configuration to change, and no feature flag.

## Not included

- Any shopping capability — catalogue, cart, checkout, payment or fulfilment. None was in the sprint's scope; PRODUCT.md § Not yet decided records what has to be settled before one can be specified.
- Accounts and sign-in. The `users` table and the request-scoped user in `middleware/auth.ts` are inherited demo content, not a product feature.
- A dark-mode toggle. Dark tokens exist but nothing sets `.dark` on `<html>` (DESIGN.md § Theming).

## Known limitations

- Destructive-style buttons render invisible text in light mode, inherited from the starter template. Tracked as SWHM-T-0005; dark mode is unaffected.

## Verification

Verified at integration QA — see `artifacts/SWHM-S-0001/qa-test-report.md` (PASS: lint, type-check, 20 unit tests, 6 end-to-end tests, and CI green on the sprint branch).

## Compliance / Control Evidence

| Control                        | Evidence                 | Location                                                   | Status    | Exception |
| ------------------------------ | ------------------------ | ---------------------------------------------------------- | --------- | --------- |
| Release contents recorded      | this file                | `artifacts/SWHM-S-0001/release-notes.md`                   | Satisfied | —         |
| Release verified before land   | QA PASS verdict          | `artifacts/SWHM-S-0001/qa-test-report.md`                  | Satisfied | —         |
| Known limitations communicated | SWHM-T-0005 listed above | `artifacts/SWHM-S-0001/sprint-summary.md` § Defects Raised | Satisfied | —         |
