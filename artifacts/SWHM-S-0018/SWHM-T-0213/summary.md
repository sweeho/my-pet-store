---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0213
branch: vortex/feat/SWHM-T-0213-customer-notifications-queued-on-approva-0515569d
upstream: [artifacts/SWHM-S-0018/SWHM-T-0213/PLAN.md]
downstream: [artifacts/SWHM-S-0018/qa-test-report.md]
---

# Summary — SWHM-T-0213: Customer notifications queued on approval and denial

## What changed

Added a `notifications` table and `order/notification.ts`'s `queueNotification(orderId, kind,
queuedAt?)` — a row recording that the customer is owed word of a decision, nothing more (no mail,
no transport, no retry path, per S9). Wired it into `order/decision.ts`'s `applyDecision`: both
outcomes queue a notification (never a skip or a missing order), with the approval path queuing
after `createSupplierPo` inside the same transaction.

## Files

- `db/schema.ts` — added `notifications` (autoincrement `id`, `order_id` FK, `kind`,
  `recipient_email`, `queued_at`); `order_id` is not the primary key, unlike `supplier_po`, since an
  order can be owed more than one notification over its life.
- `drizzle/0012_slow_cable.sql` + `drizzle/meta/*` — generated migration (`bun run db:generate`).
- `order/notification.ts` — new. `queueNotification`, copying `recipient_email` from the order's
  `billing_email` at queue time (nullable, carried through as-is).
- `order/notification.test.ts` — new. 4 cases: an APPROVAL row, a DENIAL row, the null-email case,
  and the default `queuedAt`.
- `order/decision.ts` — `applyDecision` now calls `queueNotification` after the status write (and
  after `createSupplierPo` on an approval), translating `ApprovalDecision` (`APPROVED`/`DENIED`) to
  `NotificationKind` (`APPROVAL`/`DENIAL`) via a small lookup — the two are deliberately different
  vocabularies in `order/approval-types.ts`.
- `order/decision.test.ts` — added 4 cases: an approval queues exactly one `APPROVAL` row, a denial
  exactly one `DENIAL` row, a skipped terminal order queues none, and deciding the same order twice
  queues exactly one (D7).

## AC coverage

- AC-1 (notification queued on approval) — `order/notification.ts` wired into `order/decision.ts`,
  tested by `notification.test.ts › AC-1` and `decision.test.ts › DA-11`.
- AC-2 (notification queued on denial) — tested by `notification.test.ts › AC-2` and
  `decision.test.ts › DA-12`.

## Verification

```
$ bun run verify        # lint + typecheck + full unit suite
Test Files  117 passed (117)
     Tests  767 passed (767)
```

`bun run verify:full` was attempted first; its E2E tier fails at the documented Chromium-missing
preflight in this container (`AGENTS.md § Notes from previous agents`) — not retried per that note,
and out of scope anyway (no UI change). E2E runs again in CI and at INTEGRATION_QA.

See `tdd-test-result.md` — `TDD-RESULT: 767 passed, 0 failed`.
