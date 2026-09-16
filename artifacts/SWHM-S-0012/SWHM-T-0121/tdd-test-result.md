---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0121
branch: vortex/feat/SWHM-T-0121-order-count-reporting-by-category-4f01cad5
upstream: [artifacts/SWHM-S-0012/SWHM-T-0121/PLAN.md]
---

# TDD result — SWHM-T-0121

## Test cases

| Test                                                  | Covers     | Intent                                                                                        |
| ----------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `admin/reports.test.ts › OC-01`                       | AC-1       | a sale on the start date is counted, one on the end date is counted, one the day after is not |
| `admin/reports.test.ts › OC-02`                       | AC-1       | with no category filter, quantities group by category across all categories                   |
| `admin/reports.test.ts › OC-03`                       | AC-2       | with a category filter, quantities group by item within that category, not by category        |
| `admin/reports.test.ts › OC-04`                       | AC-1       | `totalSales` is the sum of the row quantities — an integer count, not money                   |
| `admin/reports.test.ts › OC-05`                       | AC-1       | an empty range returns no rows and a zero total                                               |
| `routes/api/admin/reports/orders.get.test.ts › RO-01` | AC-1       | no signed-on session → 401                                                                    |
| `routes/api/admin/reports/orders.get.test.ts › RO-02` | AC-1       | signed on without the administrator role → 403                                                |
| `routes/api/admin/reports/orders.get.test.ts › RO-03` | AC-1       | an unparseable date → 400                                                                     |
| `routes/api/admin/reports/orders.get.test.ts › RO-04` | AC-1       | a valid range → 200 `Report` grouped by `Category`                                            |
| `src/pages/admin/reports/orders.test.tsx › OT-01`     | AC-1       | pending state; heading and date inputs stay visible                                           |
| `src/pages/admin/reports/orders.test.tsx › OT-02`     | AC-1, AC-2 | renders rows and total once the fetch resolves, formatted as a count, not currency            |
| `src/pages/admin/reports/orders.test.tsx › OT-03`     | AC-1       | a named empty state when nothing is in range                                                  |
| `src/pages/admin/reports/orders.test.tsx › OT-04`     | AC-1       | changing a date re-queries with the new range                                                 |

Per design.md S4/S10, AC-1's extracted wording ("return XML with order quantities... and TotalSales
sum") is realized as the `Report` JSON `{ groupedBy, rows, totalSales }` — the same shape SWHM-T-0120
fixed, with `totalSales` here holding a summed quantity rather than money. AC-2's "quantities by Item
(not Category)" is the `groupedBy: "Item"` conditional when a `category` filter is given.

## Red run

`bun run test`, with `admin/reports.ts` reverted to SWHM-T-0120's landed version (`git stash`) and the
two new source files (`routes/api/admin/reports/orders.get.ts`, `src/pages/admin/reports/orders.tsx`)
moved aside, leaving only the three new/extended test files as the change:

```
FAIL |server| routes/api/admin/reports/orders.get.test.ts [ routes/api/admin/reports/orders.get.test.ts ]
Error: Cannot find module './orders.get' imported from routes/api/admin/reports/orders.get.test.ts

FAIL |client| src/pages/admin/reports/orders.test.tsx [ src/pages/admin/reports/orders.test.tsx ]
Error: Failed to resolve import "./orders" from src/pages/admin/reports/orders.test.tsx

FAIL |server| admin/reports.test.ts > admin/reports getOrderCountReport > OC-01 ... OC-05
TypeError: getOrderCountReport is not a function

Test Files  3 failed | 72 passed (75)
     Tests  5 failed | 418 passed (423)
```

Restored immediately after (`git stash pop` + moving the two files back).

While isolating this, an own-test bug surfaced and was fixed before the red run above was final: OC-01
and OC-04 originally reused the exact same date ranges as SWHM-T-0120's revenue boundary/rounding
tests (`admin/reports.test.ts` shares one in-memory db across all its tests), so `totalSales` picked up
the revenue tests' leftover rows too. Moved those two to date ranges no other test in the file uses;
`OC-02`/`OC-03` were already safe since they assert only specific rows, never the table-wide total.

## Green run

`bun run verify` (this stack's full pre-commit gate — lint, typecheck, complete unit/integration
suite). `bun run verify:full` was attempted first; its E2E tier fails fast in this container because
Chromium is genuinely not installed (`scripts/ensure-playwright-browser.mjs`), the documented
implementation-container limitation — falling back to `verify` per that note; this ticket does not own
`e2e/admin.spec.ts` and adds no E2E coverage.

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  75 passed (75)
      Tests  431 passed (431)
```

TDD-RESULT: 431 passed, 0 failed
