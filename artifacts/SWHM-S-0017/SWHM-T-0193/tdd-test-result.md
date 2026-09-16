---
ticket: SWHM-T-0193
title: Fulfilment entry point and access rules
---

## Test cases

### `fulfillment/receive.test.ts` (unit — pure function, no db access)

| ID    | Covers                                                                                          |
| ----- | ----------------------------------------------------------------------------------------------- |
| RT-01 | `{ orderId: number }` parses to a `FulfillmentRequest` — AC "PO is received from message queue" |
| RT-02 | A body missing `orderId` is refused                                                             |
| RT-03 | A body whose `orderId` is a string is refused                                                   |
| RT-04 | A `null` body is refused                                                                        |
| RT-05 | An `undefined` body is refused                                                                  |
| RT-06 | An array body is refused                                                                        |
| RT-07 | A non-finite `orderId` (`NaN`) is refused                                                       |
| RT-08 | A string body is refused                                                                        |

### `routes/api/fulfillment/process.post.test.ts` (integration, real H3Event + in-memory db)

| ID    | Covers                                                                                                                            |
| ----- | --------------------------------------------------------------------------------------------------------------------------------- |
| PT-01 | A body that is not an order identifier is refused with 400 and changes no inventory, no shipped quantity and no order status — AC |
| PT-02 | A request naming an order that does not exist is refused with 404 — AC                                                            |
| PT-03 | A fulfillable order is processed and answers `{ orderId, invoice, status }`                                                       |
| PT-04 | An order whose line lacks sufficient inventory answers a null invoice, order left PENDING                                         |

### `auth/protected-resources.test.ts` (unit — additions for the three new entries)

| ID    | Covers                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------ |
| PR-05 | `/api/fulfillment` requires the administrator role                                               |
| PR-06 | `/supplier` requires the administrator role                                                      |
| PR-07 | `/api/supplier` requires the administrator role                                                  |
| PR-08 | A subtree path under each of the three entries inherits the same requirement (prefix protection) |
| PR-09 | A signed-out request to `/api/fulfillment` is denied (via `evaluateAccess`) — AC-4               |
| PR-10 | A signed-on request without the role is refused role-required, not redirected — AC-4             |
| PR-11 | A signed-on administrator is allowed on `/api/fulfillment`                                       |
| PR-12 | Signed-on without the role on `/supplier` is refused role-required — AC-4                        |
| PR-13 | Signed-on without the role on `/api/supplier` is refused role-required — AC-4                    |
| PR-14 | An existing entry (`/customer`) is unchanged                                                     |

## Red run

Before `fulfillment/receive.ts`, `routes/api/fulfillment/process.post.ts` existed and before the three resource entries were added:

```
$ bun run test -- fulfillment/receive.test.ts routes/api/fulfillment/process.post.test.ts auth/protected-resources.test.ts
 FAIL  |server| fulfillment/receive.test.ts — Cannot find module './receive'
 FAIL  |server| routes/api/fulfillment/process.post.test.ts — Cannot find module './process.post'
 FAIL  |server| auth/protected-resources.test.ts > PR-05..PR-13 — resources not registered / evaluateAccess returned { allowed: true }
 Test Files  3 failed (3)
      Tests  8 failed | 6 passed (14)
```

## Green run

After implementing all three pieces:

```
$ bun run test -- fulfillment/receive.test.ts routes/api/fulfillment/process.post.test.ts auth/protected-resources.test.ts
 Test Files  3 passed (3)
      Tests  26 passed (26)
```

Full pre-commit gate (`bun run verify:full`, which runs `verify` — lint + typecheck + full unit suite — then `test:e2e`):

```
$ bun run verify:full
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0     → pass
$ tsc --build                                                                   → pass
$ NODE_ENV=test bun --bun vitest run
 Test Files  107 passed (107)
      Tests  690 passed (690)
$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
error: script "pretest:e2e" exited with code 1
```

E2E's browser preflight reports Chromium genuinely missing in this container (documented in `AGENTS.md` § Notes from previous agents — implementation containers do not ship Chromium). Per that note, not retried and no browser installed; `verify` (lint + typecheck + the full 690-test unit suite) is the gate that applies here and is green. The browser tier runs in CI and at INTEGRATION_QA.

No pre-existing failures were introduced: this ticket adds 2 new test files (`receive.test.ts`, `process.post.test.ts`, 8 + 4 = 12 tests) plus 10 new cases in the existing `protected-resources.test.ts` (PR-05..PR-14), and the full suite is green at 107 files/690 tests.

TDD-RESULT: 690 passed, 0 failed
