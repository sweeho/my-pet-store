---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0055
branch: vortex/feat/SWHM-T-0055-catalog-facade-and-public-http-surface-7fed9d7f
upstream: [artifacts/SWHM-S-0004/SWHM-T-0055/PLAN.md]
---

# TDD result — SWHM-T-0055

## Test cases

| Test                                                             | Covers     | Intent                                                                |
| ---------------------------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| `routes/api/catalog/categories/index.get.test.ts › CI-01`        | AC-2, AC-3 | omitting start/count/locale returns the default first page in en_US   |
| `routes/api/catalog/categories/index.get.test.ts › CI-02`        | AC-6       | a count outside 1-100 answers 400 with a plain error body             |
| `routes/api/catalog/categories/[categoryId].get.test.ts › CD-01` | AC-2, AC-3 | returns the category in the default locale                            |
| `routes/api/catalog/categories/[categoryId].get.test.ts › CD-02` | AC-4       | a category that does not exist answers 404, never a 200 carrying null |
| `routes/api/catalog/products/index.get.test.ts › PI-01`          | AC-2, AC-3 | returns the products for the given category in the default locale     |
| `routes/api/catalog/products/index.get.test.ts › PI-02`          | AC-5       | a missing categoryId answers 400 with a plain error body              |
| `routes/api/catalog/products/[productId].get.test.ts › PD-01`    | AC-2, AC-3 | returns the product in the default locale                             |
| `routes/api/catalog/products/[productId].get.test.ts › PD-02`    | AC-4       | a product that does not exist answers 404, never a 200 carrying null  |
| `routes/api/catalog/items/index.get.test.ts › II-01`             | AC-2, AC-3 | returns the items for the given product in the default locale         |
| `routes/api/catalog/items/index.get.test.ts › II-02`             | AC-5       | a missing productId answers 400 with a plain error body               |
| `routes/api/catalog/items/[itemId].get.test.ts › ID-01`          | AC-2, AC-3 | returns the item with all 13 attributes in the default locale         |
| `routes/api/catalog/items/[itemId].get.test.ts › ID-02`          | AC-4       | an item that does not exist answers 404, never a 200 carrying null    |
| `routes/api/catalog/search.get.test.ts › SR-01`                  | AC-2, AC-3 | matches items across name, product name, category id and description  |
| `routes/api/catalog/search.get.test.ts › SR-02`                  | AC-5       | a missing q answers 400 with a plain error body                       |

Every success case above sends no sign-on cookie (AC-7); every route is exercised through
its default-exported handler directly, mirroring `routes/api/customer/index.get.test.ts`.

## Red run

`catalog/catalog.ts` moved aside, then `NODE_ENV=test bun --bun vitest run routes/api/catalog` — every route imports the facade, so all seven test files fail to even load:

```
 FAIL  |server| routes/api/catalog/search.get.test.ts [ routes/api/catalog/search.get.test.ts ]
Error: Cannot find module '../../../catalog/catalog' imported from /workspace/repo/routes/api/catalog/search.get.ts
 FAIL  |server| routes/api/catalog/items/index.get.test.ts [ ... ]
 FAIL  |server| routes/api/catalog/items/[itemId].get.test.ts [ ... ]
 FAIL  |server| routes/api/catalog/products/index.get.test.ts [ ... ]
 FAIL  |server| routes/api/catalog/products/[productId].get.test.ts [ ... ]
 FAIL  |server| routes/api/catalog/categories/index.get.test.ts [ ... ]
 FAIL  |server| routes/api/catalog/categories/[categoryId].get.test.ts [ ... ]

 Test Files  7 failed (7)
      Tests  no tests
```

## Green run

`bun run verify` (this stack's full gate — `eslint` + `tsc --build` + `NODE_ENV=test bun --bun vitest run`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
 Test Files  44 passed (44)
      Tests  222 passed (222)
```

All 44 test files (including the 14 new route-test cases across 7 new files) pass; zero new
failures against baseline (37 files / 208 tests before this ticket).

TDD-RESULT: 222 passed, 0 failed
