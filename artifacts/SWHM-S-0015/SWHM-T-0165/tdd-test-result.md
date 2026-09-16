---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0015
ticket: SWHM-T-0165
branch: vortex/fix/SWHM-T-0165-enter-order-information-tsx-doesn-t-pass-07b16c42
upstream:
  [
    artifacts/SWHM-S-0015/SWHM-T-0165/PLAN.md,
    openspec/changes/swhm-s-0015-bugfix-swhm-t-0165-swhm-t-01/design.md,
  ]
---

# TDD result — SWHM-T-0165

## Test cases

| Test                                        | Covers     | Intent                                                                                                               |
| ------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `enter-order-information.test.tsx › EOI-13` | AC-1, AC-2 | accepted submission navigates to `/order-completed` with `{ state: { orderId, email } }` from the placement response |
| `order-completed.test.tsx › OC-01`          | AC-1       | order-id group renders when navigation state is present                                                              |
| `order-completed.test.tsx › OC-03`          | AC-1       | a different order id (2042) renders correctly — not a hard-coded 1005                                                |
| `order-completed.test.tsx › OC-06`, `OC-07` | AC-2       | confirmation copy interpolates the billing email from state, not a fixed address                                     |
| `order-completed.test.tsx › OC-05`          | AC-3       | no order-id group when no navigation state is present                                                                |
| `order-completed.test.tsx › OC-08`          | AC-3       | no confirmation-email line when no navigation state is present                                                       |

All six are pre-existing assertions on this branch (from SWHM-S-0014 / commit `5d0bb64`); this
ticket added none, since `design.md § D1` and the PLAN's Step 5 fallback only call for a new or
repaired assertion if a criterion fails, and none did.

## Red run

The code under test (`handleSubmit`'s success-path `navigate` call in
`src/pages/enter-order-information.tsx`) is already correct, so there is no natural red state on
this branch. To prove EOI-13 actually catches the defect this ticket describes, the line was
temporarily reduced to reproduce it:

```diff
- navigate("/order-completed", { state: { orderId: result.orderId, email: result.email } });
+ navigate("/order-completed");
```

`NODE_ENV=test bun --bun vitest run src/pages/enter-order-information.test.tsx -t "EOI-13"`:

```
 FAIL  |client| src/pages/enter-order-information.test.tsx > EnterOrderInformation (/enter-order-information) > submitting the order > EOI-13: an accepted submission reaches the placement path rather than the form's error branch, carrying the order id and email forward
AssertionError: expected "vi.fn()" to be called with arguments: [ '/order-completed', …(1) ]

Received:

  1st vi.fn() call:

  [
    "/order-completed",
-   {
-     "state": {
-       "email": "maya.chen@example.com",
-       "orderId": 1005,
-     },
-   },
  ]

Number of calls: 1

 Test Files  1 failed (1)
      Tests  1 failed | 15 skipped (16)
```

The file was then restored to its original content — confirmed via `git diff
src/pages/enter-order-information.tsx` showing no diff — before any other step.

## Green run

`bun run verify` (lint + typecheck + full unit suite), against the real, unmutated code:

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  91 passed (91)
      Tests  577 passed (577)
```

`bun run test:e2e` was attempted and its preflight reported Chromium genuinely absent in this
container (`ensure-playwright-browser.mjs`), consistent with `AGENTS.md` § Notes from previous
agents for implementation containers. Falling back to `bun run verify` per that documented policy.
The browser tier was already observed green on this sprint branch in CI run `35138625151` (37/37
E2E tests, including `e2e/order.spec.ts`), per `design.md § D1`.

TDD-RESULT: 577 passed, 0 failed
