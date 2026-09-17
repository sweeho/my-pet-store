---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0212
branch: vortex/feat/SWHM-T-0212-transactional-batch-applier-one-commit-m-b168c0c3
upstream: [artifacts/SWHM-S-0018/SWHM-T-0212/PLAN.md]
downstream: [artifacts/SWHM-S-0018/SWHM-T-0211, artifacts/SWHM-S-0018/SWHM-T-0210]
---

# Summary — SWHM-T-0212: Transactional batch applier — one commit moves every decision or none

## What changed

Added `applyOrderDecisions(decisions)` to `admin/order-status.ts`: it wraps a set of per-order
approve/deny decisions in one `db.transaction`, calls `order/decision.ts`'s `applyDecision` per entry,
and aggregates each `DecisionOutcome` into `{ applied, skipped, notFound }`. `updateOrderStatus` is
untouched — it is `admin-operations`'s function and this change carries no delta modifying it (S11 is
a separate improvement, not fixed here).

## Files

- `admin/order-status.ts` — added `OrderDecision`, `DecisionBatchResult`, and
  `applyOrderDecisions`, alongside the existing `updateOrderStatus`. No changes to that function or
  its exports.
- `admin/order-status.test.ts` — added a mixed-batch test (approve, deny, an already-terminal order,
  an unknown id), an all-skipped-batch test, a duplicate-order-id-in-one-batch test (D7), and an
  all-or-nothing rollback test forcing a failure partway through (D6, same `vi.spyOn(db, "update")`
  technique the existing `US-04` test already uses).

## AC coverage

- AC-1 (order status transitions to APPROVED) — `OD-01`, observed by reading the order row back after
  the batch commits.
- AC-2 (order status transitions to DENIED) — `OD-01`, same read-back.

## Verification

```
$ bun run verify        # lint + typecheck + full unit suite
Test Files  117 passed (117)
     Tests  771 passed (771)
```

`bun run verify:full` was attempted first; its browser tier fails at the documented preflight
(Chromium not installed in this container — `AGENTS.md § Notes from previous agents`), so `verify`
stands in per that note. E2E is not part of this ticket's scope (no UI change) and runs again in CI
and at INTEGRATION_QA.

See `tdd-test-result.md` — `TDD-RESULT: 771 passed, 0 failed`.

## Notes

No deviation from `PLAN.md`. The duplicate-order-id case (step 4) needed no branch — the existing
guard in `order/decision.ts` already reports the second occurrence in one batch as skipped once the
first has moved the order out of `PENDING`, so `OD-03` asserts the existing behaviour rather than
driving new code.
