---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0020
ticket: SWHM-T-0224
branch: vortex/feat/SWHM-T-0224-notification-service-queue-entry-point-c-6de5b6db
upstream: [artifacts/SWHM-S-0020/SWHM-T-0224/PLAN.md]
---

# TDD result — SWHM-T-0224

## Test cases

| Test                                                                         | Covers     | Intent                                                                                                                                                           |
| ---------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notifications/notify.test.ts › AC-2 / NF-01 (APPROVAL, DENIAL, COMPLETION)` | AC-2       | `notify()` queues one row per kind, QUEUED, no sent/failure                                                                                                      |
| `notifications/notify.test.ts › NF-02`                                       | —          | null billing_email carried through, not refused                                                                                                                  |
| `notifications/notify.test.ts › NF-03`                                       | —          | queuedAt defaults to the call time                                                                                                                               |
| `notifications/recipient.test.ts › AC-4 / RC-01`                             | AC-4       | resolveRecipient returns the account's contact fields                                                                                                            |
| `notifications/recipient.test.ts › AC-4 / RC-02`                             | AC-4       | returns null for fields the account leaves empty                                                                                                                 |
| `notifications/recipient.test.ts › RC-03`                                    | AC-4       | a user with no account rows resolves to all-null, no throw                                                                                                       |
| `notifications/recipient.test.ts › RC-04`                                    | AC-4       | an unknown order id resolves to all-null, no throw                                                                                                               |
| `fulfillment/status.test.ts › ST-10 / AC-2`                                  | AC-2       | completing an order queues exactly one COMPLETION row                                                                                                            |
| `fulfillment/status.test.ts › ST-11 / AC-3`                                  | AC-3       | a repeat call over a COMPLETED order queues no second row                                                                                                        |
| `fulfillment/status.test.ts › ST-12 / AC-3`                                  | AC-3       | refusing a PENDING order queues no COMPLETION row                                                                                                                |
| `order/decision.test.ts › DA-11..DA-14`                                      | AC-2, AC-3 | approval/denial each queue one row via the re-pointed `notify()`; a repeat decision queues no second row (pre-existing, re-verified against the re-pointed call) |

## Red run

`NODE_ENV=test bun --bun vitest run notifications fulfillment/status order/decision`, run against the
pre-implementation tree (schema/vitest.config/approval-types/decision.ts/status.ts reverted to HEAD,
`order/notification.ts` restored, the three new `notifications/*.ts` source files removed):

```
❯ |client| notifications/recipient.test.ts (0 test)
❯ |client| notifications/notify.test.ts (0 test)
❯ |server| fulfillment/status.test.ts (12 tests | 2 failed)
    × ST-10 / AC-2: completing an order queues exactly one COMPLETION notification
    × ST-11 / AC-3: a second call over an already-COMPLETED order queues no additional notification

FAIL notifications/notify.test.ts
Error: Failed to resolve import "./notify" from "notifications/notify.test.ts". Does the file exist?

FAIL notifications/recipient.test.ts
Error: Failed to resolve import "./recipient" from "notifications/recipient.test.ts". Does the file exist?

AssertionError: expected [] to have a length of 1 but got +0   (ST-10, ST-11)

Test Files  3 failed | 1 passed (4)
     Tests  2 failed | 24 passed (26)
```

The two new-module suites also ran in the wrong (`client`/jsdom) Vitest project, confirming
design.md F10's failure mode — the pre-implementation `vitest.config.ts` had no `notifications/**`
registration.

## Green run

`bun run verify` — this stack's full pre-commit gate (`bun run lint && bun run typecheck && bun run test`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(clean)
$ tsc --build
(clean)
$ NODE_ENV=test bun --bun vitest run

Test Files  121 passed (121)
     Tests  834 passed (834)
Duration  15.28s
```

`bun run test:e2e` was attempted for the `verify-full` slot and failed its preflight — Chromium is
not installed in this container (`/ms-playwright/chromium-1155/chrome-linux/chrome` missing), the
documented AGENTS.md fallback for implementation containers. Per that note, not retried; falling
back to `bun run verify` above. The browser tier runs in CI and at INTEGRATION_QA.

TDD-RESULT: 834 passed, 0 failed
