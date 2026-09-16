---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0120
branch: vortex/feat/SWHM-T-0120-revenue-reporting-by-category-7a244f97
upstream: [artifacts/SWHM-S-0012/SWHM-T-0120/PLAN.md]
downstream: [artifacts/SWHM-S-0012/qa-test-report.md]
---

# Summary — SWHM-T-0120: Revenue reporting by category

## What changed

Added `admin/reports.ts`: `parseReportDates` (parses `MM/dd/yyyy` component-wise into a half-open
`[start, endExclusive)` range) and `getRevenueReport(range, catid?)` (sums
`order_line_item.quantity * unit_price` — the price paid, never `item.listPrice` — grouped by
category with no `catid`, by item within one category otherwise; rounds once at the response
boundary from the unrounded per-group sums). Added `admin/types.ts`'s `DateRange`/`ReportRow`/
`Report` (SWHM-T-0121 reuses all three). Added `GET /api/admin/reports/revenue` behind
`requireAdmin`. Added the presentational, formatter-agnostic `ReportBars` component (props only, no
fetching, CSS bars — no charting dependency). Added `/admin/reports/revenue`: two date inputs
(native `<input type="date">`, converted to `MM/dd/yyyy` for the API) held as page state and applied
to every query, a pending state, an empty state, and the rendered report.

No mockup exists for this screen (`PLAN.md`'s Design reference says so explicitly) — built from
`AdminShell` and `DESIGN.md`'s existing Loading-states/Unavailable-content-states patterns, matching
`mockup-orders-view.html`'s currency formatting (`$1,240.00`).

## Files

- `admin/reports.ts`, `admin/reports.test.ts` — date parsing + revenue query.
- `admin/types.ts` — added `DateRange`, `ReportRow`, `Report` (additive, per file ownership).
- `routes/api/admin/reports/revenue.get.ts`, `revenue.get.test.ts` — the endpoint.
- `src/components/ReportBars.tsx`, `ReportBars.test.tsx` — the shared bar-chart primitive.
- `src/components/index.ts` — added `export * from "./ReportBars"`.
- `src/pages/admin/reports/revenue.tsx`, `revenue.test.tsx` — the screen.

## AC coverage

- AC-1 (XML with revenue by category/item + `TotalSales`) — replaced by the `Report` JSON shape per
  `PLAN.md`'s Definition of Done (S4); covered by `RR-04`, `RV-02`.
- AC-2 (category filter → data by Item) — `getRevenueReport`'s `catid` branch, covered by `RD-07`.
- AC-3 (no filter → data by Category, all categories) — the default branch, covered by `RD-06`.
- AC-4 (chart stores the date range, applies it to subsequent queries) — `revenue.tsx`'s
  `startDate`/`endDate` state feeding the fetch effect, covered by `RV-04`.
- AC-5 (filters to transactions within the range) — the half-open range and its SQL `gte`/`lt`,
  covered by `RD-01`, `RD-05`.

## Verification

```
$ bun --bun vitest run admin/reports.test.ts   # red, before reports.ts existed
Cannot find module './reports' — 1 failed, no tests

$ bun --bun vitest run routes/api/admin/reports/revenue.get.test.ts   # red, before the route existed
Cannot find module './revenue.get' — 1 failed, no tests

$ bun --bun vitest run src/components/ReportBars.test.tsx   # red, before ReportBars.tsx existed
Failed to resolve import "./ReportBars" — 1 failed, no tests

$ bun --bun vitest run src/pages/admin/reports/revenue.test.tsx   # red, before revenue.tsx existed
Failed to resolve import "./revenue" — 1 failed, no tests

$ bun run verify
lint: 0 errors
typecheck: 0 errors
test: 72 files passed, 415 passed, 0 failed
```

See `tdd-test-result.md` — `TDD-RESULT: 415 passed, 0 failed`.

`bun run test:e2e` (part of `verify:full`) fails at the Chromium preflight in this container, a
known gap for implementation containers (AGENTS.md § Notes from previous agents) — not retried; this
ticket added no e2e spec, none required by `PLAN.md`'s file ownership.

## Notes

`ReportBars`'s fill bar is purely decorative (its value is already conveyed as visible text via
`formatValue`), so it carries `aria-hidden="true"` and no accessible role; its rendered width is
asserted via `data-testid` in `ReportBars.test.tsx` — the one place in this ticket that departs from
locating by role, because no ARIA role fits a decorative width bar whose value is redundant with
adjacent text.

Lint's `react-hooks/set-state-in-effect` flagged an eager `setReport(null)` at the top of the
date-range effect (added so a stale report wouldn't display through a refetch); fixed by removing
it — the previous report now stays visible until the new one resolves, which no acceptance
criterion or test requires otherwise.

Used `DEFAULT_LOCALE` from `catalog/locale.ts` directly (a plain constant) rather than
`catalog/query.ts`'s `localeJoin` helper, which is that capability's own internal query
composition, not a shared cross-capability utility.
