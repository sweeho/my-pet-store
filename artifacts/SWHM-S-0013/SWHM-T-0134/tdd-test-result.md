---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0134
branch: vortex/feat/SWHM-T-0134-add-items-to-the-cart-ff5e6fa0
upstream: [artifacts/SWHM-S-0013/SWHM-T-0134/PLAN.md]
---

# TDD result — SWHM-T-0134

## Test cases

| Test                                                                                                                                 | Covers      | Intent                                              |
| ------------------------------------------------------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------- |
| `cart/cart.test.ts › CT-01: addItem with a specified quantity adds that many units`                                                  | AC-1        | 3 units added for a fresh item                      |
| `cart/cart.test.ts › CT-02: addItem with no quantity argument defaults to 1, identically to passing 1`                               | AC-2, AC-6  | omitted quantity behaves exactly like an explicit 1 |
| `cart/cart.test.ts › CT-03: adding a duplicate item raises the quantity rather than adding a second line`                            | AC-3        | second add on the same item sums into one line      |
| `cart/cart.test.ts › CT-04: subtotal for a single item is unitCost times quantity`                                                   | AC-4        | single-line subtotal                                |
| `cart/cart.test.ts › CT-05: subtotal for multiple items is the sum of each line total`                                               | AC-5        | multi-line subtotal                                 |
| `cart/cart.test.ts › CT-06: count is the number of distinct lines, not the sum of quantities`                                        | AC-9        | count is line count, not unit count                 |
| `cart/cart.test.ts › CT-07: addItem rejects an item id the catalogue has no item for`                                                | AC-6        | unknown item id throws `UnknownItemError`           |
| `cart/cart.test.ts › CT-08: getCart on a session with no rows returns an empty cart`                                                 | AC-6        | empty-cart shape                                    |
| `cart/cart.test.ts › CT-09: a cart line's unitCost is item.unit_cost, never item.list_price`                                         | AC-7        | S1 — priced off `unit_cost`, not `list_price`       |
| `cart/cart.test.ts › CT-10: getCart is scoped to the session — another session's cart is unaffected`                                 | AC-6        | per-session isolation at the `cart/cart.ts` layer   |
| `routes/api/cart/index.get.test.ts › CGR-01: a request with no bp_session cookie still receives a 200 cart, never 401 or a redirect` | AC-8, AC-10 | GET is public                                       |
| `routes/api/cart/index.get.test.ts › CGR-02: reflects an item added on the same session via POST`                                    | AC-8        | GET/POST round-trip on one session                  |
| `routes/api/cart/index.post.test.ts › CPR-01: adds the specified quantity and responds 200 with the resulting cart`                  | AC-1, AC-8  | POST 200 + resulting `Cart` body                    |
| `routes/api/cart/index.post.test.ts › CPR-02: defaults quantity to 1 when omitted`                                                   | AC-2, AC-8  | POST with no `quantity` field                       |
| `routes/api/cart/index.post.test.ts › CPR-03: responds 400 with an error body when itemId names no item in the catalogue`            | AC-8        | POST 400 `{ error }`                                |
| `routes/api/cart/index.post.test.ts › CPR-04: a request with no bp_session cookie is accepted rather than rejected with 401`         | AC-10       | POST is public                                      |
| `src/pages/catalog/item/[itemId].test.tsx › PT-09: renders a quantity field defaulting to 1 and an Add to Cart control`              | AC-11       | the new control exists with the right default       |
| `src/pages/catalog/item/[itemId].test.tsx › PT-10: activating Add to Cart posts the item id and the entered quantity to /api/cart`   | AC-11       | activating the control adds the entered quantity    |

## Red run

Each new file was run against its test before the corresponding implementation existed.

`cart/cart.ts` (module did not exist yet):

```
$ bun --bun vitest run cart/cart.test.ts
Error: Cannot find module './cart' imported from /workspace/repo/cart/cart.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

`routes/api/cart/index.get.ts` and `index.post.ts` (both route files moved aside, test files
written first):

```
$ bun --bun vitest run routes/api/cart/
Error: Cannot find module './index.get' imported from /workspace/repo/routes/api/cart/index.get.test.ts
Error: Cannot find module './index.post' imported from /workspace/repo/routes/api/cart/index.post.test.ts
 Test Files  2 failed (2)
      Tests  no tests
```

`src/pages/catalog/item/[itemId].tsx` (PT-09/PT-10 added against the pre-existing screen, before
the quantity field and Add to Cart control were added):

```
$ bun --bun vitest run "src/pages/catalog/item/[itemId].test.tsx"
TestingLibraryElementError: Unable to find a label with the text of: Quantity
 Test Files  1 failed (1)
      Tests  2 failed | 8 passed (10)
```

## Green run

```
$ bun --bun vitest run cart/cart.test.ts
 Test Files  1 passed (1)
      Tests  10 passed (10)

$ bun --bun vitest run routes/api/cart/
 Test Files  2 passed (2)
      Tests  6 passed (6)

$ bun --bun vitest run "src/pages/catalog/item/[itemId].test.tsx"
 Test Files  1 passed (1)
      Tests  10 passed (10)
```

Then `bun run verify:full` — this stack's full pre-commit gate plus the browser tier:

```
$ bun run verify && bun run test:e2e
$ bun run lint && bun run typecheck && bun run test
 Test Files  79 passed (79)
      Tests  454 passed (454)

$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
error: script "pretest:e2e" exited with code 1
```

Chromium is genuinely not installed in this container (documented in `AGENTS.md` § Notes from
previous agents, "Implementation containers do not ship a Chromium" — F12/F12-adjacent). This
ticket adds no `e2e/` spec. Fell back to `bun run verify` alone, which is fully green:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  79 passed (79)
      Tests  454 passed (454)
```

454 = the 436 passing at SWHM-T-0133 plus the 18 new tests listed above.

TDD-RESULT: 454 passed, 0 failed
