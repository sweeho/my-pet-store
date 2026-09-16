---
ticket: SWHM-T-0188
type: tdd-test-result
---

# TDD test result — SWHM-T-0188

## Test cases

`fulfillment/inventory.test.ts` (server project, real in-memory db via `db/client.ts`):

| ID    | Case                                                                                         |
| ----- | -------------------------------------------------------------------------------------------- |
| IT-01 | `getInventoryQuantity` reads 0 for a missing row                                             |
| IT-02 | `getInventoryQuantity` reads the held quantity for an existing row                           |
| IT-03 | `checkInventory` confirms and reduces to 0 when held == ordered (boundary)                   |
| IT-04 | `checkInventory` reduces the AC-3 figure: 100 held, 30 ordered → 70 left                     |
| IT-05 | `checkInventory` refuses and leaves the figure untouched when held == ordered − 1 (boundary) |
| IT-06 | `checkInventory` refuses a line with no inventory row at all                                 |
| IT-07 | `reduceQuantity` decrements the held quantity by the given amount                            |

## Red run

Command: `bun --bun vitest run fulfillment/inventory.test.ts`

Before `fulfillment/inventory.ts` existed:

```
FAIL  |server| fulfillment/inventory.test.ts [ fulfillment/inventory.test.ts ]
Error: Cannot find module './inventory' imported from /workspace/repo/fulfillment/inventory.test.ts

 Test Files  1 failed (1)
      Tests  no tests
```

Confirmed red: the suite fails to collect because the module under test does not exist yet.

## Green run

Command: `bun --bun vitest run fulfillment/inventory.test.ts`

```
 Test Files  1 passed (1)
      Tests  7 passed (7)
```

Full pre-commit gate — `bun run verify` (lint + typecheck + full unit suite):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  101 passed (101)
      Tests  637 passed (637)
```

`bun run verify:full` (adds the E2E tier) was attempted first; its preflight
(`scripts/ensure-playwright-browser.mjs`) reports Chromium is not installed in
this container — a known limitation recorded in `AGENTS.md` § Notes from
previous agents ("Implementation containers do not ship a Chromium"). No E2E
spec was added or touched by this ticket (backend module only, no screen).
Falling back to `verify` per that note; the browser tier runs in CI and at
INTEGRATION_QA.

TDD-RESULT: 637 passed, 0 failed
