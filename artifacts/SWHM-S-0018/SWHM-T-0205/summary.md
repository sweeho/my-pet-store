---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0205
branch: vortex/feat/SWHM-T-0205-status-validation-guard-only-pending-ord-bec03a8a
upstream: [artifacts/SWHM-S-0018/SWHM-T-0205/PLAN.md]
downstream: [artifacts/SWHM-S-0018/SWHM-T-0206]
---

# Summary — SWHM-T-0205: Status validation guard — only PENDING orders are decidable

## What changed

Added `order/status.ts`: the terminal-status vocabulary, the decidability predicate, and the status
read the decision path (SWHM-T-0206) will call. No new dependency, no logging (S8) — the guard is
observable only through its return value.

## Files

- `order/status.ts` — new. `TERMINAL_STATUSES` (`APPROVED`, `DENIED`, `COMPLETED`), `isDecidable(status)`,
  and `readOrderDecidability(orderId)`, mirroring `fulfillment/status.ts`'s shape for the same read on
  the same table. No transaction opened — the caller wraps it (D3).
- `order/status.test.ts` — new. Covers a PENDING order (decidable), one order in each terminal state
  (not decidable, current status carried back), and an unknown order id (`null`).

## AC coverage

- AC-1 (pending orders eligible) — `readOrderDecidability` returns `{ status: "PENDING", decidable: true }`,
  tested by `OS-03`.
- AC-2 (approved orders skipped) — `{ status: "APPROVED", decidable: false }`, tested by `OS-04`.
- AC-3 (denied orders skipped) — `{ status: "DENIED", decidable: false }`, tested by `OS-05`.
- AC-4 (completed orders skipped) — `{ status: "COMPLETED", decidable: false }`, tested by `OS-06`.

## Verification

```
$ bun run verify        # lint + typecheck + full unit suite
Test Files  114 passed (114)
     Tests  745 passed (745)
```

`bun run verify:full` was attempted first; its browser tier fails at the documented preflight
(Chromium not installed in this container — `AGENTS.md § Notes from previous agents`), so `verify`
stands in per that note. E2E is not part of this ticket's scope (no UI change) and runs again in CI
and at INTEGRATION_QA.

See `tdd-test-result.md` — `TDD-RESULT: 745 passed, 0 failed`.

## Notes

No deviation from `PLAN.md`. `order/approval-types.ts`'s `DecisionOutcome` already carries the
three-way shape (`applied` / `skipped` / `notFound`) this module's return values map onto — that
mapping is SWHM-T-0206's job, not this one's. `fulfillment/status.ts` was read but not touched,
per the plan's file ownership.
