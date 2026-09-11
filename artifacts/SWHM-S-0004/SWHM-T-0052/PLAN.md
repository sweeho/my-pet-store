---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0004
ticket: SWHM-T-0052
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
upstream: [artifacts/SWHM-S-0004/INTERFACES.md]
downstream: [artifacts/SWHM-S-0004/SWHM-T-0052/summary.md]
---

# Plan — SWHM-T-0052: Product retrieval service

## Objective

A product by id in a locale, and a page of the products inside one category ordered by localized name. The category scoping is the behaviour with its own scenario: a products page must never leak a product from a neighbouring category.

## Steps

1. Create `catalog/product.ts` exporting `getProduct` and `getProducts` with the signatures fixed in `artifacts/SWHM-S-0004/INTERFACES.md` § Retrieval services.
2. `getProduct` joins `product` to `product_details` on id and locale; a missing row on either side returns `null`.
3. Carry `product.catid` into the returned `Product` as `categoryId`, so a caller can navigate back to the category without a second read.
4. `getProducts(categoryId, …)` calls `paginatedQuery` with a builder that filters on `product.catid`, applies `localeJoin`, and orders by the localized product name. The filter is on the indexed column added by SWHM-T-0046.
5. Write `catalog/product.test.ts`. Seed at least two categories so the scoping assertion in AC-3 can fail if the filter is dropped — a single-category fixture would pass either way.

## File/module ownership

- `catalog/product.ts`
- `catalog/product.test.ts`

## Definition of Done

- AC-1 (`Retrieve single product by ID — Product is retrieved by ID`) — `catalog/product.test.ts`.
- AC-2 (`Retrieve all products in a category paginated — Products are filtered by category and paginated`) — same.
- AC-3 (`Retrieve all products in a category paginated — Products are scoped to correct category`) — same, over a two-category fixture.
- AC-4 — the signatures and the `catalog/query.ts` call sites.
- AC-5 — `categoryId` on the returned product.
- AC-6 — the null and `EMPTY_PAGE` cases.
- AC-7 — the missing-locale null.

## Design reference

_The idea carries no design blocks — `a2a_get_idea_design` returns an empty list, and the change's own § User Interface records that no screen records were extracted for this capability. Nothing was exported to `artifacts/SWHM-S-0004/design/`, and this ticket has no mockup to match._
