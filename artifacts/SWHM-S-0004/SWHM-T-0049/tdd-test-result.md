---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0049
branch: vortex/feat/SWHM-T-0049-read-transaction-consistency-for-catalog-84bea8cc
upstream: [artifacts/SWHM-S-0004/SWHM-T-0049/PLAN.md]
---

# TDD result — SWHM-T-0049

## Test cases

| Test                                  | Covers | Intent                                                                                  |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| `catalog/transaction.test.ts › TT-01` | AC-1   | `readConsistent` runs its callback and returns its value                                |
| `catalog/transaction.test.ts › TT-02` | AC-2   | a row written inside the callback is absent after the callback throws (rollback)        |
| `catalog/transaction.test.ts › TT-03` | AC-2   | a row written inside the callback is present after the callback returns (commit)        |
| `catalog/transaction.test.ts › TT-04` | AC-4   | an entity and its locale detail row read inside one call are consistent with each other |
| `catalog/transaction.test.ts › TT-05` | AC-3   | the exact thrown error object propagates to the caller unchanged                        |

## Red run

`bun run test -- catalog/transaction.test.ts` — failed to collect, `catalog/transaction.ts` did not exist yet:

```
FAIL  |server| catalog/transaction.test.ts [ catalog/transaction.test.ts ]
Error: Cannot find module './transaction' imported from /workspace/repo/catalog/transaction.test.ts

Test Files  1 failed (1)
     Tests  no tests
```

## Green run

`bun run verify` — this stack's full gate (lint, typecheck, complete unit/integration suite):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  32 passed (32)
      Tests  154 passed (154)
```

`bun run test:e2e` was not run: the E2E preflight (`scripts/ensure-playwright-browser.mjs`) reports Chromium is genuinely not installed in this container — the same documented limitation recorded in `AGENTS.md`'s Notes from previous agents for this sprint. This ticket adds no route, page or E2E-observable behavior (`catalog/transaction.ts` is applied to nothing yet, per its own scope), so the E2E tier has no new surface to cover; CI runs it independently before the DONE transition.

TDD-RESULT: 154 passed, 0 failed
