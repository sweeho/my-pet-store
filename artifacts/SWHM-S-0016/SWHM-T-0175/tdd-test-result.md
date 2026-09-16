---
ticket: SWHM-T-0175
sprint: SWHM-S-0016
type: task
---

# TDD result — SWHM-T-0175

## Test cases

| #   | Case                                                                                                                                                                                                                                                                                                                                                                    | AC   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1   | `payment/types.test.ts` — a `CardSubmission` (full card number, cardholder name, type, expiry month/year) run through the existing `account/customer.ts` update path stores only `cardType`, a composed `expiryDate`, and `lastFour`; the full card number never appears in the stored account, either as returned by `updateAccount` or as read back by `findAccount`. | AC-1 |

## Red run

`payment/types.ts` did not exist yet. `payment/types.test.ts` imports `CardSubmission` from `./types` with `import type`, which Vitest/esbuild erases at runtime — so `bun --bun vitest run payment/types.test.ts` passed even with the module missing (it never actually resolves a type-only import). The real red signal for a types-only module is the type checker:

```
$ bun run typecheck
$ node scripts/ensure-generated-files.mjs
$ tsc --build
payment/types.test.ts(4,37): error TS2307: Cannot find module './types' or its corresponding type declarations.
```

Exit code: 2 (failure), confirming the missing module before `payment/types.ts` was written.

## Green run

After creating `payment/types.ts` and registering `payment/**` in `vitest.config.ts` (server `include`, client `exclude`) and `tsconfig.node.json` (`include`):

```
$ bun run typecheck
$ node scripts/ensure-generated-files.mjs
$ tsc --build
```

Exit code: 0.

```
$ bun --bun vitest run payment/types.test.ts --reporter=verbose
✓ |server| payment/types.test.ts > payment/types storage path (AC-1) > stores card type, expiry, and last four; never the full card number
Test Files  1 passed (1)
Tests  1 passed (1)
```

Confirms the test runs under the `server` Vitest project (resolves `bun:sqlite` through `account/customer.ts` → `db/client.ts`), not `client`.

Full pre-commit gate (`bun run verify` — lint + typecheck + the complete unit suite, not just the tests touched by this ticket):

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
Test Files  92 passed (92)
Tests  578 passed (578)
```

Exit code: 0.

`bun run verify:full` was also attempted; it ran `verify` (green, as above) then failed fast at the `pretest:e2e` Chromium preflight — `[test:e2e] Playwright's Chromium browser is not installed`. This is the documented container limitation (`AGENTS.md` § Notes from previous agents — "Implementation containers do not ship a Chromium"), not a regression from this change. No E2E spec was added or changed by this ticket; the browser tier is exercised in CI and at INTEGRATION_QA.

TDD-RESULT: 578 passed, 0 failed
