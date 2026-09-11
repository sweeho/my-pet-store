---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0004
ticket: SWHM-T-0057
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
upstream: [artifacts/SWHM-S-0004/INTERFACES.md]
downstream: [artifacts/SWHM-S-0004/SWHM-T-0057/summary.md]
---

# Plan — SWHM-T-0057: Catalog performance verification

## Objective

Prove the two properties the capability's performance rests on: a page read costs the same whatever the catalogue's size, and every paginated read uses the index built for it rather than scanning. Both are assertions over the shipped code — this ticket changes no behaviour.

## Steps

1. Create `catalog/performance.test.ts` with a fixture builder that inserts at least 1,000 categories and 1,000 items with their locale detail rows.
2. Assert a page read returns only the requested page, and that the row count the database is asked for is `count + 1` regardless of fixture size — the property `paginatedQuery` exists to guarantee (`openspec/changes/swhm-i-0004-product-catalog-search/design.md` § Planning record, D3).
3. Assert a five-keyword search returns a correct result set over the large fixture, which is where the extraction's § Performance Considerations warns multiple `LIKE` conditions degrade.
4. Assert index use with `EXPLAIN QUERY PLAN` on the three paginated reads: the locale index on `category_details`, `product(catid)` and `item(productid)`. This is what verifies SWHM-T-0046's indexes are actually reachable by the queries SWHM-T-0050 composes — an index the planner ignores is an index that is not there.
5. Assert a row updated between two reads is visible to the second, which documents that no caching was introduced (design.md § Planning record, S9).
6. Add no index and change no schema: `db/schema.ts` belongs to SWHM-T-0046. If a query turns out not to use its index, report it rather than fixing it here — a schema edit from this ticket would collide with the ticket that owns the file.

## File/module ownership

- `catalog/performance.test.ts`

## Definition of Done

- AC-1 — bounded page read over the large fixture.
- AC-2 — search over the large fixture, including a five-keyword query.
- AC-3 — `EXPLAIN QUERY PLAN` on the category read.
- AC-4 — `EXPLAIN QUERY PLAN` on the product and item reads.
- AC-5 — the no-caching assertion.

## Design reference

_The idea carries no design blocks — `a2a_get_idea_design` returns an empty list, and the change's own § User Interface records that no screen records were extracted for this capability. Nothing was exported to `artifacts/SWHM-S-0004/design/`, and this ticket has no mockup to match._
