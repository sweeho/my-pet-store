---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0120
branch: vortex/feat/SWHM-T-0120-revenue-reporting-by-category-7a244f97
upstream: [artifacts/SWHM-S-0012/SWHM-T-0120/PLAN.md]
---

# TDD result — SWHM-T-0120

## Test cases

| Test                                                   | Covers                         | Intent                                                                                                |
| ------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `admin/reports.test.ts › RD-01`                        | AC-4                           | `parseReportDates` parses `MM/dd/yyyy` into a half-open range, `endExclusive` the day after `end`     |
| `admin/reports.test.ts › RD-02`                        | — (input validation)           | rejects a start date not in `MM/dd/yyyy`                                                              |
| `admin/reports.test.ts › RD-03`                        | — (input validation)           | rejects an unparseable calendar date (month 13)                                                       |
| `admin/reports.test.ts › RD-04`                        | — (input validation)           | rejects an end date before the start date                                                             |
| `admin/reports.test.ts › RD-05`                        | AC-5                           | a sale on the start date is included, one on the end date is included, one the day after is excluded  |
| `admin/reports.test.ts › RD-06`                        | AC-3                           | with no category filter, groups by category across all categories                                     |
| `admin/reports.test.ts › RD-07`                        | AC-2                           | with a category filter, groups by item within that category, not by category                          |
| `admin/reports.test.ts › RD-08`                        | — (PLAN.md step 4 / Gotchas)   | `totalSales` is the sum of unrounded row values rounded once, not the sum of the rounded display rows |
| `admin/reports.test.ts › RD-09`                        | —                              | an empty range returns no rows and a zero total                                                       |
| `routes/api/admin/reports/revenue.get.test.ts › RR-01` | — (guard)                      | no session → 401                                                                                      |
| `routes/api/admin/reports/revenue.get.test.ts › RR-02` | — (guard)                      | signed-on without the role → 403                                                                      |
| `routes/api/admin/reports/revenue.get.test.ts › RR-03` | — (input validation)           | an unparseable date → 400                                                                             |
| `routes/api/admin/reports/revenue.get.test.ts › RR-04` | AC-1, AC-3                     | a valid range returns a `Report` grouped by `"Category"`                                              |
| `src/components/ReportBars.test.tsx › RB-01`           | — (contract)                   | renders each row's label and its value through the supplied formatter                                 |
| `src/components/ReportBars.test.tsx › RB-02`           | — (contract)                   | each bar's width is that row's share of the largest value                                             |
| `src/components/ReportBars.test.tsx › RB-03`           | — (contract)                   | no rows renders an empty container without throwing                                                   |
| `src/pages/admin/reports/revenue.test.tsx › RV-01`     | — (Loading states)             | a pending indicator shows while the report is in flight, heading and date inputs still visible        |
| `src/pages/admin/reports/revenue.test.tsx › RV-02`     | AC-1, AC-3                     | renders the report's rows and total once resolved                                                     |
| `src/pages/admin/reports/revenue.test.tsx › RV-03`     | — (Unavailable content states) | a named empty state when no sales are in range                                                        |
| `src/pages/admin/reports/revenue.test.tsx › RV-04`     | AC-4, AC-5                     | changing a date re-queries the report with the new range                                              |

AC-1 ("return XML with revenue amounts by category/item and TotalSales sum") is replaced by the
`Report` JSON shape per `PLAN.md`'s Definition of Done (S4) — covered by `RR-04`/`RV-02`. AC-2/AC-3
are the `groupedBy` conditional — `RD-06`/`RD-07`. AC-4/AC-5 are the date range held on the screen
and applied to each query, proven at the boundary — `RD-01`/`RD-05`/`RV-04`.

## Red run

`bun --bun vitest run admin/reports.test.ts` before `reports.ts` existed:

```
FAIL |server| admin/reports.test.ts [ admin/reports.test.ts ]
Error: Cannot find module './reports' imported from admin/reports.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

`bun --bun vitest run routes/api/admin/reports/revenue.get.test.ts` before `revenue.get.ts` existed:

```
FAIL |server| routes/api/admin/reports/revenue.get.test.ts
Error: Cannot find module './revenue.get'
Test Files  1 failed (1)
     Tests  no tests
```

`bun --bun vitest run src/components/ReportBars.test.tsx` before `ReportBars.tsx` existed:

```
FAIL |client| src/components/ReportBars.test.tsx
Error: Failed to resolve import "./ReportBars"
Test Files  1 failed (1)
     Tests  no tests
```

`bun --bun vitest run src/pages/admin/reports/revenue.test.tsx` before `revenue.tsx` existed:

```
FAIL |client| src/pages/admin/reports/revenue.test.tsx
Error: Failed to resolve import "./revenue"
Test Files  1 failed (1)
     Tests  no tests
```

## Green run

`bun run verify` (lint + typecheck + full unit suite — the project's declared `verify` gate):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(no errors — one interim finding, a react-hooks/set-state-in-effect violation from an eager
`setReport(null)` in revenue.tsx, fixed by removing the synchronous reset; see summary.md § Notes)
$ tsc --build
(no errors)
$ NODE_ENV=test bun --bun vitest run
 Test Files  72 passed (72)
      Tests  415 passed (415)
```

`bun run test:e2e` (part of `verify:full`) fails only at the Chromium preflight —
`scripts/ensure-playwright-browser.mjs` reports Chromium is genuinely not installed in this
implementation container (AGENTS.md § Notes from previous agents: known gap). Not retried; this
ticket added no `e2e/*.spec.ts` (none required by `PLAN.md`'s file ownership).

TDD-RESULT: 415 passed, 0 failed
