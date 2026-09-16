---
ticket: SWHM-T-0190
type: tdd-test-result
---

# TDD test result — SWHM-T-0190

## Test cases

`fulfillment/status.test.ts` (server project, real in-memory db via `db/client.ts`):

| ID    | Case                                                                              |
| ----- | --------------------------------------------------------------------------------- |
| ST-01 | `readOrderStatus` reads the current status of an existing order                   |
| ST-02 | `readOrderStatus` returns `null` for an unknown order id                          |
| ST-03 | `markOrderCompleted` moves a `PENDING` order to `COMPLETED` and returns `true`    |
| ST-04 | `markOrderCompleted` refuses an order already `COMPLETED` and reports no change   |
| ST-05 | A second call after completion returns `false` and leaves the row unchanged       |
| ST-06 | `markOrderCompleted` returns `false` for an unknown order id rather than throwing |

## Red run

Command: `bun --bun vitest run fulfillment/status.test.ts`

Before `fulfillment/status.ts` existed:

```
FAIL  |server| fulfillment/status.test.ts [ fulfillment/status.test.ts ]
Error: Cannot find module './status' imported from /workspace/repo/fulfillment/status.test.ts

 Test Files  1 failed (1)
      Tests  no tests
```

Confirmed red: the suite fails to collect because the module under test does not exist yet.

## Green run

Command: `bun --bun vitest run fulfillment/status.test.ts`

```
 Test Files  1 passed (1)
      Tests  6 passed (6)
```

Full pre-commit gate — `bun run verify` (lint + typecheck + full unit suite):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  102 passed (102)
      Tests  643 passed (643)
```

`bun run verify:full` (adds the E2E tier) was attempted first; its preflight
(`scripts/ensure-playwright-browser.mjs`) reports Chromium is not installed in
this container — the same documented limitation recorded in `AGENTS.md` §
Notes from previous agents. No screen or E2E spec is in scope for this
ticket. Falling back to `verify` per that note; the browser tier runs in CI
and at INTEGRATION_QA.

TDD-RESULT: 643 passed, 0 failed
