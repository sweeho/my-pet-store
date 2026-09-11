---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0004
ticket: SWHM-T-0053
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
upstream: [artifacts/SWHM-S-0004/INTERFACES.md]
downstream: [artifacts/SWHM-S-0004/SWHM-T-0053/summary.md]
---

# Plan — SWHM-T-0053: Item retrieval service

## Objective

The item read, which is the widest in the capability: all 13 attributes the spec enumerates, assembled across `item`, `item_details` and the product join, plus a page of the items inside one product.

## Steps

1. Create `catalog/item.ts` exporting `getItem` and `getItems` with the signatures fixed in `artifacts/SWHM-S-0004/INTERFACES.md` § Retrieval services.
2. Build the `Item` from three sources: `item` for the id and the two prices, `item_details` for the localized name, description, image and the five attributes, and the product join for `productId`, the localized `productName` and the `category` id. Resolve the category through the product rather than duplicating a column on `item` — see `openspec/changes/swhm-i-0004-product-catalog-search/design.md` § Planning record, D2.
3. Return the prices as numbers, not strings. They are stored as `real`; a driver that hands back a string would satisfy a loose assertion and break arithmetic later.
4. `getItems(productId, …)` calls `paginatedQuery` filtering on the indexed `item.productid`, ordered by the localized item name — the spec leaves this order unspecified and an unordered page is not stable across requests (design.md § Planning record, S10).
5. Write `catalog/item.test.ts` asserting all 13 fields explicitly by name on one fully-populated fixture item, plus the null and `EMPTY_PAGE` cases.

## File/module ownership

- `catalog/item.ts`
- `catalog/item.test.ts`

## Definition of Done

- AC-1 (`Retrieve single item by ID — Item is retrieved with all attributes`) — `catalog/item.test.ts`, field by field.
- AC-2 (`Retrieve all items in a product paginated — Items are filtered by product and paginated`) — same.
- AC-3 (`Item pricing information — Item prices are retrieved`) — same, asserting numeric type.
- AC-4 (`Item image association — Item image location is retrieved`) — same.
- AC-5 (`Item dynamic attributes — All item attributes are retrieved`) — same, all five.
- AC-6 — the signatures and the `catalog/query.ts` call sites.
- AC-7 — category and product name resolved through the join.
- AC-8 — the null and `EMPTY_PAGE` cases.

## Design reference

_The idea carries no design blocks — `a2a_get_idea_design` returns an empty list, and the change's own § User Interface records that no screen records were extracted for this capability. Nothing was exported to `artifacts/SWHM-S-0004/design/`, and this ticket has no mockup to match._
