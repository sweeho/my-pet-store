---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0118
branch: vortex/feat/SWHM-T-0118-order-tables-and-retrieval-by-status-43eb6b4a
upstream: [artifacts/SWHM-S-0012/SWHM-T-0118/PLAN.md]
---

# TDD result — SWHM-T-0118

## Test cases

| Test                                                | Covers | Intent                                                                               |
| --------------------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| `admin/orders.test.ts › OT-01`                      | AC-1   | an empty result for a status with no orders                                          |
| `admin/orders.test.ts › OT-02`                      | AC-1   | filtering by a single status returns only orders with that status                    |
| `admin/orders.test.ts › OT-03`                      | AC-1   | filtering by several statuses returns orders matching any of them, none outside them |
| `admin/orders.test.ts › OT-04`                      | AC-1   | results sort by `order_date` descending, newest first                                |
| `admin/orders.test.ts › OT-05`                      | AC-1   | `order_id` breaks ties between orders sharing the same `order_date`                  |
| `admin/orders.test.ts › OT-06`                      | AC-1   | `hasNext` is true when more rows exist beyond the requested page                     |
| `admin/orders.test.ts › OT-07`                      | AC-1   | `hasNext` is false on the last page                                                  |
| `admin/orders.test.ts › OT-08`                      | AC-1   | an `OrderSummary` carries `orderId`/`userId`/`orderDate`/`orderAmount`/`orderStatus` |
| `routes/api/admin/orders/index.get.test.ts › RO-01` | AC-1   | no signed-on session → 401                                                           |
| `routes/api/admin/orders/index.get.test.ts › RO-02` | AC-1   | signed on without the administrator role → 403                                       |
| `routes/api/admin/orders/index.get.test.ts › RO-03` | AC-1   | an unknown status → 400                                                              |
| `routes/api/admin/orders/index.get.test.ts › RO-04` | AC-1   | no status at all → 400                                                               |
| `routes/api/admin/orders/index.get.test.ts › RO-05` | AC-1   | a valid status → 200 with the five `OrderSummary` fields under their JSON keys       |
| `routes/api/admin/orders/index.get.test.ts › RO-06` | AC-1   | several `status` query values are all matched, nothing outside them                  |
| `routes/api/admin/orders/index.get.test.ts › RO-07` | AC-1   | an invalid `count` → 400                                                             |

Per design.md S4, AC-1's extracted wording ("return XML with order list") is realized as the JSON
response `{ items: OrderSummary[], hasNext: boolean }`, with `OrderId`/`UserId`/`OrderDate`/
`OrderAmount`/`OrderStatus` preserved as the `orderId`/`userId`/`orderDate`/`orderAmount`/
`orderStatus` keys, so the scenario stays checkable.

## Red run

`bun run test`, with the non-test implementation isolated out (the two new source files and the
generated migration moved aside, `db/schema.ts` / `db/client.ts` / `drizzle/meta/_journal.json` /
`tsconfig.node.json` reverted via `git stash`), leaving only the two new test files as the change:

```
FAIL |server| admin/orders.test.ts [ admin/orders.test.ts ]
Error: Cannot find module './orders' imported from /workspace/repo/admin/orders.test.ts

FAIL |server| routes/api/admin/orders/index.get.test.ts [ routes/api/admin/orders/index.get.test.ts ]
Error: Cannot find module './index.get' imported from /workspace/repo/routes/api/admin/orders/index.get.test.ts

Test Files  2 failed | 59 passed (61)
     Tests  343 passed (343)
```

(Both new suites fail to even collect a test — the modules they import did not exist yet. Restored
immediately after via `git stash pop` and moving the files back.)

## Green run

`bun run verify` (this stack's full pre-commit gate — lint, typecheck, complete unit/integration
suite). `bun run verify:full` was attempted first; its E2E tier fails fast in this container because
Chromium is genuinely not installed (`scripts/ensure-playwright-browser.mjs`), the known
implementation-container limitation `AGENTS.md` already records — falling back to `verify` per that
note, E2E is exercised in CI and at integration QA.

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  61 passed (61)
      Tests  358 passed (358)
```

TDD-RESULT: 358 passed, 0 failed
