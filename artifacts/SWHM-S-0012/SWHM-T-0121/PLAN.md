# SWHM-T-0121 — Order count reporting by category

**Change:** `swhm-i-0006-administrative-operations-ma` · **Group:** `## 8. Order Count Reporting` (8.1–8.4)
**Requirement:** Generate order count reports by category

> Read `openspec/changes/swhm-i-0006-administrative-operations-ma/` first — the decisions document,
> then the delta spec. **S10 and S12 govern this ticket**, and SWHM-T-0120's plan is required reading:
> this ticket extends its module rather than writing a second one.

## Objective

The same report as SWHM-T-0120, counted by quantity instead of money. After this ticket
`GET /api/admin/reports/orders` answers and `/admin/reports/orders` renders it.

## Design reference

- `artifacts/SWHM-S-0012/design/mockup-admin-home.html` — "Report order counts by category over a date
  range."
- `src/pages/admin/reports/revenue.tsx` as SWHM-T-0120 left it is the pattern this screen mirrors.
  There is no separate mockup; the two report screens are the same screen with a different measure.

## Steps

1. **Reuse, do not re-derive.** `parseReportDates`, `DateRange`, `ReportRow`, `Report` and
   `ReportBars` are fixed by SWHM-T-0120. A second date parser is the defect this ticket's sequencing
   exists to prevent — the two would disagree on the boundary and only one of them would have the test
   that catches it.
2. **`getOrderCountReport(range, catid?)`** in `admin/reports.ts`, beside the revenue function. It sums
   `order_line_item.quantity` over the same join and the same half-open range, with the same
   category-or-item conditional and the same `DEFAULT_LOCALE` labelling (S12). No rounding: quantities
   are integers, and `totalSales` here is a count, not money — the field name comes from the extracted
   scenario, which uses `TotalSales` for both measures.
3. **`GET /api/admin/reports/orders`** at `routes/api/admin/reports/orders.get.ts`, mirroring the
   revenue route exactly: `requireAdmin` first, the same query parameters, the same 400 conditions, the
   same error shape. If it needs to differ from the revenue route in any way other than which function
   it calls, one of the two is wrong.
4. **`/admin/reports/orders`** at `src/pages/admin/reports/orders.tsx`, mirroring the revenue screen:
   `RequireAdmin`, `AdminShell` with `backTo="/admin"`, two date inputs, `ReportBars` with an integer
   formatter instead of a currency one, the same pending state and the same named empty state.
5. **Tests.** `admin/reports.test.ts` gains: counting by category with no filter, by item with one, the
   total equalling the sum of the rows, and the same boundary cases — a transaction on the start date
   counted, one on the end date counted, one the day after not. Do not edit the revenue tests already
   there. `routes/api/admin/reports/orders.get.test.ts` and
   `src/pages/admin/reports/orders.test.tsx` mirror their revenue counterparts.

## Fixed interface contracts

Consumes SWHM-T-0120's contracts unchanged. Adds one:

```ts
// admin/reports.ts
export function getOrderCountReport(range: DateRange, catid?: string): Report;
```

`GET /api/admin/reports/orders?start=01/15/2023&end=01/31/2023&category=FISH` → `Report`, or
`{ error: string }` with 400/401/403.

## File/module ownership

Create or modify only: `admin/reports.ts` and `admin/reports.test.ts` (extend — do not restructure
what SWHM-T-0120 fixed), `routes/api/admin/reports/orders.get.ts`,
`routes/api/admin/reports/orders.get.test.ts`, `src/pages/admin/reports/orders.tsx`,
`src/pages/admin/reports/orders.test.tsx`.

Nothing else. `src/components/ReportBars.tsx` is SWHM-T-0120's and is already landed — render it, do
not edit it. If it cannot express a count without a change, that is a plan revision: escalate.

## Definition of Done

AC-1 and AC-2 on the ticket. AC-1 asserts an XML document with quantities by category or item and a
`TotalSales` sum; the observable outcome that replaces it is the `Report` JSON carrying those (S4).
AC-2 is the `groupedBy: "Item"` conditional when a category is named.

## Gotchas

- `totalSales` holds a count here, not money. The name is the scenario's; do not rename it and do not
  format it as currency.
- Summing `quantity` is not the same as counting rows: one line item for five units is five, not one.
  The scenario says "order quantities".
- Extending `admin/reports.test.ts` means adding cases. A restructure of that file collides with what
  SWHM-T-0120 already proved.
