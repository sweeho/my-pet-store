---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0004
ticket: SWHM-T-0047
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
upstream: [artifacts/SWHM-S-0004/INTERFACES.md]
downstream: [artifacts/SWHM-S-0004/SWHM-T-0047/summary.md]
---

# Plan — SWHM-T-0047: Pagination and navigation

## Objective

One module owns what a page is. `buildPage` turns at most `count + 1` rows into a `Page` whose `hasNext` is true exactly when the extra row arrived, `EMPTY_PAGE` covers every degenerate request, and `hasPrevious` answers the one navigation question the spec asks. No service computes any of this for itself.

## Steps

1. Create `catalog/page.ts` exporting `EMPTY_PAGE`, `buildPage` and `hasPrevious` with the signatures fixed in `artifacts/SWHM-S-0004/INTERFACES.md` § Pagination.
2. Implement `buildPage(rows, start, count)`: `hasNext` is `rows.length > count`, `objects` is the first `count` rows, `start` is echoed back. The caller is contracted to ask the database for `count + 1` rows — this is the whole of "hasNext SHALL be determinable without querying the total result count", per `openspec/changes/swhm-i-0004-product-catalog-search/design.md` § Planning record, D3.
3. Return `EMPTY_PAGE` for `start < 0`, for `count < 1`, and for an empty row set — the last covers a start position past the end, which produces no rows rather than an error.
4. Implement `hasPrevious` as `page.start > 0`.
5. Write `catalog/page.test.ts` covering the boundaries in AC-7, plus the two spec pagination scenarios expressed over a 100-row fixture.

Nothing here touches the database: `buildPage` takes rows and returns a page, which is what makes it testable without a fixture table and reusable by all four services.

## File/module ownership

- `catalog/page.ts`
- `catalog/page.test.ts`

## Definition of Done

- AC-1 (`Pagination with hasNext indicator — Page indicates next page availability`) — `catalog/page.test.ts`.
- AC-2 (`Pagination with hasNext indicator — Last page has no next`) — same.
- AC-3 (`Pagination with hasNext indicator — Previous page availability is indicated`) — `hasPrevious`.
- AC-4 — the `count + 1` contract and the dropped extra row.
- AC-5 — the `EMPTY_PAGE` cases.
- AC-6 — the exported signatures against § Pagination.
- AC-7 — the boundary cases.

## Design reference

_The idea carries no design blocks — `a2a_get_idea_design` returns an empty list, and the change's own § User Interface records that no screen records were extracted for this capability. Nothing was exported to `artifacts/SWHM-S-0004/design/`, and this ticket has no mockup to match._
