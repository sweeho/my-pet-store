---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0051
branch: vortex/feat/SWHM-T-0051-category-retrieval-service-fed4d1ee
upstream: [artifacts/SWHM-S-0004/SWHM-T-0051/PLAN.md]
downstream: [artifacts/SWHM-S-0004/qa-test-report.md]
---

# Summary — SWHM-T-0051: Category retrieval service

## What changed

Added `catalog/category.ts` exporting `getCategory` and `getCategories`, mirroring the shape already established by `catalog/product.ts` (SWHM-T-0052): `category` inner-joined to `category_details`, locale-filtered via `catalog/query.ts`'s `localeJoin`, with `getCategories` paged through `paginatedQuery` and ordered by the localized name ascending.

## Files

- `catalog/category.ts` — `getCategory`, `getCategories`.
- `catalog/category.test.ts` — 8 tests, including the spec's literal "Dogs, Birds, Cats, Fish, Reptiles" ordering scenario and a 12-category fixture whose alphabetical order is deliberately reversed between two locales.

## AC coverage

- AC-1 (category retrieved with localized name/description) — `category.test.ts › CT-01`.
- AC-2 (non-existent id → null) — `› CT-02`.
- AC-3 (first page of 10 with `hasNext=true`, plus the final page) — `› CT-05`, `› CT-06`.
- AC-4 (ordered alphabetically, spec's literal example) — `› CT-04`.
- AC-5 (fixed signatures, composed through `catalog/query.ts`) — `category.ts` calls `localeJoin`/`paginatedQuery` rather than composing its own SQL.
- AC-6 (no detail row → null; no-detail-row locale → EMPTY_PAGE) — `› CT-03`, `› CT-08`.
- AC-7 (locale-dependent ordering) — `› CT-07`: the same 12 categories return `["PG-01".."PG-05"]` in one locale and the exact reverse-ordered set in another.

## Verification

```
$ bun run test -- catalog/category.test.ts   # red, before category.ts existed
Test Files  1 failed (1)
     Tests  no tests

$ bun run verify   # green, full gate
Test Files  36 passed (36)
     Tests  190 passed (190)
```

See `tdd-test-result.md` — `TDD-RESULT: 190 passed, 0 failed`.

`bun run test:e2e` / `bun run verify:full` were not run: this container's E2E preflight reports Chromium genuinely missing (documented in `AGENTS.md`'s Notes from previous agents). This ticket adds no route or page, so there is no new E2E surface; CI runs the full pipeline including E2E before the DONE transition.

## Notes

`getCategories` has no scoping parameter (unlike `getProducts`, scoped to a category, or `getItems`, scoped to a product) — it lists every category in the database. Because of that, `category.test.ts`'s scenarios use distinct, private locale strings as namespaces (`loc-a`, `loc-b`, `loc-c-en`/`loc-c-ja`) so each scenario's inner-join only ever matches its own fixture rows in the shared in-memory db, keeping every assertion an exact equality rather than a subset check.
