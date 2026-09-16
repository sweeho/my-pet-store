# SWHM-T-0120 — Revenue reporting by category

**Change:** `swhm-i-0006-administrative-operations-ma` · **Group:** `## 7. Revenue Reporting` (7.1–7.7)
**Requirements:** Generate revenue reports by category; Retrieve and display chart data with date range filtering

> Read `openspec/changes/swhm-i-0006-administrative-operations-ma/` first — the decisions document,
> then the delta spec. **D4, S10, S11 and S12 govern this ticket.**

## Objective

Answer "what sold, by money, over a date range" — grouped by category, or by item when one category is
named. This ticket owns the date-range parsing and the report row type SWHM-T-0121 reuses, so both are
fixed here. It is also the first money arithmetic in the repository.

## Design reference

- `artifacts/SWHM-S-0012/design/mockup-admin-home.html` — the two report lines name what these screens
  answer: "Report revenue by category over a date range."
- `artifacts/SWHM-S-0012/design/mockup-orders-view.html` — the `AdminShell` header and the back link
  this screen renders inside, and the currency formatting (`$1,240.00`) it matches.
- There is no mockup for the report screen itself. Build it from `AdminShell` plus the patterns in
  `DESIGN.md`; do not invent a new visual language for it.

## Steps

1. **`admin/reports.ts` — the shared date range first.** `parseReportDates(start, end)` accepts the
   `MM/dd/yyyy` format the scenario names, validates both, and returns a half-open range
   `[start, endExclusive)` where `endExclusive` is the day _after_ the end date. Half-open because an
   inclusive end date otherwise silently drops everything that happened on the last day — the classic
   off-by-one in a date filter, and the one the "filter to only include transactions within the range"
   scenario would not catch with a fixture that has nothing on the boundary. Give it one. Parse the
   components explicitly; do not hand `MM/dd/yyyy` to `new Date()`, whose behaviour on it is not
   specified.
2. **`getRevenueReport(range, catid?)`.** Sum `order_line_item.quantity * order_line_item.unit_price`
   — the price paid, never a join to `item.list_price`, which would restate history every time a price
   changed (D4). Join line items to `item` → `product` → `category` and filter on `orders.order_date`
   within the range. With no `catid`, group by category across all of them; with a `catid`, group by
   item within that one. That conditional is exactly what the two scenarios assert.
3. **Label rows with the default locale.** Category and item names live in per-locale `_details` rows,
   so a report has to pick one; use `DEFAULT_LOCALE` from `catalog/locale.ts` (S12). Key each row on the
   id (`catid` or `itemid`) and carry the name as a label — a report keyed on a name breaks the moment
   two locales disagree, and PRODUCT.md § Scope already says the administration screens are English.
4. **Round at the boundary, not per row.** Sum in SQL at full precision and round to two decimals once,
   when building the response. Rounding each row and then summing the rounded values makes the total
   disagree with its own rows. `TotalSales` is the sum of the unrounded row values, rounded once.
   This is the first money arithmetic here and does not settle SWHM-T-0058 (ARCHITECTURE.md § Data
   model) — keep it in one place so it is one thing to change later.
5. **`GET /api/admin/reports/revenue`** at `routes/api/admin/reports/revenue.get.ts`. `requireAdmin`
   first, return its error as-is. Read `start`, `end` and optional `category` from the query; 400 with
   `{ error }` on a missing or unparseable date, or on an end before its start. No XML (S4).
6. **`ReportBars`** in `src/components/ReportBars.tsx` — a presentational component taking rows and
   rendering each as a label, a value, and a bar whose width is that row's share of the largest value.
   Drawn in CSS from existing tokens; no charting dependency is added (S10). Props only, no fetching.
   It is behavioural, not a `ui/` primitive, so it goes in `src/components/` (DESIGN.md § Components).
   SWHM-T-0121 reuses it — keep it agnostic about whether its values are money or counts by taking a
   formatter.
7. **`/admin/reports/revenue`** at `src/pages/admin/reports/revenue.tsx`, wrapped in `RequireAdmin`,
   inside `AdminShell` with `backTo="/admin"`. Two date inputs defaulting to a sensible range, and the
   report beneath. The two chart scenarios are satisfied here: the screen holds the date range as state
   and applies it to each subsequent query. Render a `role="status"` pending element while a report is
   in flight, keeping the heading and the date controls visible — never an empty page
   (DESIGN.md § Loading states). An empty result is a named state, not a blank region: say that nothing
   sold in that range (DESIGN.md § Unavailable content states).
8. **Tests.** `admin/reports.test.ts`: the half-open boundary in both directions — a transaction exactly
   on the start date is included, one exactly on the end date is included, one the day after is not;
   grouping by category with no filter; grouping by item with one; the total equalling the sum of the
   unrounded rows; an empty range. `routes/api/admin/reports/revenue.get.test.ts`: the guard's 401 and
   403, 400 for a bad date, and the response shape. `src/components/ReportBars.test.tsx`: bar widths
   relative to the largest row, and the formatter applied. `src/pages/admin/reports/revenue.test.tsx`:
   the pending state, a rendered report, the empty state, and that changing a date re-queries.

## Fixed interface contracts

SWHM-T-0121 reuses all of these. Changing one is a plan revision, not an implementation choice.

```ts
// admin/types.ts additions
export type DateRange = { start: Date; endExclusive: Date };
export type ReportRow = {
  id: string;        // catid, or itemid when a category filter is applied
  label: string;     // DEFAULT_LOCALE name
  value: number;     // revenue (money) or quantity (count)
};
export type Report = {
  groupedBy: "Category" | "Item";
  rows: ReportRow[];
  totalSales: number;
};

// admin/reports.ts
export function parseReportDates(start: string, end: string): DateRange | AdminError;
export function getRevenueReport(range: DateRange, catid?: string): Report;

// src/components/ReportBars.tsx
export function ReportBars(props: {
  rows: ReportRow[];
  formatValue: (value: number) => string;
}): JSX.Element;
```

`GET /api/admin/reports/revenue?start=01/15/2023&end=01/31/2023&category=FISH` → `Report`, or
`{ error: string }` with 400/401/403.

## File/module ownership

Create or modify only: `admin/reports.ts`, `admin/reports.test.ts`,
`routes/api/admin/reports/revenue.get.ts`, `routes/api/admin/reports/revenue.get.test.ts`,
`src/components/ReportBars.tsx`, `src/components/ReportBars.test.tsx`, `src/components/index.ts`,
`src/pages/admin/reports/revenue.tsx`, `src/pages/admin/reports/revenue.test.tsx`.

Nothing else. `admin/types.ts` gains the types above and nothing more — it is SWHM-T-0117's file and
SWHM-T-0118 has already extended it; add, do not restructure.

## Definition of Done

AC-1 through AC-5 on the ticket. AC-1 and the order-count criteria assert an XML document; the
observable outcome that replaces it is the `Report` JSON above, carrying a row per category or item and
a `totalSales` sum (S4). AC-2 and AC-3 are the `groupedBy` conditional. AC-4 and AC-5 are the date
range held on the screen and applied to each query, with the filter proven at the boundary.

## Gotchas

- `new Date("01/15/2023")` is not specified for that format and is timezone-sensitive. Parse the
  components.
- An inclusive end date drops the last day. A fixture with nothing on the boundary will not notice.
- Rounding per row and then summing makes the total disagree with the rows above it.
- `item.list_price` is the current price. Revenue that joins to it changes retroactively (D4).
