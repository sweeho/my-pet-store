---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0121
branch: vortex/feat/SWHM-T-0121-order-count-reporting-by-category-4f01cad5
upstream: [artifacts/SWHM-S-0012/SWHM-T-0121/PLAN.md]
downstream: [artifacts/SWHM-S-0012/qa-test-report.md]
---

# Summary — SWHM-T-0121: Order count reporting by category

## What changed

Added `getOrderCountReport` to `admin/reports.ts` (same join, half-open date range, and
category-or-item conditional as SWHM-T-0120's `getRevenueReport`, summing `order_line_item.quantity`
instead of revenue, no rounding), `GET /api/admin/reports/orders` mirroring the revenue route exactly,
and `/admin/reports/orders` mirroring the revenue screen with an integer formatter in place of
currency. `parseReportDates`, `DateRange`, `Report`/`ReportRow` and `ReportBars` are all reused
unchanged.

## Files

- `admin/reports.ts` (extended) — `getOrderCountReport(range, catid?)` and a `buildCountReport` helper (no `round2`, since quantities are integers and `totalSales` here is a count).
- `admin/reports.test.ts` (extended) — 5 new cases under a new `describe`; the existing revenue `describe` is untouched.
- `routes/api/admin/reports/orders.get.ts` (+ `.test.ts`) — `requireAdmin` first, same query params and 400 conditions as the revenue route.
- `src/pages/admin/reports/orders.tsx` (+ `.test.tsx`) — `RequireAdmin` + `AdminShell(backTo="/admin")`, two date inputs, `ReportBars` with an integer formatter, the same pending/empty states as the revenue screen.

## AC coverage

- AC-1 (order quantities by category/item and a `TotalSales` sum) — per design.md S4, the `Report` JSON (`{ groupedBy, rows, totalSales }`) carries a summed `quantity` per row. Covered by `admin/reports.test.ts` OC-01/02/04/05 and the route/page tests.
- AC-2 (quantities by Item, not Category, when filtered) — the `groupedBy: "Item"` conditional. Covered by `admin/reports.test.ts` OC-03.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  75 passed (75)
      Tests  431 passed (431)
```

`bun run verify:full`'s E2E tier fails fast in this container (Chromium genuinely not installed,
`scripts/ensure-playwright-browser.mjs`) — the documented implementation-container limitation. This
ticket does not own `e2e/admin.spec.ts` and adds no E2E coverage, so nothing was skipped by falling
back to `verify`. See `tdd-test-result.md` — `TDD-RESULT: 431 passed, 0 failed`.

## Notes

- `getOrderCountReport`'s row/total values are not passed through `round2` — SWHM-T-0120's rounding
  exists for money; a summed integer quantity needs none, and rounding it would imply a precision this
  measure doesn't have (PLAN.md Gotchas).
- Found and fixed an own-test bug before finalizing: two new test cases first reused the exact date
  ranges SWHM-T-0120's revenue tests already used in the same file (which shares one in-memory db
  across all its tests), so `totalSales` picked up the revenue tests' leftover rows. Moved those two
  cases to date ranges no other test in the file touches. No production code was affected.
