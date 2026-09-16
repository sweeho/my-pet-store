---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0017
ticket: SWHM-T-0187
branch: vortex/feat/SWHM-T-0187-inventory-table-fulfilment-module-and-it-584f9159
upstream: [artifacts/SWHM-S-0017/SWHM-T-0187/PLAN.md]
---

# TDD result — SWHM-T-0187

## Test cases

| Test                                     | Covers                                                       | Intent                                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fulfillment/errors.test.ts › ET-01..04` | foundation for AC-2/AC-5 error mapping used by later tickets | each error class is an `Error` with its own `name`                                                                                                           |
| `fulfillment/errors.test.ts › ET-05`     | same                                                         | a custom message overrides the default                                                                                                                       |
| `fulfillment/seed.test.ts › FT-01`       | AC-3                                                         | this file runs in the `server` (node) project, not `client` (jsdom)                                                                                          |
| `fulfillment/seed.test.ts › FT-02`       | AC-4                                                         | a database built under Vitest holds no inventory rows                                                                                                        |
| `fulfillment/seed.test.ts › FT-03`       | AC-4                                                         | `seedInventory()` gives every existing item a non-zero starting quantity                                                                                     |
| `fulfillment/seed.test.ts › FT-04`       | AC-1                                                         | a row in `inventory` holds a quantity against an item id                                                                                                     |
| `fulfillment/seed.test.ts › FT-05`       | AC-2                                                         | an item with no `inventory` row reads as quantity 0, not null or an error                                                                                    |
| `fulfillment/seed.test.ts › FT-06`       | AC-5                                                         | an order inserted into the existing `orders`/`order_line_item` tables is `PENDING` with its line at `quantityShipped` 0 — the inherited shape, not redefined |

## Red run

`bun --bun vitest run fulfillment/seed.test.ts`, with `seedInventory()` temporarily replaced by a no-op body to prove FT-03 actually exercises the implementation:

```
❯ |server| fulfillment/seed.test.ts (6 tests | 1 failed) 8ms
   × FT-03: seedInventory gives every existing item a non-zero starting quantity 3ms
TypeError: actual value must be number or bigint, received "undefined"
 ❯ fulfillment/seed.test.ts:56:29
     56|     expect(byItemid.get(a)).toBeGreaterThan(0);

 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
```

`seedInventory()` was then restored to its real implementation before the green run below. The other test cases (errors.test.ts, and seed.test.ts's FT-01/02/04/05/06) assert behaviour that exists only once `db/schema.ts`'s `inventory` table and the two files below it are present, so a red run for the whole suite would fail at import time (no `inventory` export, no `fulfillment/errors.ts`, no `fulfillment/seed.ts`) rather than at a useful assertion — that failure mode is recorded here rather than staged for effect.

## Green run

`bun run verify` — this stack's full pre-commit gate (lint, typecheck, complete test suite). `verify:full` also ran but its `test:e2e` step fails at the preflight with "Playwright's Chromium browser is not installed" (this implementation container has no Chromium — a known limitation recorded in `AGENTS.md` § Notes from previous agents); the preflight names `verify` as the fallback, used here for the recorded green run.

```
$ bun run lint && bun run typecheck && bun run test
✓ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
✓ tsc --build
✓ NODE_ENV=test bun --bun vitest run

 Test Files  100 passed (100)
      Tests  630 passed (630)
```

TDD-RESULT: 630 passed, 0 failed
