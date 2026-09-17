---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0020
ticket: SWHM-T-0226
branch: vortex/feat/SWHM-T-0226-delivery-mail-transport-boundary-and-the-63178bf9
upstream: [artifacts/SWHM-S-0020/SWHM-T-0226/PLAN.md]
downstream: [artifacts/SWHM-S-0020/qa-test-report.md]
---

# Summary — SWHM-T-0226: Delivery — mail transport boundary and the drain pass

## What changed

Added the mail transport boundary (`MailTransport` interface + a default that records rather than
delivers, mirroring `payment/processor.ts`) and the drain pass (`dispatchQueued`) that reads every
`QUEUED` notification row, resolves the recipient's address (account email first, falling back to
the row's copied billing email), builds the message, hands it to the transport, and leaves the row
terminal (`SENT`/`FAILED`/`UNDELIVERABLE`) in the same pass. Both order-decision and fulfilment
routes now call `dispatchQueued()` once, after their own transaction has already committed. No
schema change — SWHM-T-0224 already added every column this ticket writes.

## Files

- `notifications/transport.ts` — `MailTransport` interface, `recordingTransport` default (records to an in-memory `sent` log).
- `notifications/transport.test.ts` — the default records rather than delivers.
- `notifications/dispatch.ts` — `dispatchQueued(transport?)`, the drain pass: address selection, terminal-status write, per-row try/catch so one throw never stops the pass.
- `notifications/dispatch.test.ts` — sent (account address, fallback address), undeliverable, failed (order status untouched), repeat-pass no-op, default-transport path.
- `routes/api/admin/orders/decisions.post.ts` (+ test) — calls `dispatchQueued()` after `applyOrderDecisions` returns; new test proves the response and the applied decision are unaffected by a throwing transport.
- `routes/api/fulfillment/process.post.ts` (+ test) — calls `dispatchQueued()` after `processOrder` + status read; same throwing-transport proof.

## AC coverage

- AC-1/AC-2/AC-3 (approval/denial/completion notifications sent) — `dispatch.ts`'s send branch, covered by `dispatch.test.ts` DQ-01/DQ-02 (kind-agnostic: `notify()` already queues the right kind per SWHM-T-0224, `dispatchQueued` sends whatever is queued).
- AC-4 (status update completes without waiting on delivery) — both routes call `dispatchQueued()` only after their own `db.transaction` has returned, so the status write is already committed; not separately timed, structurally guaranteed by call placement (PLAN.md step 3).
- AC-5 (every picked-up row ends terminal: SENT+timestamp / FAILED+reason / UNDELIVERABLE) — `dispatch.ts`; `dispatch.test.ts` DQ-01, DQ-03, DQ-04.
- AC-6 (a throwing transport leaves the order's status unchanged and the triggering request successful) — `dispatch.test.ts` DQ-04 (order status) and the two route tests RD-11/PT-09 (request still succeeds).
- AC-7 (a second drain pass hands the transport nothing and changes no row) — `dispatch.test.ts` DQ-05/DQ-06.
- AC-8 (transport is an injected-default interface, no mail/SMTP dependency added) — `transport.ts`; `transport.test.ts`; `package.json` untouched (no new dependency).

## Verification

```
$ bun run verify
lint: clean
typecheck: clean
test: 854 passed (854), 124 files
```

`bun run test:e2e` failed its preflight in this container (no Chromium installed) — the same
documented AGENTS.md fallback as SWHM-T-0224; not retried. Full red→green detail is in
`tdd-test-result.md` (`TDD-RESULT: 854 passed, 0 failed`).

## Notes

None — no deviation from `PLAN.md`.
