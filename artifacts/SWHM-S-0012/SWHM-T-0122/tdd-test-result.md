---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0122
branch: vortex/feat/SWHM-T-0122-orders-view-read-only-orders-table-6a2b7395
upstream: [artifacts/SWHM-S-0012/SWHM-T-0122/PLAN.md]
---

# TDD result — SWHM-T-0122

## Test cases

| Test                                       | Covers                         | Intent                                                                                           |
| ------------------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `src/components/ui/table.test.tsx › TB-01` | AC-1, AC-2                     | the primitive composes into a real semantic `<table>`/`<th>`/`<td>` structure, checkable by role |
| `src/components/ui/table.test.tsx › TB-02` | — (primitive contract)         | a caller's `className` on `Table` merges last, overriding a conflicting built-in utility         |
| `src/pages/admin/orders.test.tsx › OV-01`  | AC-1, AC-4                     | requests `status=APPROVED\|COMPLETED\|DENIED` in one request                                     |
| `src/pages/admin/orders.test.tsx › OV-02`  | — (Loading states)             | a pending indicator shows while the fetch is outstanding, heading still rendered                 |
| `src/pages/admin/orders.test.tsx › OV-03`  | AC-2                           | the five column headers render in order                                                          |
| `src/pages/admin/orders.test.tsx › OV-04`  | AC-2                           | a row's date renders `MM/DD/YYYY`, amount renders `$1,240.00`                                    |
| `src/pages/admin/orders.test.tsx › OV-05`  | — (PLAN.md Gotchas)            | the count line reflects rows actually rendered                                                   |
| `src/pages/admin/orders.test.tsx › OV-06`  | — (Unavailable content states) | an empty result shows a named state in place of the table                                        |
| `src/pages/admin/orders.test.tsx › OV-07`  | AC-3                           | the rendered table contains no `textbox`/`combobox`/`button`/`checkbox` role anywhere            |

AC-1 ("orders SHALL show approved, completed, and denied ... columns for ID, User, Date, Amount,
Status") is split across OV-01 (status filter) and OV-03 (columns). AC-3 ("model SHALL return false
for all rows and columns") has no model in a browser; its observable replacement — no interactive
control anywhere in the table — is OV-07 (PLAN.md's Definition of Done, S6).

## Red run

`bun --bun vitest run src/components/ui/table.test.tsx` before `table.tsx` existed:

```
FAIL |client| src/components/ui/table.test.tsx [ src/components/ui/table.test.tsx ]
Error: Failed to resolve import "./table" from "src/components/ui/table.test.tsx"
Test Files  1 failed (1)
     Tests  no tests
```

`bun --bun vitest run src/pages/admin/orders.test.tsx` before `orders.tsx` existed:

```
FAIL |client| src/pages/admin/orders.test.tsx [ src/pages/admin/orders.test.tsx ]
Error: Failed to resolve import "./orders" from "src/pages/admin/orders.test.tsx"
Test Files  1 failed (1)
     Tests  no tests
```

## Green run

`bun run verify` (lint + typecheck + full unit suite — the project's declared `verify` gate):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(no errors)
$ tsc --build
(no errors)
$ NODE_ENV=test bun --bun vitest run
 Test Files  66 passed (66)
      Tests  382 passed (382)
```

`bun run test:e2e` (part of `verify:full`) fails only at the Chromium preflight —
`scripts/ensure-playwright-browser.mjs` reports Chromium is genuinely not installed in this
implementation container (AGENTS.md § Notes from previous agents: known gap for implementation
containers). Not retried; `e2e/admin.spec.ts` is committed and will be observed by CI and at
INTEGRATION_QA, which do have Chromium.

TDD-RESULT: 382 passed, 0 failed
