---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0004
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
upstream: [artifacts/SWHM-S-0004/qa-test-report.md]
---

# Release notes — SWHM-S-0004

My Pet Store now has a catalogue. A visitor can browse what the store sells and search it, without signing in.

## Added

- **Browse the catalogue at `/catalog`** — the five categories (Birds, Cats, Dogs, Fish, Reptiles), then the products in a category, then the items in a product, then one item's detail page with its image, five attributes and list price. (SWHM-T-0056)
- **Search the catalogue** from the search box on `/catalog`. A query is split into keywords; an item matches when every keyword appears in its name, its product's name, its category or its description, in any combination and regardless of case. Partial words match. (SWHM-T-0054, SWHM-T-0056)
- **Page through long lists.** Every catalogue screen shows 10 entries at a time with Previous and Next controls, and the page you are on travels in the URL (`?start=`), so a catalogue page can be bookmarked, shared and reloaded without losing your place. A caller of the API that omits `count` gets 25, and may ask for between 1 and 100. (SWHM-T-0047, SWHM-T-0056)
- **Catalogue content in the customer's language.** Category, product and item names and descriptions are stored per language — `en_US`, `ja_JP` and `zh_CN`. Content the store does not hold in a given language is reported as absent rather than shown in the wrong one. (SWHM-T-0048, SWHM-T-0051, SWHM-T-0052, SWHM-T-0053)
- **A public catalogue API** — seven read-only endpoints under `/api/catalog` (`categories`, `categories/:id`, `products`, `products/:id`, `items`, `items/:id`, `search`), each accepting `start`, `count` and `locale`. No endpoint requires a session; an unknown id answers 404 and an invalid parameter answers 400 with a plain reason. (SWHM-T-0055)
- **A demo catalogue** — five categories in three languages, with products and items beneath them — so a fresh installation has something to browse. (SWHM-T-0048)

## Changed

- **A signed-on customer's preferred language now also selects the catalogue's language.** Previously it set only the page's language attribute on the profile screen. A visitor with no session sees `en_US`. (SWHM-T-0056)

## Upgrade notes

- **A database migration is included** — `drizzle/0004_sloppy_ultimates.sql` adds six catalogue tables and five indexes. It is applied automatically on the first start after upgrading; nothing to run by hand.
- **The demo catalogue seeds itself into an empty database.** On first start, if the catalogue is empty, the demo content above is inserted. An installation that intends to hold real catalogue data should load it before first start, or clear the demo rows afterwards — there is no screen for either, because nothing in the product administers the catalogue yet.
- No configuration change, no feature flag, and no breaking change to an existing screen or endpoint.

## Not included

- **A link to the catalogue.** `/catalog` is reachable by URL only — the home page is still the template landing page and there is no site navigation. Recorded as SWHM-T-0062.
- **Catalogue administration.** Nothing in the product creates or edits a category, product or item; the catalogue is seeded data.
- **Anything that follows browsing** — cart, checkout, order placement and payment are out of this idea's scope.
- **An item's own name in the interface.** Item lists identify an item by its description, because the catalogue holds a name for the product rather than for each item beneath it.
- **A settled representation for money.** Prices are read and displayed but never summed or multiplied in this release; how money is represented once totals exist is still an open decision, recorded as SWHM-T-0058.

## Verification

Verified at integration QA against the merged sprint branch — see `artifacts/SWHM-S-0004/qa-test-report.md` (PASS): 23/23 specified scenarios, 4/4 idea acceptance criteria, 243 unit and integration tests and 12 browser tests green. One defect was found during QA and fixed in place; it was a timing fault in an existing browser test, not in released behaviour (`artifacts/SWHM-S-0004/integration-defects-resolution.md`).

## Compliance / Control Evidence

| Control                        | Evidence produced                                           | Location                                                   | Status    | Exception                                      |
| ------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------- | --------- | ---------------------------------------------- |
| Release contents recorded      | This file                                                   | `artifacts/SWHM-S-0004/release-notes.md`                   | Satisfied | —                                              |
| Release verified before land   | QA PASS verdict; 23/23 scenarios, 4/4 idea criteria         | `artifacts/SWHM-S-0004/qa-test-report.md`                  | Satisfied | —                                              |
| Known limitations communicated | § Not included, each item carrying its ticket key or reason | this file                                                  | Satisfied | —                                              |
| Schema change communicated     | Migration named, applied automatically on first start       | `drizzle/0004_sloppy_ultimates.sql`                        | Satisfied | —                                              |
| Open defects at release        | SWHM-T-0059, in BACKLOG for triage                          | `artifacts/SWHM-S-0004/sprint-summary.md` § Defects Raised | Satisfied | Affects a browser test, not released behaviour |
