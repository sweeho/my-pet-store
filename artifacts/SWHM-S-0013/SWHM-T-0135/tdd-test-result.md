---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0135
branch: vortex/feat/SWHM-T-0135-remove-items-from-the-cart-051a2417
upstream: [artifacts/SWHM-S-0013/SWHM-T-0135/PLAN.md]
---

# TDD result — SWHM-T-0135

## Test cases

| Test                                                                                                                                    | Covers       | Intent                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------- |
| `cart/cart.test.ts › CT-11: removeItem removes the line and leaves the remaining lines untouched`                                       | AC-1         | multi-line cart, only the targeted line is removed                  |
| `cart/cart.test.ts › CT-12: removing the only line leaves count 0, items empty and subtotal 0`                                          | AC-6         | last line removed leaves the exact empty-cart shape                 |
| `cart/cart.test.ts › CT-13: removing an item the cart does not hold is a no-op, not an error`                                           | AC-4         | delete matching zero rows doesn't throw and doesn't change the cart |
| `routes/api/cart/items/[itemId].delete.test.ts › DCR-01: removes the item and responds 200 with the resulting cart`                     | AC-5         | route delegates to `removeItem`, 200 + `Cart` body                  |
| `routes/api/cart/items/[itemId].delete.test.ts › DCR-02: removing the only line responds 200 with an empty cart`                        | AC-2, AC-6   | server-side half of "empty cart is handled"                         |
| `routes/api/cart/items/[itemId].delete.test.ts › DCR-03: removing an item the cart does not hold is a no-op, not an error`              | AC-4         | route surfaces the no-op, never 404                                 |
| `routes/api/cart/items/[itemId].delete.test.ts › DCR-04: a request with no bp_session cookie is accepted rather than rejected with 401` | design.md D3 | public route, same as the other cart routes                         |

## Red run

`bun --bun vitest run cart/cart.test.ts` — added CT-11/12/13 against `cart/cart.ts` before
`removeItem` existed:

```
FAIL |server| cart/cart.test.ts > CT-11/CT-12/CT-13
TypeError: removeItem is not a function
 Test Files  1 failed (1)
      Tests  3 failed | 10 passed (13)
```

`bun --bun vitest run "routes/api/cart/items/[itemId].delete.test.ts"` — run against a stub
handler that always threw `"not implemented"`, before restoring the real route:

```
FAIL |server| routes/api/cart/items/[itemId].delete.test.ts > DCR-01 .. DCR-04
Error: not implemented
 Test Files  1 failed (1)
      Tests  4 failed (4)
```

## Green run

After implementing `removeItem` in `cart/cart.ts` and the real
`routes/api/cart/items/[itemId].delete.ts` handler:

```
$ bun --bun vitest run cart/cart.test.ts
 Test Files  1 passed (1)
      Tests  13 passed (13)

$ bun --bun vitest run "routes/api/cart/items/[itemId].delete.test.ts"
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

Then `bun run verify` — this stack's full pre-commit gate (`eslint . --ext ts,tsx
--report-unused-disable-directives --max-warnings 0` + `tsc --build` + `NODE_ENV=test bun --bun
vitest run`), run against the whole repository:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  80 passed (80)
      Tests  461 passed (461)
```

`bun run verify:full` was attempted; lint, typecheck and the full 461-test unit suite all passed,
but its `pretest:e2e` preflight (`scripts/ensure-playwright-browser.mjs`) reported Chromium is
genuinely not installed in this container — fell back to `bun run verify` per the repository's
notes on implementation containers (F12). This ticket adds no page; the browser-tier journey is
SWHM-T-0142's, run at INTEGRATION_QA and in CI.

TDD-RESULT: 461 passed, 0 failed
