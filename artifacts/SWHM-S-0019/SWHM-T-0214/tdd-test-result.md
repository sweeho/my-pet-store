---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0019
ticket: SWHM-T-0214
branch: vortex/fix/SWHM-T-0214-fulfilment-completes-an-order-without-re-69acc19a
upstream: [artifacts/SWHM-S-0019/SWHM-T-0214/PLAN.md]
---

# TDD result — SWHM-T-0214

## Test cases

| Test                                                                             | Covers           | Intent                                                                                                              |
| -------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| `fulfillment/status.test.ts › ST-07`                                             | AC-2             | `markOrderCompleted` refuses PENDING, row unchanged                                                                 |
| `fulfillment/status.test.ts › ST-08`                                             | AC-1             | `markOrderCompleted` refuses DENIED, row unchanged                                                                  |
| `fulfillment/status.test.ts › ST-09`                                             | AC-1, AC-2, AC-3 | `isFulfillable` true only for APPROVED                                                                              |
| `fulfillment/fulfillment.test.ts › PT-08`                                        | AC-1             | DENIED order holding stock ships nothing, no deduction, no invoice, stays DENIED                                    |
| `fulfillment/fulfillment.test.ts › PT-09`                                        | AC-2             | PENDING order holding stock ships nothing, no deduction, no invoice, stays PENDING                                  |
| `fulfillment/fulfillment.test.ts › PT-10`                                        | AC-7             | second run over COMPLETED changes nothing further                                                                   |
| `routes/api/fulfillment/process.post.test.ts › PT-07`                            | AC-1             | route answers 200 `{ invoice: null, status: "DENIED" }`, inventory untouched                                        |
| `routes/api/fulfillment/process.post.test.ts › PT-08`                            | AC-2             | route answers 200 `{ invoice: null, status: "PENDING" }`                                                            |
| `fulfillment/fulfillment.test.ts › PT-02…PT-07` (re-seeded APPROVED)             | AC-3, AC-5, AC-6 | approved path still ships, completes, and partial fulfilment now correctly asserts APPROVED (not the stale PENDING) |
| `routes/api/fulfillment/process.post.test.ts › PT-01…PT-06` (re-seeded APPROVED) | AC-3, AC-4, AC-5 | approved path unaffected; unknown order id still 404                                                                |
| `e2e/fulfillment.spec.ts` (browser tier, not run here — see below)               | AC-3, AC-8       | place→approve→fulfil path produces an invoice; a denied order's run ships nothing                                   |

## Red run

`bun --bun vitest run fulfillment/status.test.ts fulfillment/fulfillment.test.ts routes/api/fulfillment/process.post.test.ts`, run against the test files above before the fix — 7 failures, each the defect itself (a DENIED/PENDING order got shipped, invoiced and/or completed):

```
FAIL |server| fulfillment/fulfillment.test.ts > PT-08: a DENIED order holding stock ships nothing, deducts no inventory, produces no invoice, and stays DENIED (SWHM-T-0214 regression, AC-1)
AssertionError: expected '<?xml version="1.0" encoding="UTF-8"?…' to be null
- Expected: null
+ Received: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<invoice>...<itemId>fulfillment-item-10</itemId>..."

FAIL |server| fulfillment/fulfillment.test.ts > PT-09: a PENDING order holding stock ships nothing, deducts no inventory, produces no invoice, and stays PENDING (SWHM-T-0214 regression, AC-2)
AssertionError: expected '<?xml version="1.0" encoding="UTF-8"?…' to be null

FAIL |server| fulfillment/status.test.ts > ST-07: markOrderCompleted refuses a PENDING order and leaves it PENDING (SWHM-T-0214 regression)
AssertionError: expected true to be false

FAIL |server| fulfillment/status.test.ts > ST-08: markOrderCompleted refuses a DENIED order and leaves it DENIED (SWHM-T-0214 regression)
FAIL |server| fulfillment/status.test.ts > ST-09: isFulfillable is true only for APPROVED
FAIL |server| routes/api/fulfillment/process.post.test.ts > PT-07: a DENIED order is answered 200 with a null invoice, its own unchanged status, and nothing shipped (SWHM-T-0214 regression, AC-1)
  - status: "DENIED"  + status: "COMPLETED"  (invoice non-null)
FAIL |server| routes/api/fulfillment/process.post.test.ts > PT-08: a PENDING order is answered 200 with a null invoice, its own unchanged status, and nothing shipped (SWHM-T-0214 regression, AC-2)
  - status: "PENDING" + status: "COMPLETED"  (invoice non-null)

Test Files  3 failed (3)
     Tests  7 failed | 20 passed (27)
```

## Green run

`bun run verify` — this stack's full pre-commit gate (`eslint . --max-warnings 0 && tsc --build && NODE_ENV=test bun --bun vitest run`):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  120 passed (120)
      Tests  826 passed (826)
```

`bun run test:e2e` (the browser tier `e2e/fulfillment.spec.ts` lives in) was attempted and fails fast at
the preflight — this container has no Chromium installed, a known limitation of the implementation
container recorded in `AGENTS.md`'s "Notes from previous agents": `[test:e2e] Playwright's Chromium
browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome)`. Per that
note and PLAN.md's Definition of Done, the browser tier is not retried and not installed here; it is
observed on CI for this branch and again at INTEGRATION_QA.

TDD-RESULT: 826 passed, 0 failed
