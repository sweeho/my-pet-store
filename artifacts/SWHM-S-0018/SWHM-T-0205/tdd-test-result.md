---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0018
ticket: SWHM-T-0205
branch: vortex/feat/SWHM-T-0205-status-validation-guard-only-pending-ord-bec03a8a
upstream: [artifacts/SWHM-S-0018/SWHM-T-0205/PLAN.md]
---

# TDD result — SWHM-T-0205

## Test cases

| Test                                                                                             | Covers | Intent                                                        |
| ------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------- |
| `order/status.test.ts › OS-01: TERMINAL_STATUSES is exactly APPROVED, DENIED, COMPLETED`         | D3     | the terminal-status vocabulary is exact, not a superset       |
| `order/status.test.ts › OS-02: isDecidable is true only for PENDING`                             | D3     | predicate covers all four statuses individually               |
| `order/status.test.ts › OS-03: readOrderDecidability reports a PENDING order as decidable`       | AC-1   | PENDING order is eligible for approval/denial                 |
| `order/status.test.ts › OS-04: readOrderDecidability reports an APPROVED order as not decidable` | AC-2   | approved order reported skipped, current status carried back  |
| `order/status.test.ts › OS-05: readOrderDecidability reports a DENIED order as not decidable`    | AC-3   | denied order reported skipped, current status carried back    |
| `order/status.test.ts › OS-06: readOrderDecidability reports a COMPLETED order as not decidable` | AC-4   | completed order reported skipped, current status carried back |
| `order/status.test.ts › OS-07: readOrderDecidability returns null for an unknown order id`       | D3     | unknown id is a different answer from a terminal status       |

## Red run

`bun --bun vitest run order/status.test.ts` — before `order/status.ts` existed:

```
FAIL  |server| order/status.test.ts [ order/status.test.ts ]
Error: Cannot find module './status' imported from /workspace/repo/order/status.test.ts

 Test Files  1 failed (1)
      Tests  no tests
```

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

 Test Files  114 passed (114)
      Tests  745 passed (745)
```

TDD-RESULT: 745 passed, 0 failed
