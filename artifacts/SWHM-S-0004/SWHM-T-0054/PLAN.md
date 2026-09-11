---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0004
ticket: SWHM-T-0054
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
upstream: [artifacts/SWHM-S-0004/INTERFACES.md]
downstream: [artifacts/SWHM-S-0004/SWHM-T-0054/summary.md]
---

# Plan — SWHM-T-0054: Item search service

## Objective

A shopper's words find items. The query is split into keywords, every keyword has to match somewhere, and each may match the item name, the product name, the category id or the item description. Results page like every other list.

## Steps

1. Create `catalog/search.ts` exporting `tokenize` and `searchItems` with the signatures fixed in `artifacts/SWHM-S-0004/INTERFACES.md` § Retrieval services.
2. `tokenize` splits on whitespace and drops empty tokens, so runs of spaces, tabs and newlines behave as one separator and a whitespace-only query yields no keywords.
3. `searchItems` returns `EMPTY_PAGE` when there are no keywords. A predicate built from an empty keyword list would otherwise match every item in the catalogue.
4. Compose the predicate with `searchPredicate` from `catalog/query.ts` and page it with `paginatedQuery`. The four searchable fields are the requirement text's, which is a superset of the fields the extraction's example SQL shows — see `openspec/changes/swhm-i-0004-product-catalog-search/design.md` § Planning record, S7.
5. Order results by the localized item name, for the same stability reason as `getItems` (design.md § Planning record, S10).
6. Write `catalog/search.test.ts` over a fixture that contains an item matching `large` and `african`, an item matching `parrot` but not `african`, and an item matching neither. The AND assertion in AC-7 needs all three to be able to fail.

## File/module ownership

- `catalog/search.ts`
- `catalog/search.test.ts`

## Definition of Done

- AC-1 (`Full-text search of items — Search returns items matching keywords`) — `catalog/search.test.ts`.
- AC-2 (`Full-text search of items — Search results are paginated`) — same.
- AC-3 (`Full-text search of items — Single keyword search`) — same.
- AC-4 — the exported signatures.
- AC-5 — tokenization and the empty-query result.
- AC-6 — case-insensitive and partial matching.
- AC-7 — AND across keywords, over the three-item fixture.

## Design reference

_The idea carries no design blocks — `a2a_get_idea_design` returns an empty list, and the change's own § User Interface records that no screen records were extracted for this capability. Nothing was exported to `artifacts/SWHM-S-0004/design/`, and this ticket has no mockup to match._
