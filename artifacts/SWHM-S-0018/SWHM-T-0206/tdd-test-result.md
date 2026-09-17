---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0206
branch: vortex/feat/SWHM-T-0206-order-approval-and-denial-workflow-the-s-1f9a048c
upstream: [artifacts/SWHM-S-0018/SWHM-T-0206/PLAN.md]
---

# TDD result — SWHM-T-0206

## Test cases

| Test                                                                                                      | Covers       | Intent                                                         |
| --------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------- |
| `order/decision.test.ts › AC-1 / DA-01: a PENDING order decided APPROVED transitions to APPROVED`         | AC-1         | `applyDecision` returns `applied` with the new status          |
| `order/decision.test.ts › DA-02: the row itself carries APPROVED after the call, read back independently` | AC-1         | the write actually lands on the row, not just the return value |
| `order/decision.test.ts › AC-2 / DA-03: a PENDING order decided DENIED transitions to DENIED`             | AC-2         | `applyDecision` returns `applied` with the new status          |
| `order/decision.test.ts › DA-04: the row itself carries DENIED after the call, read back independently`   | AC-2         | the write actually lands on the row, not just the return value |
| `order/decision.test.ts › DA-05: an already-APPROVED order is skipped, its status unchanged`              | design.md D3 | terminal guard reports a skip, no overwrite                    |
| `order/decision.test.ts › DA-06: an already-DENIED order is skipped, its status unchanged`                | design.md D3 | terminal guard reports a skip, no overwrite                    |
| `order/decision.test.ts › DA-07: a COMPLETED order is skipped, its status unchanged`                      | design.md D3 | terminal guard reports a skip, no overwrite                    |
| `order/decision.test.ts › DA-08: an unknown order id is reported notFound`                                | design.md D3 | the three-way `DecisionOutcome` shape's third case             |

## Red run

`bun --bun vitest run order/decision.test.ts` — before `order/decision.ts` existed:

```
FAIL  |server| order/decision.test.ts [ order/decision.test.ts ]
Error: Cannot find module './decision' imported from /workspace/repo/order/decision.test.ts

Test Files  1 failed (1)
     Tests  no tests
```

## Green run

`bun run verify` — this project's full pre-commit gate (`bun run lint && bun run typecheck && bun run test`). `verify:full`'s browser tier was attempted and fails at the documented preflight (`scripts/ensure-playwright-browser.mjs`: Chromium not installed) — the known implementation-container limitation recorded in `AGENTS.md § Notes from previous agents`; not retried per that note, and out of scope since this ticket has no UI.

```
$ bun run lint && bun run typecheck && bun run test
eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   ✓ (no output)
tsc --build                                                                  ✓ (no output)
NODE_ENV=test bun --bun vitest run

 Test Files  115 passed (115)
      Tests  753 passed (753)
```

TDD-RESULT: 753 passed, 0 failed
