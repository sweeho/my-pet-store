---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0210
branch: vortex/feat/SWHM-T-0210-admin-operations-row-selection-bulk-appr-274a2b34
upstream: [artifacts/SWHM-S-0018/SWHM-T-0210/PLAN.md]
---

# Summary — SWHM-T-0210: Admin operations — row selection, bulk Approve/Deny, and Commit

## What changed

Closed the Orders Approval journey — the last ticket in the sprint. Added a selection checkbox per
row plus a select-all header checkbox to `src/pages/admin/orders-approval.tsx`; Approve/Deny buttons
that set every **selected** row's local status; a Commit button that POSTs `{ decisions: [...] }` to
the existing `POST /api/admin/orders/decisions` (SWHM-T-0211's — never `/status`, per S11) for every
row that is both selected and changed away from PENDING; a pending-action treatment for Commit
(disabled + "Committing…" + `role="status"`); and a `role="alert"` reporting the outcome, including a
skipped order, after which the pending list refetches from the server. Added
`e2e/order-approval.spec.ts` covering the whole administrator path.

## Files

- `src/pages/admin/orders-approval.tsx` — selection state (`selected: Record<number, boolean>`),
  `applyBulkStatus`, `handleCommit`, `describeCommitOutcome`, and the selection/actions JSX described
  above. `refreshPendingOrders` is a standalone function called only from `handleCommit`, never from an
  effect body directly (an eslint `react-hooks` rule flags a setState-triggering call inside an effect;
  the mount effect keeps its own inline fetch chain, matching the file's pre-existing shape).
- `src/pages/admin/orders-approval.test.tsx` — extended with `OA-07` through `OA-13` (7 new cases);
  updated `OA-03`'s expected header list for the new selection column (6 headers, the first is the
  select-all checkbox's cell, with no text).
- `e2e/order-approval.spec.ts` — new. Creates three PENDING orders directly via `POST /api/order`
  (skipping the checkout/payment UI, already covered by `e2e/order.spec.ts`), signs on as
  administrator, reaches the screen via the "Review Pending Orders" link, selects the three orders,
  Approves, Commits, confirms all three leave the pending view, then confirms all three read APPROVED
  on `/admin/orders`.

## AC coverage

- AC-1 (Approve sets selected rows to APPROVED) — `orders-approval.test.tsx › OA-08`.
- AC-2 (Deny sets selected rows to DENIED) — `orders-approval.test.tsx › OA-09`.
- AC-3 (Commit sends changes to the server) — `orders-approval.test.tsx › OA-10`.
- AC-4 (three orders bulk-approved) — `orders-approval.test.tsx › OA-10` (component) and
  `e2e/order-approval.spec.ts` (end-to-end, per PLAN.md's own Definition of Done — the browser tier
  runs in CI and at INTEGRATION_QA).

## Verification

```
$ bun run verify        # lint + typecheck + full unit suite
Test Files  120 passed (120)
     Tests  818 passed (818)
```

`bun run verify:full` was attempted first; its browser tier fails at the documented preflight
(Chromium not installed in this container — `AGENTS.md § Notes from previous agents`), so `verify`
stands in per that note; this also means `e2e/order-approval.spec.ts` itself could not be executed
here — `tsc --build` (part of `verify`, `e2e/` is in `tsconfig.node.json`'s `include`) confirms it
typechecks cleanly, and the browser tier runs it for real in CI and at INTEGRATION_QA.

See `tdd-test-result.md` — `TDD-RESULT: 818 passed, 0 failed`.

## Notes

`decisionsToCommit` is derived state (selected ∩ changed-away-from-PENDING), not stored separately —
Commit is disabled whenever it is empty, including immediately after a successful commit that reset
selection and status choices, which reads as "nothing left to send" rather than "still processing"
(a different disabled reason than the in-flight one `OA-12` also covers).
