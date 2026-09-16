---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0122
branch: vortex/feat/SWHM-T-0122-orders-view-read-only-orders-table-6a2b7395
upstream: [artifacts/SWHM-S-0012/SWHM-T-0122/PLAN.md]
downstream: [artifacts/SWHM-S-0012/qa-test-report.md]
---

# Summary — SWHM-T-0122: Orders View, read-only orders table

## What changed

Added a shared `ui/table.tsx` primitive (`Table`, `TableHeader`, `TableBody`, `TableRow`,
`TableHead`, `TableCell` — real semantic elements, no variants file since the table has one
appearance) and `/admin/orders` at `src/pages/admin/orders.tsx`. The screen fetches
`GET /api/admin/orders?status=APPROVED&status=COMPLETED&status=DENIED` in one request, formats the
ISO date/number fields as `MM/DD/YYYY` / `$1,240.00`, and renders the five columns from
`mockup-orders-view.html` in a read-only table — no `<input>`, `<select>`, `<button>` or
`contenteditable` anywhere inside it. Created `e2e/admin.spec.ts` covering the administrator's
happy path (sign in → admin home → Launch Rich Client → orders table), structured for SWHM-T-0123
to extend with the denial paths.

Design reference: `mockup-orders-view.html` (columns, order, `$`/date formats, uppercase status,
"← Back to admin home", "Orders" heading, subtitle, count line) — matched directly; the status
badge's dot + text-color mapping (approved: black dot; completed: gray dot; denied: red dot + red
text) was read off the mockup's `.badge`/`.badge.approved`/`.badge.denied` CSS rules.

## Files

- `src/components/ui/table.tsx` — new table primitive.
- `src/components/ui/table.test.tsx` — new primitive tests.
- `src/components/ui/index.ts` — added `export * from "./table"`.
- `src/pages/admin/orders.tsx` — new `/admin/orders` screen.
- `src/pages/admin/orders.test.tsx` — new screen tests.
- `e2e/admin.spec.ts` — new, administrator happy-path spec.

## AC coverage

- AC-1 (orders shown with ID/User/Date/Amount/Status, read-only) — `orders.tsx`, covered by `OV-01`
  (status filter) and `OV-03` (columns).
- AC-2 (all five order columns) — `orders.tsx`'s `TableHead` row, covered by `OV-03`, `OV-04`.
- AC-3 (model returns false for every row/column — no browser model, so the observable
  replacement per `PLAN.md`'s Definition of Done is "no interactive control in the table", S6) —
  covered by `OV-07`.
- AC-4 (only APPROVED/COMPLETED/DENIED shown) — `SHOWN_STATUSES` in `orders.tsx`, covered by
  `OV-01`; `PENDING` stays server-side only (design.md S14).

## Verification

```
$ bun --bun vitest run src/components/ui/table.test.tsx   # red, before table.tsx existed
Failed to resolve import "./table" — 1 failed, no tests

$ bun --bun vitest run src/pages/admin/orders.test.tsx   # red, before orders.tsx existed
Failed to resolve import "./orders" — 1 failed, no tests

$ bun run verify
lint: 0 errors
typecheck: 0 errors
test: 66 files passed, 382 passed, 0 failed
```

See `tdd-test-result.md` — `TDD-RESULT: 382 passed, 0 failed`.

`bun run test:e2e` (part of `verify:full`) fails at the Chromium preflight in this container, a
known gap for implementation containers (AGENTS.md § Notes from previous agents) — not retried;
`e2e/admin.spec.ts` will run in CI and at INTEGRATION_QA.

## Notes

No changes outside this ticket's file ownership. `GET /api/admin/orders` and `AdminShell` were
consumed unchanged, as `PLAN.md`'s Fixed interface contracts require.
