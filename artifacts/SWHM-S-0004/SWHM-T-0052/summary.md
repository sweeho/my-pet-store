---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0052
idea: SWHM-I-0004
branch: vortex/feat/SWHM-T-0052-product-retrieval-service-b882c98b
upstream:
  [artifacts/SWHM-S-0004/SWHM-T-0052/PLAN.md, artifacts/SWHM-S-0004/SWHM-T-0052/tdd-test-result.md]
downstream: []
---

# Summary — SWHM-T-0052: Product retrieval service

## What changed

Added `catalog/product.ts`: `getProduct(productId, locale)` joins `product` to
`product_details` on id and the requested locale via `localeJoin`, returning `null` when
either side is missing a row. `getProducts(categoryId, start, count, locale)` calls
`paginatedQuery` with a builder that filters on `product.catid` (the indexed column from
SWHM-T-0046), joins locale details, and orders by the localized name. Neither function
composes its own SQL beyond what `catalog/query.ts` already owns (design.md § Planning
record, S1/D5). The returned `Product` carries `categoryId` from `product.catid`, so a
caller can navigate back to the category without a second read.

## Files touched

- `catalog/product.ts` — new; `getProduct`, `getProducts`.
- `catalog/product.test.ts` — new; 7 cases, including a two-category fixture (`GC-CATS`,
  `GC-DOGS`) so the category-scoping assertion can fail if the `catid` filter is dropped.

## Acceptance criteria coverage

- AC-1 (product retrieved by ID, localized) — GP-01.
- AC-2 (products filtered by category, paginated, ordered by name) — GC-01, GC-03.
- AC-3 (never leaks a product from a neighbouring category) — GC-02, over the two-category
  fixture.
- AC-4 (exported signatures match `INTERFACES.md` § Retrieval services; reads compose
  through `catalog/query.ts`) — `paginatedQuery`/`localeJoin` are the only query primitives
  used; no ad hoc SQL.
- AC-5 (`categoryId` on the returned product) — GP-01.
- AC-6 (non-existent id → `null`; empty category → `EMPTY_PAGE`) — GP-02, GC-04.
- AC-7 (product exists, no detail row for the requested locale → `null`) — GP-03.

## Verification

- `bun --bun vitest run catalog/product.test.ts` — red (module missing) then green (7/7).
- `bun run verify` (lint + typecheck + full unit suite) — green: 34 files, 175 tests.
- `bun run verify:full`'s E2E tier did not run: this container has no Chromium installed
  (`ensure-playwright-browser.mjs` fails fast), the same condition already recorded in
  `AGENTS.md`'s "Notes from previous agents" for this sprint. Not retried; E2E runs in CI
  and at INTEGRATION_QA. This ticket adds no route, page, or E2E-relevant surface.

## Notes

`catalog/category.ts` (SWHM-T-0051) is not yet merged onto this branch; `product.ts` does
not depend on it — it composes reads directly through `catalog/query.ts`, `catalog/locale.ts`
types, and `db/schema.ts`, matching the PLAN.md steps.
