---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0057
branch: vortex/feat/SWHM-T-0057-catalog-performance-verification-35a6f41d
upstream: [artifacts/SWHM-S-0004/SWHM-T-0057/PLAN.md]
---

# TDD result — SWHM-T-0057

This ticket changes no behaviour and adds no index — it is entirely a test file asserting
against already-shipped code (SWHM-T-0046/0050/0051/0052/0053/0054). "Red" here means an
assertion that failed against the real code as first written, not a missing implementation.

## Test cases

| Test                                  | Covers | Intent                                                                                       |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `catalog/performance.test.ts › PF-01` | AC-1   | a page read over 1,000 categories returns only the requested 25, not the catalog size        |
| `catalog/performance.test.ts › PF-02` | AC-1   | the compiled query's bound LIMIT is `count+1` (26), independent of the fixture's row count   |
| `catalog/performance.test.ts › PF-03` | AC-2   | a broad search over 2,000 items returns a bounded first page of 25 with correct `hasNext`    |
| `catalog/performance.test.ts › PF-04` | AC-2   | a five-keyword AND search returns exactly the one correct match, not a failure or a full set |
| `catalog/performance.test.ts › PF-05` | AC-3   | the paginated category read's plan uses `category_details_locale_idx`                        |
| `catalog/performance.test.ts › PF-06` | AC-4   | the paginated product read's plan uses `product_catid_idx`                                   |
| `catalog/performance.test.ts › PF-07` | AC-4   | the paginated item read's plan uses `item_productid_idx`                                     |
| `catalog/performance.test.ts › PF-08` | AC-5   | a category row updated between two reads is visible to the second `getCategory` call         |
| `catalog/performance.test.ts › PF-09` | AC-5   | a product row updated between two reads is visible to the second `getProduct` call           |
| `catalog/performance.test.ts › PF-10` | AC-5   | an item row updated between two reads is visible to the second `getItem` call                |
| `catalog/performance.test.ts › PF-11` | AC-5   | a product inserted after a first `getProducts`/`getItems` read appears in a second read      |

Fixture: 1,000 categories × 2 products × 1 item × 3 locales (`en_US`/`ja_JP`/`zh_CN`,
`account/vocabulary.ts`'s real `LANGUAGES`) = 2,000 products, 2,000 items (over the
1,000-item AC-2 floor), 3,000/6,000/6,000 detail rows.

## Red run

First run, against the real shipped code, with the fixture giving every category only ONE
locale (`en_US`) instead of the real vocabulary's three:

```
 ❯ |server| catalog/performance.test.ts (11 tests | 1 failed)
   × PF-05: the paginated category read uses the category_details locale index

AssertionError: expected false to be true
```

`EXPLAIN QUERY PLAN` showed `SCAN category_details` instead of the index — correctly:
with only one locale in the table, every row matches the locale filter, so the query
planner's cost-based choice to scan rather than seek the index is the objectively right
call for that data shape. The fixture, not the code, was wrong: a real catalog carries
detail rows in every supported locale, which is what makes the locale index selective
enough to be worth using. Fixed the fixture to give every category/product/item a detail
row in all three real locales (33% selectivity per locale) and reran.

## Green run

`bun run verify` (this stack's full gate — `eslint` + `tsc --build` + `NODE_ENV=test bun --bun vitest run`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
 Test Files  49 passed (49)
      Tests  243 passed (243)
```

All 49 test files (including the 11 new performance cases in 1 new file) pass in ~4s
total; the fixture build + 11 assertions run in well under a second. Zero new failures
against baseline (48 files / 232 tests before this ticket).

TDD-RESULT: 243 passed, 0 failed
