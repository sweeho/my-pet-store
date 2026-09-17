---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0020
idea: SWHM-I-0012
branch: vortex/sprint/swhm-s-0020-2eb89d94
upstream:
  [
    artifacts/SWHM-S-0020/SPRINT-PLAN.md,
    openspec/changes/swhm-i-0012-customer-notifications-commu/specs/notifications/spec.md,
    openspec/changes/swhm-i-0012-customer-notifications-commu/design.md,
  ]
downstream:
  [
    artifacts/SWHM-S-0020/integration-test-result.md,
    artifacts/SWHM-S-0020/integration-defects-resolution.md,
  ]
---

# QA test report — SWHM-S-0020

## Executive Summary

**Verdict: PASS.** All four requirements of the `notifications` delta spec hold on the integrated
sprint branch: an order approval, denial, or completion each queue a notification, the recipient
is resolved from the account's contact record at send time (falling back to the order's copied
billing address, then to UNDELIVERABLE), the message body carries order id, customer name and
status, and the order's own status transition commits independently of delivery. Verified through
`notifications/notifications.integration.test.ts` (the three transitions driven through their real
routes, plus the missing-address case) and the full unit-test suite (858/858 pass). The full
browser E2E suite (45/45) was run against the integrated, built branch as a regression check on
the two routes this sprint added `dispatchQueued()` to. No defects found; nothing fixed in place;
nothing escalated.

One item on the ticket's own acceptance criteria — "order placement generates a notification" —
is **not** delivered by this sprint. This is not a regression: design.md § Spec discrepancies S2
records that the delta spec's four requirements deliberately exclude placement, and a backlog
ticket (`SWHM-T-0228`, "Decide whether placing an order is worth a message to the customer") was
already raised during planning to take that decision separately. The delta spec, not the
ticket's snapshot description, is this sprint's test oracle (per this ticket's own dispatch
instructions), and every delta-spec requirement is met.

## E2E Test Status

Full browser suite executed and green: **45 passed, 0 failed, 0 skipped** across all 13 spec
files (`bunx playwright test --project=chromium`, one project — no mobile/emulated project exists
in `playwright.config.ts`, so `--list` confirms this selection covers every spec). Full command,
per-spec table and the marker are in `artifacts/SWHM-S-0020/integration-test-result.md`.

The notifications capability itself has no screen (idea puts UI out of scope; design.md § Phases
confirms no browser-tier spec for this change) — its three delivery scenarios are proven by the
Vitest integration test below, not by Playwright.

## Unit Test Results

```
$ bun run test
 RUN  v4.1.10 /workspace/repo
 Test Files  125 passed (125)
      Tests  858 passed (858)
   Duration  14.66s
```

`notifications/` contributes 6 of those 125 files: `notify.test.ts`, `recipient.test.ts`,
`message.test.ts`, `transport.test.ts`, `dispatch.test.ts`, and the cross-module
`notifications.integration.test.ts` (registered in Vitest's `server` project per
`vitest.config.ts`, confirmed by the run above reaching `db/client.ts` without error).

Scenario verdicts, per the delta spec's `## ADDED Requirements`:

```
SCENARIO-VERDICT: Order notification delivery / Customer receives order approval notification — pass
SCENARIO-VERDICT: Order notification delivery / Customer receives order denial notification — pass
SCENARIO-VERDICT: Order notification delivery / Customer receives order completion notification — pass
SCENARIO-VERDICT: Notification content / Notification includes required order information — pass
SCENARIO-VERDICT: Async notification delivery / Notification does not block order status update — pass
SCENARIO-VERDICT: Customer email retrieval / Customer email is obtained from account — pass
```

Evidence per verdict:

- Approval/denial/completion delivery — `notifications.integration.test.ts` `AC-1/NI-01`,
  `AC-2/NI-02`, `AC-3/NI-03`: each drives the real route path (`applyOrderDecisions`,
  `processOrder`), then `dispatchQueued()`, and asserts the fake transport received exactly the
  expected message and the row is marked `SENT`.
- Notification content — the same three tests assert the body contains the order id, the
  customer's full name and the current status; `message.test.ts` `MSG-01`–`MSG-09` cover the
  per-kind subject/body builder in isolation, including the no-name and single-name-fragment
  edge cases (F6).
- Async delivery — `notify()` (`notifications/notify.ts`) only inserts a row inside the caller's
  own transaction; `dispatchQueued()` is called separately, after that transaction has committed
  (`routes/api/admin/orders/decisions.post.ts:87`, `routes/api/fulfillment/process.post.ts:40`),
  so the response is never gated on delivery. Observed directly: `dispatch.test.ts` `DQ-04` and
  `notifications.integration.test.ts` `NI-04` both show the order's decided/completed status is
  unchanged whether the notification is sent, fails, or is undeliverable — the status transition
  and the notification outcome are provably independent. Verified by inspection of the call
  sites plus these two tests; there is no message broker in this deployable to observe a queue
  depth against (design.md § Spec discrepancies S1) — the outbox row is the queue.
- Customer email retrieval — `recipient.test.ts` `RC-01`–`RC-04` (`resolveRecipient` reads the
  account's `contactInfo.email` via `findAccount()`, never `contact_info` directly); the three
  integration tests confirm the account's address is used even when it differs from the order's
  copied `billing_email` (design.md D5).

No coverage regression is claimed beyond what these counts show — see Coverage Summary.

## Code Review

No notable concerns observed. The implementation matches design.md's decisions: `notify()` is the
single queueing entry point superseding `order/notification.ts` (D3); the `notifications` table
was extended in place rather than duplicated (D2); the mail transport is an injectable interface
with a recording default, mirroring `payment/processor.ts` (D8); the drain pass is idempotent by
status, so a repeat call over already-terminal rows hands the transport nothing (D7, confirmed by
`dispatch.test.ts` `DQ-05`/`DQ-06`). `notifications/` is a new top-level directory outside
Nitro's scanned paths and is registered in both the `server` include and the `client` exclude of
`vitest.config.ts` (F10) — confirmed directly: the integration test reaches `db/client.ts` and
passes under `bun run test`.

## Coverage Summary

No coverage tool is configured in this repository (no `coverage` script, no coverage config in
`vitest.config.ts` or `package.json`) — verified by inspection. Verification instead rests on the
counts above: 858/858 unit/integration tests pass, 45/45 browser E2E tests pass, and every one of
the four delta-spec requirements has a scenario verdict backed by a named test.

## Issues Found

None. No defects were found during this integration QA pass; `integration-defects-resolution.md`
records an empty defect list.

## Recommendation

**Proceed — fire `validation.all_acs_passed`.** Every delta-spec requirement holds, the full
regression suite (unit + E2E) is green, and no defect requires a fix or an escalation. The
placement-notification gap (S2/`SWHM-T-0228`) is a deliberate, already-tracked scope decision
outside this sprint's delta spec, not a failure of this sprint's acceptance criteria.
