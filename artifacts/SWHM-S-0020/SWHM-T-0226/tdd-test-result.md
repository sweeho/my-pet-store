---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0020
ticket: SWHM-T-0226
branch: vortex/feat/SWHM-T-0226-delivery-mail-transport-boundary-and-the-63178bf9
upstream: [artifacts/SWHM-S-0020/SWHM-T-0226/PLAN.md]
---

# TDD result — SWHM-T-0226

## Test cases

| Test                                                            | Covers     | Intent                                                                                        |
| --------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `notifications/transport.test.ts › AC-8 / TR-01`                | AC-8       | the default transport records the message rather than delivering it                           |
| `notifications/transport.test.ts › TR-02`                       | AC-8       | send does not throw for an ordinary message                                                   |
| `notifications/dispatch.test.ts › AC-1 / AC-5 / DQ-01`          | AC-1, AC-5 | sends to the account's address, row marked SENT with a timestamp                              |
| `notifications/dispatch.test.ts › AC-1 / AC-5 / DQ-02`          | AC-1, AC-5 | falls back to the row's copied billing email when the account has none                        |
| `notifications/dispatch.test.ts › AC-5 / DQ-03`                 | AC-5       | marks UNDELIVERABLE with a reason when no address exists anywhere                             |
| `notifications/dispatch.test.ts › AC-5 / AC-6 / DQ-04`          | AC-5, AC-6 | marks FAILED with the thrown reason; order's own status untouched                             |
| `notifications/dispatch.test.ts › AC-7 / DQ-05`                 | AC-7       | a second pass right after the first hands the transport nothing                               |
| `notifications/dispatch.test.ts › DQ-06`                        | AC-7       | a row already terminal from a prior pass is not picked up again                               |
| `notifications/dispatch.test.ts › DQ-07`                        | AC-8       | `dispatchQueued()` defaults to the recording transport                                        |
| `routes/api/admin/orders/decisions.post.test.ts › RD-11 / AC-6` | AC-2, AC-6 | the decisions request still succeeds and the decision still applies when the transport throws |
| `routes/api/fulfillment/process.post.test.ts › PT-09 / AC-6`    | AC-3, AC-6 | the fulfilment request still succeeds and completes when the transport throws                 |

## Red run

`NODE_ENV=test bun --bun vitest run notifications routes/api/admin/orders/decisions.post routes/api/fulfillment/process.post`,
run against the pre-implementation tree (`routes/api/admin/orders/decisions.post.ts` and
`routes/api/fulfillment/process.post.ts` reverted to HEAD, `notifications/dispatch.ts` and
`notifications/transport.ts` removed, all new/modified test files left in place):

```
FAIL notifications/dispatch.test.ts
Error: Cannot find module './dispatch' imported from /workspace/repo/notifications/dispatch.test.ts

FAIL notifications/transport.test.ts
Error: Cannot find module './transport' imported from /workspace/repo/notifications/transport.test.ts

FAIL routes/api/fulfillment/process.post.test.ts
Error: Cannot find module '../../../notifications/transport' imported from routes/api/fulfillment/process.post.test.ts

FAIL routes/api/admin/orders/decisions.post.test.ts
Error: Cannot find module '../../../../notifications/transport' imported from routes/api/admin/orders/decisions.post.test.ts

Test Files  4 failed | 3 passed (7)
     Tests  18 passed (18)
```

All four suites carrying this ticket's new assertions failed to even load without the
implementation, confirming genuine red before the code existed.

## Green run

`bun run verify` — this stack's full pre-commit gate (`bun run lint && bun run typecheck && bun run test`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(clean)
$ tsc --build
(clean)
$ NODE_ENV=test bun --bun vitest run

Test Files  124 passed (124)
     Tests  854 passed (854)
Duration  14.63s
```

`bun run test:e2e` was attempted for the `verify-full` slot and failed its preflight — Chromium is
not installed in this container (`/ms-playwright/chromium-1155/chrome-linux/chrome` missing), the
documented AGENTS.md fallback for implementation containers (also hit on SWHM-T-0224). Not retried
per that note; falling back to `bun run verify` above. The browser tier runs in CI and at
INTEGRATION_QA.

TDD-RESULT: 854 passed, 0 failed
