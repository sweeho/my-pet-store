---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0020
ticket: SWHM-T-0224
branch: vortex/feat/SWHM-T-0224-notification-service-queue-entry-point-c-6de5b6db
upstream: [artifacts/SWHM-S-0020/SWHM-T-0224/PLAN.md]
downstream: [artifacts/SWHM-S-0020/qa-test-report.md]
---

# Summary — SWHM-T-0224: Notification service — queue entry point, completion trigger and recipient lookup

## What changed

Gave notifications a `notifications/` capability directory with one queueing entry point
(`notify()`), added the `COMPLETION` kind with a trigger on `fulfillment/status.ts`'s completion
point, added `resolveRecipient()` reading a customer's contact details from their account, and
extended the `notifications` table with delivery-state columns. `order/notification.ts`
(`queueNotification`) is removed; `order/decision.ts` now calls `notify()` for both approval and
denial outcomes. Nothing is sent — this ticket is the queue side only.

## Files

- `notifications/types.ts` — `NotificationKind` (+`COMPLETION`), `NotificationStatus`, `NotificationRecipient`.
- `notifications/notify.ts` — `notify(orderId, kind, queuedAt?)`, the sole queueing entry point.
- `notifications/notify.test.ts` — red→green coverage for all three kinds, null email, default `queuedAt`.
- `notifications/recipient.ts` — `resolveRecipient(orderId)`, reads the order's `user_name` then `account/customer.ts`'s `findAccount()`.
- `notifications/recipient.test.ts` — populated/empty account, no-account and unknown-order cases.
- `db/schema.ts` — `notifications` gains `status` (default `QUEUED`), `sentAt`, `failureReason`.
- `drizzle/0013_curly_the_santerians.sql` (+ `meta/`) — generated migration for those columns.
- `vitest.config.ts` — `notifications/**` added to the `server` project's include and the `client` project's exclude.
- `tsconfig.node.json` — `notifications` added to `include` (needed for `tsc --build` to resolve the new directory as a project file; not called out in PLAN.md's step list, but the same directory-registration obligation F10 states for Vitest).
- `order/approval-types.ts` — `NotificationKind` is now re-exported from `notifications/types.ts` instead of redeclared.
- `order/decision.ts` (+ test) — calls `notify()` instead of the removed `queueNotification()`; no test changes were needed, the existing DA-11..DA-14 cases already cover the queueing behaviour and pass unchanged against the re-pointed call.
- `fulfillment/status.ts` (+ test) — `markOrderCompleted()` calls `notify(orderId, "COMPLETION")` only on the branch that actually transitions the order.
- `order/notification.ts`, `order/notification.test.ts` — removed, superseded by `notifications/notify.ts`.

## AC coverage

- AC-1 (customer email retrieval from account ContactInfo) — `notifications/recipient.ts` reads `contactInfo.email` via `findAccount()`, never a second `contact_info` query; covered by `recipient.test.ts` RC-01/RC-02.
- AC-2 (approval/denial/completion each leave exactly one queued row) — `order/decision.ts` (existing DA-11/DA-12) and `fulfillment/status.ts` ST-10.
- AC-3 (partial fulfilment leaves no COMPLETION row; a re-decision adds no second row) — `status.test.ts` ST-11/ST-12 and `decision.test.ts` DA-13/DA-14 (unchanged, still passing against the re-pointed call).
- AC-4 (`resolveRecipient` field-by-field, nulls where empty) — `recipient.test.ts` RC-01..RC-04.
- AC-5 (delivery-state columns + committed migration) — `db/schema.ts`, `drizzle/0013_curly_the_santerians.sql`.
- AC-6 (notifications/ tests run in the node/server Vitest project) — `vitest.config.ts`; confirmed by the red run, where the pre-registration state ran these tests in `client`/jsdom and they failed to resolve `bun:sqlite`-touching imports.

## Verification

```
$ bun run verify
lint: clean
typecheck: clean
test: 834 passed (834), 121 files
```

`bun run test:e2e` failed its preflight in this container (no Chromium installed) — the documented
AGENTS.md fallback for implementation containers; not retried. Full red→green detail and the exact
red-run failure output are in `tdd-test-result.md` (`TDD-RESULT: 834 passed, 0 failed`).

## Notes

`tsconfig.node.json` needed `notifications` added to its `include` list for `tsc --build` to accept
the new directory — a minor deviation from PLAN.md, which named only the Vitest registration.
Recorded here rather than blocking; no fixed interface contract or ownership boundary changed.
