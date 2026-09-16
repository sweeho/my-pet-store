---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0136
branch: vortex/feat/SWHM-T-0136-update-cart-quantities-e5c1a00e
upstream: [artifacts/SWHM-S-0013/SWHM-T-0136/PLAN.md]
---

# TDD result — SWHM-T-0136

## Test cases

| Test                                                                                                                                                                 | Covers                  | Intent                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------- |
| `cart/cart.test.ts › UT-01: updateItem to a positive value sets the quantity to that value`                                                                          | AC-1                    | positive update sets quantity, not accumulates  |
| `cart/cart.test.ts › UT-02: updateItem to 0 removes the line from the cart`                                                                                          | AC-2                    | zero removes                                    |
| `cart/cart.test.ts › UT-03: updateItem to a negative value removes the line from the cart`                                                                           | AC-3                    | negative removes                                |
| `cart/cart.test.ts › UT-04: updateItems applies a mixed batch — one line removed by 0, another set positive — in one request`                                        | AC-7                    | batch mixing removal and update in one call     |
| `cart/cart.test.ts › UT-05: the subtotal recalculates to reflect a changed quantity`                                                                                 | AC-4                    | subtotal reflects the new total after an update |
| `cart/cart.test.ts › UT-06: a write failing partway through a batch rolls back every quantity to its original value`                                                 | AC-6                    | `updateItems`'s `db.transaction` is atomic      |
| `routes/api/cart/index.put.test.ts › CPUR-01: updates a line to a positive quantity and responds 200 with the resulting cart`                                        | AC-1, AC-5              | PUT 200 + resulting `Cart` body                 |
| `routes/api/cart/index.put.test.ts › CPUR-02: a batch containing a quantity of 0 and a positive quantity removes the first line and sets the second, in one request` | AC-7                    | end-to-end batch through the route              |
| `routes/api/cart/index.put.test.ts › CPUR-03: responds 400 with an error body when a quantity is absent`                                                             | AC-6 (route validation) | missing `quantity` field rejected               |
| `routes/api/cart/index.put.test.ts › CPUR-04: responds 400 with an error body when a quantity is not a number`                                                       | AC-6 (route validation) | non-numeric `quantity` rejected (S13)           |
| `routes/api/cart/index.put.test.ts › CPUR-05: a request with no bp_session cookie is accepted rather than rejected with 401`                                         | design.md D3            | PUT is public, like GET/POST                    |

## Red run

`cart/cart.ts` (UT-01..UT-06 appended before `updateItem`/`updateItems` existed):

```
$ bun --bun vitest run cart/cart.test.ts
FAIL  |server| cart/cart.test.ts > cart/cart > UT-01..UT-05
TypeError: updateItem is not a function
FAIL  |server| cart/cart.test.ts > cart/cart > UT-06
AssertionError: expected [Function] to throw error including 'simulated write failure' but got
'(0,__vite_ssr_import_3__.updateItems) is not a function...'
 Test Files  1 failed (1)
      Tests  6 failed | 13 passed (19)
```

`routes/api/cart/index.put.ts` (test written before the route file existed):

```
$ bun --bun vitest run routes/api/cart/index.put.test.ts
Error: Cannot find module './index.put' imported from /workspace/repo/routes/api/cart/index.put.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

## Green run

```
$ bun --bun vitest run cart/cart.test.ts
 Test Files  1 passed (1)
      Tests  19 passed (19)

$ bun --bun vitest run routes/api/cart/index.put.test.ts
 Test Files  1 passed (1)
      Tests  5 passed (5)
```

Then `bun run verify:full` — this stack's full pre-commit gate plus the browser tier:

```
$ bun run verify && bun run test:e2e
$ bun run lint && bun run typecheck && bun run test
 Test Files  82 passed (82)
      Tests  478 passed (478)

$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
error: script "pretest:e2e" exited with code 1
```

Chromium is genuinely not installed in this container (`AGENTS.md` § Notes from previous agents,
"Implementation containers do not ship a Chromium"). This ticket adds no `e2e/` spec. Fell back to
`bun run verify` alone, which is fully green:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  82 passed (82)
      Tests  478 passed (478)
```

478 = the pre-existing suite (454 at SWHM-T-0134, plus what SWHM-T-0135 and SWHM-T-0138 landed on
this branch before it forked) plus the 11 new tests listed above (6 in `cart/cart.test.ts`, 5 in
the new `routes/api/cart/index.put.test.ts`).

TDD-RESULT: 478 passed, 0 failed
