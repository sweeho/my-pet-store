---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0207
branch: vortex/feat/SWHM-T-0207-supplier-purchase-order-generation-on-ap-96464f5c
upstream: [artifacts/SWHM-S-0018/SWHM-T-0207/PLAN.md]
---

# TDD result — SWHM-T-0207

## Test cases

| Test                                                                                                          | Covers      | Intent                                                                   |
| ------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------ |
| `order/supplier-po.test.ts › AC-1: writes a PO row with the order id, date and full shipping address`         | AC-1        | PO carries order id, PO date, and the full copied shipping address       |
| `order/supplier-po.test.ts › AC-2: a three-line order produces three PO line rows carrying all six fields`    | AC-2        | one line row per order line, all fields including a null catid/productid |
| `order/supplier-po.test.ts › AC-3 (S2): the PO record is persisted and readable — no XML, no queue involved`  | AC-3        | S2's substitution: the record existing where fulfilment reads it         |
| `order/supplier-po.test.ts › D7: calling createSupplierPo twice for the same order leaves exactly one PO row` | D7          | order_id primary key makes a repeat write impossible, not just unlikely  |
| `order/decision.test.ts › DA-09: an APPROVED decision writes a supplier PO row (SWHM-T-0207)`                 | AC-1, D3    | the wiring in `applyDecision` actually calls `createSupplierPo`          |
| `order/decision.test.ts › DA-10: a DENIED decision writes no supplier PO row (SWHM-T-0207)`                   | PLAN step 4 | the PO write is gated on APPROVED, never DENIED                          |

## Red run

`bun --bun vitest run order/supplier-po.test.ts` — before `order/supplier-po.ts` existed:

```
FAIL  |server| order/supplier-po.test.ts [ order/supplier-po.test.ts ]
Error: Cannot find module './supplier-po' imported from /workspace/repo/order/supplier-po.test.ts

 Test Files  1 failed (1)
      Tests  no tests
```

`bun --bun vitest run order/decision.test.ts` — `order/decision.ts`'s wiring change reverted (extension point left as a comment, no `createSupplierPo` call):

```
FAIL  |server| order/decision.test.ts > applyDecision > DA-09: an APPROVED decision writes a supplier PO row (SWHM-T-0207)
AssertionError: expected undefined to be defined

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
```

(DA-10 passes trivially either way — no PO exists regardless of wiring — so it does not independently prove red; DA-09 is the test that pins the wiring.)

The revert was captured via `git stash` on `order/decision.ts` only and popped immediately after.

## Green run

`bun run verify` — this project's full pre-commit gate (`bun run lint && bun run typecheck && bun run test`);
`verify:full`'s browser tier was attempted first and failed at the documented preflight
(`scripts/ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed") — a known
implementation-container limitation recorded in `AGENTS.md § Notes from previous agents`, not retried
per that note; E2E runs again in CI and at INTEGRATION_QA. This ticket has no UI change.

```
$ bun run lint && bun run typecheck && bun run test
eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   ✓ (no output)
tsc --build                                                                  ✓ (no output)
NODE_ENV=test bun --bun vitest run

 Test Files  116 passed (116)
      Tests  759 passed (759)
```

TDD-RESULT: 759 passed, 0 failed
