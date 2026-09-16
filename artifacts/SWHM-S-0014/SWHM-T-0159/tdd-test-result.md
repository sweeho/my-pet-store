---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0159
branch: vortex/feat/SWHM-T-0159-order-confirmation-screen-dcc10bdf
upstream: [artifacts/SWHM-S-0014/SWHM-T-0159/PLAN.md]
---

# TDD result — SWHM-T-0159

## Test cases

| Test                                         | Covers | Intent                                                                                                                                 |
| -------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/order-completed.test.tsx › OC-01` | AC-1   | the order-id label and number compose into one accessible group naming "Your order Id is 1005", per design.md § Spec discrepancies S13 |
| `src/pages/order-completed.test.tsx › OC-02` | AC-4   | the label and the number still render as two separate visual elements, matching the mockup                                             |
| `src/pages/order-completed.test.tsx › OC-03` | AC-1   | the id is read from state, not hard-coded — a different order id renders correctly                                                     |
| `src/pages/order-completed.test.tsx › OC-04` | AC-4   | the Continue Shopping control links to `/catalog`                                                                                      |
| `src/pages/order-completed.test.tsx › OC-05` | AC-5   | the screen renders without crashing and without the id block when no navigation state is present (no fetch fallback)                   |
| `auth/protected-resources.test.ts › PR-01`   | AC-3   | `/order-completed` is a protected resource                                                                                             |
| `auth/protected-resources.test.ts › PR-02`   | AC-3   | the new entry carries no role requirement                                                                                              |

AC-2 (the "confirmation e-mail soon" line) is not built by this ticket — PLAN.md's scope boundary and `SWHM-T-0160`'s own `PLAN.md` step 1 both assign that line to `SWHM-T-0160`, which depends on this ticket. See `summary.md` § Notes.

## Red run

`bun --bun vitest run auth/protected-resources.test.ts src/pages/order-completed.test.tsx`, run before `src/pages/order-completed.tsx` existed and before the new `PROTECTED_RESOURCES` entry was added:

```
FAIL |client| src/pages/order-completed.test.tsx
Error: Failed to resolve import "./order-completed" from "src/pages/order-completed.test.tsx". Does the file exist?

FAIL |server| auth/protected-resources.test.ts > PR-01: /order-completed is a protected resource
AssertionError: expected false to be true

FAIL |server| auth/protected-resources.test.ts > PR-02: /order-completed carries no role requirement
AssertionError: expected undefined to be defined

Test Files  2 failed (2)
     Tests  2 failed (2)
```

## Green run

`bun run verify` — this stack's browser-free full gate (lint + typecheck + complete unit suite). `bun run verify:full` was attempted first; its E2E tier stopped at the documented missing-Chromium preflight (`.vortex/agents-generated.md` § "Implementation containers do not ship a Chromium"), so `verify` is the evidence of record here per AGENTS.md § Test & validate.

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
✓ no errors
$ tsc --build
✓ no errors
$ NODE_ENV=test bun --bun vitest run
 Test Files  89 passed (89)
      Tests  544 passed (544)
```

`bun run test:e2e` preflight (attempted, not counted toward the marker below):

```
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
E2E tests need a real browser. ... Use `bun run verify` (lint + typecheck + test) instead.
```

TDD-RESULT: 544 passed, 0 failed
