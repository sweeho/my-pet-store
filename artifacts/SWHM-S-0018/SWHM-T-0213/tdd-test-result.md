---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0213
branch: vortex/feat/SWHM-T-0213-customer-notifications-queued-on-approva-0515569d
upstream: [artifacts/SWHM-S-0018/SWHM-T-0213/PLAN.md]
---

# TDD result — SWHM-T-0213

## Test cases

| Test                                                                                                                 | Covers                   | Intent                                                                        |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| `order/notification.test.ts › AC-1 / NT-01: queues an APPROVAL row carrying the order id and copied billing email`   | AC-1                     | `queueNotification` writes the row, `kind`/`orderId`/`recipientEmail` correct |
| `order/notification.test.ts › AC-2 / NT-02: queues a DENIAL row carrying the order id and copied billing email`      | AC-2                     | `queueNotification` writes the row, `kind`/`orderId`/`recipientEmail` correct |
| `order/notification.test.ts › NT-03: a null billing_email is carried through as a null recipient_email, not refused` | design.md D5             | nullable `billing_email` does not block the decision                          |
| `order/notification.test.ts › NT-04: queuedAt defaults to the moment of the call when not given`                     | fixed interface contract | optional `queuedAt` parameter default                                         |
| `order/decision.test.ts › DA-11: an approval queues exactly one APPROVAL notification (SWHM-T-0213)`                 | AC-1                     | `applyDecision` wiring, approved path                                         |
| `order/decision.test.ts › DA-12: a denial queues exactly one DENIAL notification (SWHM-T-0213)`                      | AC-2                     | `applyDecision` wiring, denied path                                           |
| `order/decision.test.ts › DA-13: a skipped terminal order queues no notification (SWHM-T-0213)`                      | PLAN.md step 4           | no notification on a skip                                                     |
| `order/decision.test.ts › DA-14: deciding the same order twice queues exactly one notification (D7)`                 | design.md D7             | re-deciding a terminal order queues no second notification                    |

## Red run

`bun --bun vitest run order/notification.test.ts` — before `order/notification.ts` existed:

```
FAIL  |server| order/notification.test.ts [ order/notification.test.ts ]
Error: Cannot find module './notification' imported from /workspace/repo/order/notification.test.ts

Test Files  1 failed (1)
     Tests  no tests
```

`bun --bun vitest run order/decision.test.ts` — DA-11..DA-14 added before `order/decision.ts` was
wired to call `queueNotification`:

```
FAIL order/decision.test.ts > applyDecision > DA-11: an approval queues exactly one APPROVAL notification (SWHM-T-0213)
AssertionError: expected [] to have a length of 1 but got +0
FAIL order/decision.test.ts > applyDecision > DA-12: a denial queues exactly one DENIAL notification (SWHM-T-0213)
AssertionError: expected [] to have a length of 1 but got +0
FAIL order/decision.test.ts > applyDecision > DA-14: deciding the same order twice queues exactly one notification (D7)
AssertionError: expected [] to have a length of 1 but got +0

Test Files  1 failed (1)
     Tests  3 failed | 11 passed (14)
```

(DA-13 — "a skip queues no notification" — passed even against the unwired code, since a skip never
reaches the write path either way; the other three genuinely required the wiring.)

## Green run

`bun run verify` — this project's full pre-commit gate (`bun run lint && bun run typecheck && bun run test`). `verify:full`'s browser tier was attempted and fails at the documented preflight (`scripts/ensure-playwright-browser.mjs`: Chromium not installed) — the known implementation-container limitation recorded in `AGENTS.md § Notes from previous agents`; not retried per that note, and out of scope since this ticket has no UI.

```
$ bun run lint && bun run typecheck && bun run test
eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   ✓ (no output)
tsc --build                                                                  ✓ (no output)
NODE_ENV=test bun --bun vitest run

 Test Files  117 passed (117)
      Tests  767 passed (767)
```

TDD-RESULT: 767 passed, 0 failed
