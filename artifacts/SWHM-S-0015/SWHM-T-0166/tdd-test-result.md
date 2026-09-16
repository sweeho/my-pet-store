---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0015
ticket: SWHM-T-0166
branch: vortex/fix/SWHM-T-0166-accepted-gate-bypass-on-swhm-t-0162-orde-1d50067d
upstream:
  [
    artifacts/SWHM-S-0015/SWHM-T-0166/PLAN.md,
    openspec/changes/swhm-s-0015-bugfix-swhm-t-0165-swhm-t-01/design.md,
  ]
---

# TDD result — SWHM-T-0166

## Test cases

| Test                                                     | Covers | Intent                                                                                        |
| -------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `e2e/order.spec.ts:126` (line 140, `firstIdBlock`)       | AC-1   | confirmation screen's order-id group accessible name ends in the numeric id of that placement |
| `e2e/order.spec.ts:126` (line 141)                       | AC-2   | shopper's billing email is visible on the confirmation screen                                 |
| `e2e/order.spec.ts:126` (lines 154-159, `secondOrderId`) | AC-3   | a second order placed later confirms with a higher, non-repeated identifier                   |

All three are pre-existing assertions on this branch, unchanged since they were authored. This
ticket added none: PLAN.md Step 4 calls for closing with no diff when every criterion already
holds, and all three do.

## Red run

There is no red state to produce on this branch: SWHM-T-0165 (this ticket's dependency) already
verified the underlying fault is fixed (commit `5d0bb64`, SWHM-S-0014), and its own red/green proof
(temporarily reverting `enter-order-information.tsx`'s `navigate` call and observing
`EOI-13` fail) is the regression evidence for the shared fault both tickets describe. That proof is
recorded in `artifacts/SWHM-S-0015/SWHM-T-0165/tdd-test-result.md` and is not repeated here per
`design.md § D4` (splitting the criteria by tier so neither ticket's verdict depends on evidence the
other owns, without re-deriving it).

For this ticket's own tier (the browser), Chromium is genuinely absent in this container:

```
$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).

E2E tests need a real browser. Either:
  - install it:  bun x playwright install chromium
  - or skip E2E here — in the agent workflow, E2E runs in the QA phase
    (browser-equipped container) and in CI, not in engineer containers.
    Use `bun run verify` (lint + typecheck + test) instead.
```

Per `AGENTS.md` § Notes from previous agents and `design.md § D1`, this is expected and not
retried. The browser-tier assertions were already observed running (and passing) in a real
Chromium in **CI run `35138625151` on this sprint branch: 37 of 37 E2E tests green**, including
`e2e/order.spec.ts:126`.

## Green run

`bun run verify` (lint + typecheck + full unit suite) on this branch:

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  91 passed (91)
      Tests  577 passed (577)
```

`bun run test:e2e` was attempted; its preflight reports Chromium genuinely absent in this
container (above), consistent with the documented policy for implementation containers. Falling
back to `bun run verify` and to CI run `35138625151`'s already-observed 37/37 E2E pass (including
`e2e/order.spec.ts:126`) for the browser tier this ticket is responsible for.

TDD-RESULT: 577 passed, 0 failed
