---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0206
branch: vortex/feat/SWHM-T-0206-order-approval-and-denial-workflow-the-s-1f9a048c
upstream: [artifacts/SWHM-S-0018/SWHM-T-0206/PLAN.md]
downstream: [artifacts/SWHM-S-0018/qa-test-report.md]
---

# Summary — SWHM-T-0206: Order approval and denial workflow — the single-order applier

## What changed

Added `order/decision.ts`'s `applyDecision(orderId, decision)` — the single-order approval/denial
seam. It reads decidability via `order/status.ts`'s `readOrderDecidability` (from SWHM-T-0205),
returns `notFound` for a missing order, `skipped` for a terminal one, and otherwise writes the new
status and returns `applied`. It opens no transaction of its own, mirroring `fulfillment/status.ts`'s
shape for the same job on the same table.

## Files

- `order/decision.ts` — new. `applyDecision`, with a marked extension point after the status write
  for SWHM-T-0207 (supplier PO) and SWHM-T-0213 (notification) to hang off later.
- `order/decision.test.ts` — new. 8 cases: both decisions applied from PENDING, the row read back
  independently after each, each terminal status (`APPROVED`, `DENIED`, `COMPLETED`) skipped with
  status unchanged, and the unknown-id case.

No existing file was modified — `admin/order-status.ts`'s `updateOrderStatus` is untouched, per
PLAN.md step 5.

## AC coverage

- AC-1 (order status transitions to APPROVED) — `order/decision.ts`'s `applyDecision`, tested by
  `decision.test.ts › AC-1 / DA-01` and `› DA-02` (row read back).
- AC-2 (order status transitions to DENIED) — tested by `decision.test.ts › AC-2 / DA-03` and
  `› DA-04` (row read back).

## Verification

```
$ bun run verify        # lint + typecheck + full unit suite
Test Files  115 passed (115)
     Tests  753 passed (753)
```

`bun run verify:full` was attempted first; its E2E tier fails at the documented Chromium-missing
preflight in this container (`AGENTS.md § Notes from previous agents`) — not retried per that note,
and out of scope anyway (no UI change). E2E runs again in CI and at INTEGRATION_QA.

See `tdd-test-result.md` — `TDD-RESULT: 753 passed, 0 failed`.
