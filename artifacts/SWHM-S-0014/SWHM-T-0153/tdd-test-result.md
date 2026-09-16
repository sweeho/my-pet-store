---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0153
branch: vortex/feat/SWHM-T-0153-order-information-form-data-model-and-mo-89f5de68
upstream: [artifacts/SWHM-S-0014/SWHM-T-0153/PLAN.md]
---

# TDD result — SWHM-T-0153

## Test cases

| Test                                                  | Covers                                      | Intent                                                                            |
| ----------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/pages/enter-order-information.test.tsx › EOI-01` | AC-1                                        | both sections render as named regions                                             |
| `src/pages/enter-order-information.test.tsx › EOI-02` | AC-1                                        | Billing Information shows all 10 fields                                           |
| `src/pages/enter-order-information.test.tsx › EOI-03` | AC-2                                        | Shipping Information shows the same 10 fields                                     |
| `src/pages/enter-order-information.test.tsx › EOI-04` | AC-3                                        | state dropdown offers exactly California, New York, Texas in both sections        |
| `src/pages/enter-order-information.test.tsx › EOI-05` | AC-4                                        | country dropdown offers exactly USA, Canada, Japan, China in both sections        |
| `src/pages/enter-order-information.test.tsx › EOI-06` | AC-5                                        | first/last name carry maxlength=30 in both sections                               |
| `src/pages/enter-order-information.test.tsx › EOI-07` | AC-6                                        | street1/street2 carry maxlength=70 in both sections                               |
| `src/pages/enter-order-information.test.tsx › EOI-08` | requirement (form field length constraints) | city/zip/phone/email carry the mockup's other maxlength values                    |
| `src/pages/enter-order-information.test.tsx › EOI-09` | requirement (field holds what is typed)     | typing into a field updates its value                                             |
| `src/pages/enter-order-information.test.tsx › EOI-10` | requirement (order summary reads the cart)  | a `role=status` indicator shows while `/api/cart` is outstanding                  |
| `src/pages/enter-order-information.test.tsx › EOI-11` | requirement (order summary reads the cart)  | the summary renders the cart's items and totals once loaded                       |
| `src/pages/enter-order-information.test.tsx › EOI-12` | AC-9 (screen renders, gated)                | Return to Cart links back to `/cart`                                              |
| `src/pages/cart.test.tsx › CPT-12`                    | AC-10                                       | `/cart` shows a Proceed to Checkout control linking to `/enter-order-information` |

`order/types.ts` (AC-8) and the `orders`/`order_line_item` migration (AC-7) carry no dedicated test
of their own — a type has no runtime behaviour to assert, and the migration's shape is proven by
`bun run db:generate` producing the additive `ALTER TABLE ... ADD` statements committed under
`drizzle/0008_sour_thanos.sql`. AC-9's registration is proven by `order/types.ts` type-checking as
part of the `## Green run` gate below, which runs `tsc --build` across `tsconfig.node.json`'s
`include` list.

## Red run

`bun --bun vitest run src/pages/enter-order-information.test.tsx src/pages/cart.test.tsx` (before
`src/pages/enter-order-information.tsx` and the cart control existed):

```
FAIL  |client| src/pages/enter-order-information.test.tsx [ src/pages/enter-order-information.test.tsx ]
Error: Failed to resolve import "./enter-order-information" from "src/pages/enter-order-information.test.tsx". Does the file exist?

 ❯ src/pages/cart.test.tsx (12 tests | 1 failed)
   × CPT-12: a populated cart shows a control that navigates to /enter-order-information
     TestingLibraryElementError: Unable to find an accessible element with the role "link" and name "Proceed to Checkout"

 Test Files  2 failed (2)
      Tests  1 failed | 11 passed (12)
```

## Green run

`bun run verify` — this stack's browser-free full gate (lint + typecheck + complete unit suite);
`verify:full`'s E2E tier was attempted first and fails only on the container's missing Chromium
(`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed"), which
AGENTS.md's "Implementation containers do not ship a Chromium" note says to expect and fall back
from — E2E runs at CI/integration QA instead:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  84 passed (84)
      Tests  510 passed (510)
```

TDD-RESULT: 510 passed, 0 failed
