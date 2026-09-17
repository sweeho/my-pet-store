---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0212
branch: vortex/feat/SWHM-T-0212-transactional-batch-applier-one-commit-m-b168c0c3
upstream: [artifacts/SWHM-S-0018/SWHM-T-0212/PLAN.md]
---

# TDD result — SWHM-T-0212

## Test cases

| Test                                                                                                                               | Covers          | Intent                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------- |
| `admin/order-status.test.ts › AC-1 / AC-2 / OD-01: a mixed batch sorts each order into its bucket and moves the decidable ones`    | AC-1, AC-2      | approve, deny, an already-terminal order, and an unknown id, each in the right bucket |
| `admin/order-status.test.ts › OD-02: a batch where every order is already terminal is a success with an empty applied list`        | D3, PLAN step 3 | all-skipped is a success, not an error                                                |
| `admin/order-status.test.ts › D7 / OD-03: a duplicate order id in one batch is applied once, skipped the second time by the guard` | D7              | no special-case branch needed — the guard alone produces the right answer             |
| `admin/order-status.test.ts › D6 / OD-04: a write failing partway through the batch rolls back every order to its original status` | D6              | the transaction's all-or-nothing property, proved by re-reading real rows             |

Existing `updateOrderStatus` tests (US-01..US-04) were run unchanged to confirm the ticket's
"leave it exactly as it is" requirement (PLAN.md step 2) — no modification, still green.

## Red run

`bun --bun vitest run admin/order-status.test.ts` — before `applyOrderDecisions` existed on
`admin/order-status.ts`:

```
FAIL |server| admin/order-status.test.ts > applyOrderDecisions > D6 / OD-04: a write failing partway through the batch rolls back every order to its original status
AssertionError: expected [Function] to throw error including 'simulated write failure' but got
'(0,__vite_ssr_import_4__.applyOrderDecisions) is not a function...'

 Test Files  1 failed (1)
      Tests  4 failed | 4 passed (8)
```

(The 4 passing tests were the pre-existing `updateOrderStatus` suite, untouched by this ticket; all 4
new `applyOrderDecisions` tests failed as expected — the function did not exist yet.)

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

 Test Files  117 passed (117)
      Tests  771 passed (771)
```

TDD-RESULT: 771 passed, 0 failed
