---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0156
branch: vortex/feat/SWHM-T-0156-order-creation-dd97f995
upstream: [artifacts/SWHM-S-0014/SWHM-T-0156/PLAN.md]
---

# TDD result — SWHM-T-0156

## Test cases

| Test                                          | Covers                | Intent                                                                                 |
| --------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------- |
| `order/order.test.ts › OT-01`                 | AC-4                  | `user_name` is the caller's parameter, never a value smuggled into the submission body |
| `order/order.test.ts › OT-02`                 | AC-1                  | every billing field lands on the order's `billing_*` columns                           |
| `order/order.test.ts › OT-03`                 | AC-2                  | every shipping field lands on the order's `shipping_*` columns, independent of billing |
| `order/order.test.ts › OT-04`                 | AC-6                  | placement neither reads nor writes the customer's account address                      |
| `order/order.test.ts › OT-05`                 | AC-5                  | a new order's status is `PENDING`                                                      |
| `order/order.test.ts › OT-06`                 | AC-3, AC-7            | order date is `new Date()` at placement, asserted against a controlled clock           |
| `order/order.test.ts › OT-07`                 | AC-8                  | `placeOrder` returns `{ orderId, email }`                                              |
| `routes/api/order/index.post.test.ts › PO-01` | (existing, unchanged) | unauthenticated submission still refused 401                                           |
| `routes/api/order/index.post.test.ts › PO-02` | (existing, unchanged) | missing field still refused 400                                                        |
| `routes/api/order/index.post.test.ts › PO-03` | (existing, unchanged) | invalid email still refused 400                                                        |
| `routes/api/order/index.post.test.ts › PO-04` | AC-8                  | a valid submission now creates an order and the route returns `{ orderId, email }`     |

## Red run

Scoped to the new/changed tests, before `order/order.ts` existed and before the route called it:

```
$ bun --bun vitest run order/order.test.ts
FAIL  |server| order/order.test.ts [ order/order.test.ts ]
Error: Cannot find module './order' imported from /workspace/repo/order/order.test.ts

$ bun --bun vitest run routes/api/order/index.post.test.ts
 × PO-04: a fully valid submission from a signed-on shopper creates an order and returns its id and email
   AssertionError: expected { accepted: true } to deeply equal { orderId: Any<Number>, email: 'maya.chen@example.com' }
 Test Files  1 failed (1)
      Tests  1 failed | 3 passed (4)
```

## Green run

`bun run verify` — this stack's browser-free full gate (lint + typecheck + complete unit suite).
`bun run verify:full`'s E2E tier was attempted first and fails only on this container's missing
Chromium (`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed"),
matching AGENTS.md's "Implementation containers do not ship a Chromium" note — E2E runs at
CI/integration QA instead:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  88 passed (88)
      Tests  544 passed (544)
```

TDD-RESULT: 544 passed, 0 failed
