---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0053
branch: vortex/feat/SWHM-T-0053-item-retrieval-service-42db991f
upstream: [artifacts/SWHM-S-0004/SWHM-T-0053/PLAN.md]
downstream: [artifacts/SWHM-S-0004/qa-test-report.md]
---

# Summary — SWHM-T-0053: Item retrieval service

## What changed

Added `catalog/item.ts` exporting `getItem` and `getItems`. Both compose one drizzle query — `item` inner-joined to `product` (for the category id and `productId`) and to `item_details`/`product_details` (locale-filtered via `catalog/query.ts`'s `localeJoin`, for the localized name/description/image/attributes and product name). `getItems` runs that query through `catalog/query.ts`'s `paginatedQuery`, ordered by the localized item name ascending.

## Files

- `catalog/item.ts` — `getItem`, `getItems`, the shared `ITEM_COLUMNS`/`itemQuery`/`toItem` helpers.
- `catalog/item.test.ts` — 7 tests over a fixture item with all 13 fields populated, a second product with 3 items for pagination/ordering, and a product with none.

## AC coverage

- AC-1 (all 13 attributes) — `item.test.ts › IT-01`, asserted field by field.
- AC-2 (paginated items in a product) — `› IT-05` (first page, `hasNext=true`), `› IT-06` (final page, `hasNext=false`).
- AC-3 (prices as numeric) — `› IT-02`.
- AC-4 (image location) — covered in `› IT-01`'s `imageLocation` assertion.
- AC-5 (5 dynamic attributes) — covered in `› IT-01`'s `attribute1`–`attribute5` assertions.
- AC-6 (fixed signatures, composed through `catalog/query.ts`) — `catalog/item.ts` calls `localeJoin` and `paginatedQuery` rather than composing its own pagination/locale logic.
- AC-7 (category id + localized product name via the product join, not a duplicated column) — `item.ts`'s `product`/`productDetails` inner joins; asserted in `› IT-01`.
- AC-8 (null/EMPTY_PAGE cases) — `› IT-03` (no such item), `› IT-04` (no locale row), `› IT-07` (no items in product).

## Verification

```
$ bun run test -- catalog/item.test.ts   # red, before item.ts existed
Test Files  1 failed (1)
     Tests  no tests

$ bun run verify   # green, full gate
Test Files  34 passed (34)
     Tests  175 passed (175)
```

See `tdd-test-result.md` — `TDD-RESULT: 175 passed, 0 failed`.

`bun run test:e2e` / `bun run verify:full` were not run: this container's E2E preflight reports Chromium genuinely missing (documented in `AGENTS.md`'s Notes from previous agents). This ticket adds no route or page, so there is no new E2E surface; CI runs the full pipeline including E2E before the DONE transition.

## Notes

The `Item` type (fixed in `catalog/types.ts`, owned by SWHM-T-0046) has no field for `item_details.name` — the item's own localized name. Only `productName` (from `product_details`) is exposed as the display name; `item_details.name` is written by the seed and used by search (SWHM-T-0054) but is not part of the 13 attributes this ticket's `Item` object returns. This is the type as fixed by `INTERFACES.md`, not a decision made here.
