---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0046
branch: vortex/feat/SWHM-T-0046-catalog-data-model-and-entities-586cdac1
upstream: [artifacts/SWHM-S-0004/SWHM-T-0046/PLAN.md]
---

# TDD result — SWHM-T-0046

## Test cases

| Test                             | Covers | Intent                                                                                                    |
| -------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| `catalog/schema.test.ts › SC-01` | AC-1   | a category round-trips id, name and description via `category`/`category_details`                         |
| `catalog/schema.test.ts › SC-02` | AC-2   | a product round-trips and its `catid` foreign key indicates the category relationship                     |
| `catalog/schema.test.ts › SC-03` | AC-3   | an item round-trips all 13 attributes (id, category linkage, both prices, image, five dynamic attributes) |

## Red run

`NODE_ENV=test bun --bun vitest run catalog/schema.test.ts` — before the migration for the six tables existed:

```
 FAIL  |server| catalog/schema.test.ts > catalog schema > SC-01: a category round-trips id, name and description
SQLiteError: no such table: category
 FAIL  |server| catalog/schema.test.ts > catalog schema > SC-02: a product round-trips and indicates its category relationship
SQLiteError: no such table: category
 FAIL  |server| catalog/schema.test.ts > catalog schema > SC-03: an item round-trips all 13 attributes
SQLiteError: no such table: category

 Test Files  1 failed (1)
      Tests  3 failed (3)
```

## Green run

`bun run verify` (this stack's full gate — `eslint` + `tsc --build` + `NODE_ENV=test bun --bun vitest run`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
 Test Files  28 passed (28)
      Tests  122 passed (122)
```

All 28 test files (including the 3 new `catalog/schema.test.ts` cases in the 1 new file) pass; zero new failures against baseline (27 files / 119 tests before this ticket).

TDD-RESULT: 122 passed, 0 failed
