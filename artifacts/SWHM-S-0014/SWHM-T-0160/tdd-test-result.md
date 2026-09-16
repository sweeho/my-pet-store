---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0160
branch: vortex/feat/SWHM-T-0160-confirmation-notification-the-promise-th-5a127dee
upstream: [artifacts/SWHM-S-0014/SWHM-T-0160/PLAN.md]
---

# TDD result — SWHM-T-0160

## Test cases

| Test                                                 | Covers                | Intent                                                                   |
| ---------------------------------------------------- | --------------------- | ------------------------------------------------------------------------ |
| `src/pages/order-completed.test.tsx › OC-06`         | AC-1, AC-2            | the exact scenario sentence renders with an email the test supplies      |
| `src/pages/order-completed.test.tsx › OC-07`         | AC-2                  | a different email is what gets interpolated, not a hard-coded one        |
| `src/pages/order-completed.test.tsx › OC-08`         | (regression)          | no confirmation e-mail message renders when there is no navigation state |
| `src/pages/order-completed.test.tsx › OC-01`–`OC-05` | (existing, unchanged) | order-id block and Continue Shopping control still render correctly      |

AC-3 ("no new dependency") has no test of its own — it is a property of the diff, not of
runtime behaviour. Verified by inspection: `git diff package.json` is empty, and the only new
import is `Mail` from `lucide-react`, already a dependency the project uses elsewhere (e.g. the
existing `Check` icon on this same page).

## Red run

`bun --bun vitest run src/pages/order-completed.test.tsx`, run against the pre-change page (the
implementation was stashed with `git stash push -- src/pages/order-completed.tsx` to produce a
real red before reapplying it):

```
FAIL  |client| src/pages/order-completed.test.tsx > OrderCompleted (/order-completed) > OC-06: tells the shopper a confirmation e-mail is coming, interpolating the address the order was placed with
FAIL  |client| src/pages/order-completed.test.tsx > OrderCompleted (/order-completed) > OC-07: a different email address is what gets interpolated, not a hard-coded one
TestingLibraryElementError: Unable to find an element with the text: (_, element) => ...

 Test Files  1 failed (1)
      Tests  2 failed | 6 passed (8)
```

## Green run

`bun run verify` — this stack's browser-free full gate (lint + typecheck + complete unit suite).
`bun run verify:full`'s E2E tier was attempted first and fails only on this container's missing
Chromium (`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed"),
matching AGENTS.md's "Implementation containers do not ship a Chromium" note — E2E runs at
CI/integration QA instead:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  90 passed (90)
      Tests  554 passed (554)
```

TDD-RESULT: 554 passed, 0 failed
