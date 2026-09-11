---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0004
ticket: SWHM-T-0050
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
upstream: [artifacts/SWHM-S-0004/INTERFACES.md]
downstream: [artifacts/SWHM-S-0004/SWHM-T-0050/summary.md]
---

# Plan — SWHM-T-0050: Catalog query composition layer

## Objective

The one module that knows how a catalogue query is built. Pagination, the locale join and the search predicate each have a single definition here, so the four services that follow describe _what_ they read and never _how_ it is paged, joined or matched.

## Steps

1. Create `catalog/query.ts` exporting `paginatedQuery`, `localeJoin` and `searchPredicate` with the signatures fixed in `artifacts/SWHM-S-0004/INTERFACES.md` § Query composition.
2. `paginatedQuery(build, start, count)`: return `EMPTY_PAGE` for an invalid `start` or `count`, otherwise call `build(count + 1, start)` inside `readConsistent` and hand the rows to `buildPage`. The `+ 1` lives here and nowhere else — see `openspec/changes/swhm-i-0004-product-catalog-search/design.md` § Planning record, D3.
3. `localeJoin(detailsTable, locale)`: the single definition of the `locale = ?` condition, so two services cannot filter a locale differently.
4. `searchPredicate(keywords)`: AND across keywords, OR across the four searchable fields. Build it with the drizzle query builder — never an assembled SQL string (design.md § Planning record, D5).
5. Escape `%` and `_` in a keyword so it matches literally. The legacy concatenated keywords straight into its `LIKE` clauses; that is the one behaviour from § Search Implementation not to copy.
6. Write `catalog/query.test.ts` against a small fixture table: first, middle, final and out-of-range pages, and the wildcard-escaping assertion.

## File/module ownership

- `catalog/query.ts`
- `catalog/query.test.ts`

## Definition of Done

- AC-1 — the exported signatures against § Query composition.
- AC-2 — the `count + 1` request and the `readConsistent` call site.
- AC-3 — drizzle query builder throughout, no assembled SQL string.
- AC-4 — `localeJoin` as the single locale-condition definition.
- AC-5 — AND/OR structure and literal wildcard matching.
- AC-6 — the four page positions in `catalog/query.test.ts`.

## Design reference

_The idea carries no design blocks — `a2a_get_idea_design` returns an empty list, and the change's own § User Interface records that no screen records were extracted for this capability. Nothing was exported to `artifacts/SWHM-S-0004/design/`, and this ticket has no mockup to match._
