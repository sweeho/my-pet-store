---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0208
branch: vortex/feat/SWHM-T-0208-approval-screen-pending-orders-table-wit-2896eaac
upstream: [artifacts/SWHM-S-0018/SWHM-T-0208/PLAN.md]
downstream: [artifacts/SWHM-S-0018/SWHM-T-0209, artifacts/SWHM-S-0018/SWHM-T-0210]
---

# Summary — SWHM-T-0208: Approval screen — pending orders table with editable status

## What changed

Added `/admin/orders-approval` (`src/pages/admin/orders-approval.tsx`), a new screen listing every
`PENDING` order (fetched via the existing `GET /api/admin/orders?status=PENDING`) in a table with five
columns and a per-row editable status control. Added `src/components/ui/status-select.tsx`, a
Headless-UI-`Listbox`-based control offering PENDING/APPROVED/DENIED, built to the mockup's neutral
surface (colour is SWHM-T-0209's). Added a "Review Pending Orders" action to `/admin`. Consulted
`artifacts/SWHM-S-0018/design/mockup-orders-approval.html` directly for the table's five data columns,
the status control's structure (trigger + listbox, three dotted options) and its open-menu state.

## Files

- `src/pages/admin/orders-approval.tsx` — new. `OrdersApprovalContent` + `AdminOrdersApproval`
  (wrapped in `RequireAdmin`), mirroring `src/pages/admin/orders.tsx`'s session/data-fetch, loading and
  empty-state structure. No selection checkboxes and no Approve/Deny/Commit actions — those are
  SWHM-T-0210's (Objective, PLAN.md).
- `src/pages/admin/orders-approval.test.tsx` — new. 6 cases: request scope, loading state, column
  headers, a full row's five fields, the status control's three options reachable through the page,
  and the empty state.
- `src/components/ui/status-select.tsx` — new. `StatusSelect`, matching the ticket's fixed interface
  contract exactly.
- `src/components/ui/status-select.test.tsx` — new. 5 cases: accessible name, visible status text,
  the three options in order, `onChange` via a real pointer sequence, and `disabled`.
- `src/components/ui/index.ts` — exports `status-select`.
- `src/pages/admin/index.tsx` — added a "Review Pending Orders" button beside "Launch Rich Client",
  navigating to `/admin/orders-approval` (PLAN.md step 8 — the existing copy already promised this).
- `src/pages/admin/index.test.tsx` — extended the existing "both actions" assertion to three, added a
  navigation test for the new button.

`src/pages/admin/orders.tsx` was read for its patterns but not modified.

## AC coverage

- AC-1 (table displays all pending orders with ID, User ID, Order Date, Order Amount, Status) —
  `orders-approval.test.tsx › OA-03` (headers) and `OA-04` (a full row).
- AC-2 (status column is a dropdown with PENDING, APPROVED, DENIED) — `status-select.test.tsx › SS-03`
  (isolated component) and `orders-approval.test.tsx › OA-05` (through the page).

## Verification

```
$ bun run verify        # lint + typecheck + full unit suite
Test Files  120 passed (120)
     Tests  793 passed (793)
```

`bun run verify:full` was attempted first; its browser tier fails at the documented preflight
(Chromium not installed in this container — `AGENTS.md § Notes from previous agents`), so `verify`
stands in per that note. This screen's own Playwright coverage belongs to SWHM-T-0210 per the fixed
interface contract ("SWHM-T-0210's Playwright spec navigates to it"); the browser tier still runs in CI
and at INTEGRATION_QA. A real browser to click through the screen manually was not available in this
container either — Testing Library's role/accessible-name queries (not class names) are the
verification actually performed, including a real pointer sequence via `userEvent` to open the status
control and choose an option.

See `tdd-test-result.md` — `TDD-RESULT: 793 passed, 0 failed`.

## Notes

jsdom has no `ResizeObserver`, which Headless UI's `Listbox` uses internally to track its trigger's
position; a minimal stub was added inline in both new test files (not the shared `src/test/setup.ts`,
since no other component in this codebase uses `Listbox` yet) — a minor deviation from the ticket's
file-ownership list, recorded here rather than in `PLAN.md` since it carries no interface or
ownership-map change, only a test-environment necessity.
