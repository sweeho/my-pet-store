---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0014
ticket: SWHM-T-0158
branch: vortex/feat/SWHM-T-0158-cart-clearing-after-order-placement-f454c29a
upstream: [artifacts/SWHM-S-0014/SWHM-T-0158/PLAN.md]
---

# TDD result — SWHM-T-0158

## Test cases

| Test                                                     | Covers     | Intent                                                                                                                                                   |
| -------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `order/order.test.ts › CC-01`                            | AC-1       | a successful placement empties the session's cart (`count = 0`)                                                                                          |
| `order/order.test.ts › CC-02`                            | AC-5       | clearing one session's cart at placement leaves another session's cart untouched                                                                         |
| `order/order.test.ts › CC-03`                            | AC-2, AC-3 | when the order insert itself fails, no order is created and the cart is left exactly as it was                                                           |
| `order/order.test.ts › CC-04`                            | AC-2, AC-3 | when a line item insert fails, the order inserted moments before is rolled back too — no partial order, no orphaned line item, cart untouched            |
| `order/order.test.ts › CC-05`                            | AC-4       | the cart is cleared by calling `clearCartAfterOrder` (spied on `cart/checkout`), not a delete `order/` issues itself                                     |
| `order/order.test.ts › OT-01…OT-07` (updated)            | —          | pre-existing `placeOrder` behaviour, updated to the new 3-arg signature (`sessionId` added); regression cover that the order-row behaviour didn't change |
| `order/order.test.ts › LI-01…LI-06` (updated setup only) | —          | pre-existing `createLineItems` behaviour, unchanged; only their `placeOrder(...)` setup call gained the new required `sessionId` argument                |

`order/ issues no delete against cart_items of its own` (part of AC-4) is also verified by
inspection: `order/order.ts` does not import `cartItems` from `db/schema` at all, so it has no table
reference with which to issue one.

## Red run

`bun --bun vitest run order/order.test.ts`, run after extending the test file to the new
3-argument `placeOrder(userName, submission, sessionId)` call and the new cart-clearing
expectations, but before `order/order.ts` wired the transaction/line-items/clear:

```
FAIL |server| order/order.test.ts > placeOrder — cart clearing and transaction (SWHM-T-0158) > CC-01: a successful placement empties the session's cart
AssertionError: expected { items: [ ... 2 items ], count: 2, subtotal: 25 } to deeply equal { items: [], count: 0, subtotal: 0 }

FAIL |server| order/order.test.ts > ... > CC-02: clearing one session's cart at placement leaves another session's cart untouched
AssertionError: expected 1 to be +0

FAIL |server| order/order.test.ts > ... > CC-05: order/ issues no delete against cart_items of its own ...
AssertionError: expected 1 to be +0

Test Files  1 failed (1)
     Tests  3 failed | 15 passed (18)
```

(CC-03/CC-04 and the updated OT-_/LI-_ cases already passed at this point — the pre-existing
`placeOrder`/`createLineItems` behaviour was unaffected by the signature widening, and a rollback
test trivially holds when nothing is cleared yet. CC-01, CC-02 and CC-05 are the genuinely new
behaviour this ticket adds, and they are what failed.)

CC-05 itself was rewritten once during development: its first version asserted no `db.delete` call
ever targeted `cartItems`, which cannot distinguish `order/` deleting the rows itself from the
legitimate delegated delete inside `clearCartAfterOrder` — both hit the same table through the same
`db` singleton. Replaced with a spy on `cart/checkout`'s `clearCartAfterOrder` export directly (the
same `vi.spyOn` pattern `cart/cart.test.ts` and `admin/order-status.test.ts` already use for
transaction rollback), which does distinguish delegation from a direct delete.

## Green run

`bun run verify` — this stack's browser-free full gate (lint + typecheck + complete unit suite).
`bun run verify:full` was attempted first; its E2E tier stopped at the documented missing-Chromium
preflight (`.vortex/agents-generated.md` § "Implementation containers do not ship a Chromium"), so
`verify` is the evidence of record here per AGENTS.md § Test & validate.

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
✓ no errors
$ tsc --build
✓ no errors
$ NODE_ENV=test bun --bun vitest run
 Test Files  90 passed (90)
      Tests  563 passed (563)
```

`bun run test:e2e` preflight (attempted, not counted toward the marker below):

```
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
E2E tests need a real browser. ... Use `bun run verify` (lint + typecheck + test) instead.
```

TDD-RESULT: 563 passed, 0 failed
