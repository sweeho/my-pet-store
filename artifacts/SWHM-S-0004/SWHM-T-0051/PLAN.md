---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0004
ticket: SWHM-T-0051
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
upstream: [artifacts/SWHM-S-0004/INTERFACES.md]
downstream: [artifacts/SWHM-S-0004/SWHM-T-0051/summary.md]
---

# Plan — SWHM-T-0051: Category retrieval service

## Objective

The two category reads the capability specifies: one category by id in a locale, and a page of categories ordered by their localized name. Both go through `catalog/query.ts`; neither builds its own pagination or locale join.

## Steps

1. Create `catalog/category.ts` exporting `getCategory` and `getCategories` with the signatures fixed in `artifacts/SWHM-S-0004/INTERFACES.md` § Retrieval services.
2. `getCategory` joins `category` to `category_details` on the id and the locale, returning a `Category` or `null`. The same `null` answers both "no such category" and "no content in that locale" — which is the point of the entity/detail split (`openspec/changes/swhm-i-0004-product-catalog-search/design.md` § Planning record, D2, D4).
3. `getCategories` calls `paginatedQuery` with a builder that applies `localeJoin` and orders by the localized name ascending.
4. Order by the joined `category_details.name`, not by `catid`. The spec's ordering scenario lists display names, and ordering by id would pass it only by coincidence of the fixture.
5. Write `catalog/category.test.ts`: the four spec scenarios, the two null cases, the `EMPTY_PAGE` case, and the locale-dependent ordering assertion in AC-7.

## File/module ownership

- `catalog/category.ts`
- `catalog/category.test.ts`

## Definition of Done

- AC-1 (`Retrieve single category by ID — Category is retrieved by ID`) — `catalog/category.test.ts`.
- AC-2 (`Retrieve single category by ID — Non-existent category returns null`) — same.
- AC-3 (`Retrieve all categories paginated — Categories are retrieved in pages`) — same.
- AC-4 (`Retrieve all categories paginated — Categories are ordered by name`) — same.
- AC-5 — the signatures and the `catalog/query.ts` call sites.
- AC-6 — the missing-locale null and `EMPTY_PAGE`.
- AC-7 — ordering by localized name.

## Design reference

_The idea carries no design blocks — `a2a_get_idea_design` returns an empty list, and the change's own § User Interface records that no screen records were extracted for this capability. Nothing was exported to `artifacts/SWHM-S-0004/design/`, and this ticket has no mockup to match._
