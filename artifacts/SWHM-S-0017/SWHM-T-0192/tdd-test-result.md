---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0017
ticket: SWHM-T-0192
branch: vortex/feat/SWHM-T-0192-order-fulfilment-processing-797542a8
upstream: [artifacts/SWHM-S-0017/SWHM-T-0192/PLAN.md]
---

# TDD result — SWHM-T-0192

## Test cases

| Test                                      | Covers               | Intent                                                                                                                     |
| ----------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `fulfillment/fulfillment.test.ts › PT-01` | DoD (error contract) | throws `OrderNotFoundError` for an unknown order id                                                                        |
| `fulfillment/fulfillment.test.ts › PT-02` | AC-1                 | a fully-stocked order ships its line, completes the order, and the invoice XML contains the order and line details         |
| `fulfillment/fulfillment.test.ts › PT-03` | AC-2                 | an order with no available inventory ships nothing, stays `PENDING`, and returns `null`                                    |
| `fulfillment/fulfillment.test.ts › PT-04` | AC-3                 | a partially fillable order ships only what stock allows, stays `PENDING`, and invoices only the shipped line               |
| `fulfillment/fulfillment.test.ts › PT-05` | AC-3                 | rerunning after restocking ships only what was outstanding, without deducting the already-shipped line again (idempotence) |
| `fulfillment/fulfillment.test.ts › PT-06` | design.md S6         | an already-shipped line is skipped without an inventory check (`checkInventory` called once, only for the unshipped line)  |
| `fulfillment/fulfillment.test.ts › PT-07` | DoD (atomicity)      | a failure partway through the pass leaves no deduction, no shipped-quantity write and no status change                     |

## Red run

`bun --bun vitest run fulfillment/fulfillment.test.ts`, before `fulfillment/fulfillment.ts` existed:

```
FAIL  |server| fulfillment/fulfillment.test.ts [ fulfillment/fulfillment.test.ts ]
Error: Cannot find module './fulfillment' imported from /workspace/repo/fulfillment/fulfillment.test.ts

 Test Files  1 failed (1)
      Tests  no tests
```

## Green run

`bun run verify` — this stack's full pre-commit gate (lint, typecheck, complete test suite). `verify:full` also ran but its `test:e2e` step fails at the preflight with "Playwright's Chromium browser is not installed" (this implementation container has no Chromium — the same limitation recorded against six prior tickets in this sprint in `AGENTS.md` § Notes from previous agents); the preflight names `verify` as the fallback, used here for the recorded green run.

```
$ bun run lint && bun run typecheck && bun run test
✓ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
✓ tsc --build
✓ NODE_ENV=test bun --bun vitest run

 Test Files  105 passed (105)
      Tests  668 passed (668)
```

TDD-RESULT: 668 passed, 0 failed
