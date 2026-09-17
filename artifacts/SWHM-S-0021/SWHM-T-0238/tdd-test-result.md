---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0021
ticket: SWHM-T-0238
branch: vortex/feat/SWHM-T-0238-adminshell-on-the-shared-header-and-the-46ea1fe2
upstream: [artifacts/SWHM-S-0021/SWHM-T-0238/PLAN.md]
---

# TDD result — SWHM-T-0238

## Test cases

| Test                                                                                                                                                                     | Covers           | Intent                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `src/components/AdminShell.test.tsx › renders the administration header and the page content`                                                                            | AC-1             | AdminShell now mounts StoreHeader's admin variant and still renders its children                                           |
| `src/components/AdminShell.test.tsx › does not render a back link when backTo is omitted`                                                                                | AC-1             | `backTo`/`backLabel` contract preserved                                                                                    |
| `src/components/AdminShell.test.tsx › renders a back link to backTo, with the default label, when backTo is given`                                                       | AC-1             | `backTo`/`backLabel` contract preserved                                                                                    |
| `src/components/AdminShell.test.tsx › renders a back link with a custom backLabel when given`                                                                            | AC-1             | `backTo`/`backLabel` contract preserved                                                                                    |
| `src/components/AdminShell.test.tsx › AC-6: places the header before the back link and the content, in document order`                                                   | AC-6             | keyboard/DOM order: header precedes back-link and content                                                                  |
| `src/components/AdminShell.test.tsx › AC-7 / AC-8: the content frame takes the shared administration content width, not a width of its own`                              | AC-7, AC-8       | content frame and header both use `ADMIN_CONTENT_WIDTH`                                                                    |
| `src/components/RequireSignOn.test.tsx › AC-8: the pending state takes the shared administration content width, not a width of its own`                                  | AC-8             | pending state uses `ADMIN_CONTENT_WIDTH`, not a literal `672px`                                                            |
| `src/components/RequireAdmin.test.tsx › AC-8: the pending state takes the shared administration content width, not a width of its own`                                   | AC-8             | pending state uses `ADMIN_CONTENT_WIDTH`                                                                                   |
| `src/components/RequireAdmin.test.tsx › AC-8: the refusal state takes the shared administration content width, not a width of its own`                                   | AC-8             | refusal (`role="alert"`) state uses `ADMIN_CONTENT_WIDTH`                                                                  |
| `src/pages/admin/index.test.tsx › renders the title, description and all three actions`                                                                                  | AC-1             | page renders without its own session fetch                                                                                 |
| `src/pages/admin/index.test.tsx › F12: keeps its own Logout control alongside the header's Sign out`                                                                     | AC-10            | page-level Logout (F12) coexists with header's Sign out                                                                    |
| `src/pages/supplier/index.test.tsx › renders the heading, description and both controls`                                                                                 | AC-1             | page renders without its own session fetch                                                                                 |
| `src/pages/supplier/index.test.tsx › F12: keeps its own Logout control alongside the header's Sign out`                                                                  | AC-10            | page-level Logout (F12) coexists with header's Sign out                                                                    |
| `src/pages/admin/orders.test.tsx`, `orders-approval.test.tsx`, `reports/orders.test.tsx`, `reports/revenue.test.tsx`, `supplier/inventory.test.tsx` (all existing cases) | AC-1, AC-7, AC-8 | each screen still renders correctly through `AdminShell` once its own dead session effect and the `username` prop are gone |

Every existing case in the seven page test files and the two guard test files continues to assert
this ticket's Definition of Done; the rows above are the ones added or rewritten for this ticket.
The full inventory is each file itself, not restated here.

## Red run

`bun --bun vitest run src/pages/admin/index.test.tsx src/pages/admin/orders.test.tsx src/pages/admin/orders-approval.test.tsx src/pages/admin/reports/orders.test.tsx src/pages/admin/reports/revenue.test.tsx src/pages/supplier/index.test.tsx src/pages/supplier/inventory.test.tsx`

Run against the seven pages' _pre-existing_ test files (not yet updated for the new `AdminShell`),
after `AdminShell`/`RequireSignOn`/`RequireAdmin` and the seven pages had already been reduced to
consume `StoreHeader`. This proves the pages' own tests genuinely exercise the new shell rather than
passing by accident — `AdminShell` mounting `StoreHeader` means every one of these fixtures now
needs to answer `/api/cart` too, which the old fixtures did not mock:

```
FAIL  |client| src/pages/supplier/inventory.test.tsx > InventoryContent (/supplier/inventory) > IT-06: ...
Error: unexpected fetch: /api/cart
 ❯ src/components/StoreHeader.tsx:124:5
...
 Test Files  7 failed (7)
      Tests  39 failed | 5 passed (44)
```

## Green run

`bun run verify` — this stack's browser-free full gate (lint + typecheck + the complete unit suite,
`bun run lint && bun run typecheck && bun run test`). `bun run verify:full` was attempted first; its
E2E preflight (`node scripts/ensure-playwright-browser.mjs`) reports Chromium genuinely not
installed in this container (`AGENTS.md` § Notes from previous agents — implementation containers
do not ship one), so per that note this falls back to `verify` rather than retrying or installing a
browser. No `e2e/` spec references `AdminShell`, admin/supplier screens, or the route guards, so the
browser tier has no assertion of this ticket's own scope pending.

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  126 passed (126)
      Tests  879 passed (879)
```

TDD-RESULT: 879 passed, 0 failed
