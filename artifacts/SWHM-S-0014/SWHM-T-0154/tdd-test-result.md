---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0154
branch: vortex/feat/SWHM-T-0154-form-routing-and-validation-2dbf60fa
upstream: [artifacts/SWHM-S-0014/SWHM-T-0154/PLAN.md]
---

# TDD result — SWHM-T-0154

## Test cases

| Test                                                  | Covers     | Intent                                                                                                                                  |
| ----------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `order/validation.test.ts › OV-01`                    | AC-4       | a fully populated submission passes                                                                                                     |
| `order/validation.test.ts › OV-02-*` (9 cases)        | AC-2, AC-4 | each required field, missing, is rejected naming that field                                                                             |
| `order/validation.test.ts › OV-03`                    | AC-2       | a missing shipping field names the shipping section                                                                                     |
| `order/validation.test.ts › OV-04`                    | AC-4       | streetName2 (address line 2) is optional                                                                                                |
| `order/validation.test.ts › OV-05`                    | AC-3       | an invalid billing email is rejected                                                                                                    |
| `order/validation.test.ts › OV-06`                    | AC-3       | a valid email passes                                                                                                                    |
| `order/validation.test.ts › OV-07`                    | AC-4       | any non-empty state value passes (no vocabulary enforcement)                                                                            |
| `order/validation.test.ts › OV-08`                    | AC-4       | any non-empty country value passes (no vocabulary enforcement)                                                                          |
| `order/validation.test.ts › OV-09`                    | AC-4       | `OrderValidationError` carries the offending section and field                                                                          |
| `routes/api/order/index.post.test.ts › PO-01`         | AC-1       | an unauthenticated POST is refused 401 and creates nothing                                                                              |
| `routes/api/order/index.post.test.ts › PO-02`         | AC-2       | a missing required field is refused 400 naming the field                                                                                |
| `routes/api/order/index.post.test.ts › PO-03`         | AC-3       | an invalid email is refused 400                                                                                                         |
| `routes/api/order/index.post.test.ts › PO-04`         | AC-7       | a fully valid, signed-on submission passes through validation (not 400/401)                                                             |
| `src/pages/enter-order-information.test.tsx › EOI-13` | AC-7       | an accepted submission navigates to the placement path, not the error branch                                                            |
| `src/pages/enter-order-information.test.tsx › EOI-14` | AC-5, AC-6 | a refused submission shows exactly one form-level alert plus one field-level alert, and marks the offending input `aria-invalid="true"` |
| `src/pages/enter-order-information.test.tsx › EOI-15` | AC-5       | a refused submission leaves entered values intact                                                                                       |

## Red run

`bun --bun vitest run order/validation.test.ts routes/api/order/index.post.test.ts src/pages/enter-order-information.test.tsx`, run before `order/validation.ts` and `routes/api/order/index.post.ts` existed and before the page had submit handling:

```
FAIL  |server| order/validation.test.ts [ order/validation.test.ts ]
Error: Cannot find module './validation' imported from /workspace/repo/order/validation.test.ts

FAIL  |server| routes/api/order/index.post.test.ts [ routes/api/order/index.post.test.ts ]
Error: Cannot find module './index.post' imported from /workspace/repo/routes/api/order/index.post.test.ts

FAIL |client| src/pages/enter-order-information.test.tsx > submitting the order > EOI-13: an accepted submission reaches the placement path rather than the form's error branch
AssertionError: expected "vi.fn()" to be called with arguments: [ '/order-completed' ]
FAIL |client| ... > EOI-14: a refused submission shows one form-level alert and marks the offending field invalid with its own message
FAIL |client| ... > EOI-15: a refused submission leaves every entered value intact

Test Files  3 failed (3)
     Tests  3 failed | 12 passed (15)
```

## Green run

`bun run verify` — this stack's browser-free full gate (lint + typecheck + complete unit suite); `bun run verify:full` was attempted first and its E2E tier failed only on the documented missing-Chromium preflight (`.vortex/agents-generated.md` § "Implementation containers do not ship a Chromium"), so `verify` is the evidence of record here per AGENTS.md § Test & validate.

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
✓ no errors
$ tsc --build
✓ no errors
$ NODE_ENV=test bun --bun vitest run
 Test Files  86 passed (86)
      Tests  534 passed (534)
```

`bun run test:e2e` preflight (attempted, not counted toward the marker below):

```
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
E2E tests need a real browser. ... Use `bun run verify` (lint + typecheck + test) instead.
```

TDD-RESULT: 534 passed, 0 failed
