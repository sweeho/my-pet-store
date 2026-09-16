---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0140
branch: vortex/feat/SWHM-T-0140-checkout-seam-cart-to-order-line-items-12f11c7e
upstream: [artifacts/SWHM-S-0013/SWHM-T-0140/PLAN.md]
---

# TDD result — SWHM-T-0140

## Test cases

| Test                                                                                                                         | Covers | Intent                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `cart/checkout.test.ts › CO-01: maps every cart line to an order_line_item shape carrying itemid, quantity and unitPrice`    | AC-1   | mapping shape and field values for a multi-line cart                                   |
| `cart/checkout.test.ts › CO-02: lineNumber is assigned from 1 upward, contiguous, with no gaps and no repeats`               | AC-3   | line numbering matches the `(order_id, line_number)` key                               |
| `cart/checkout.test.ts › CO-03: unitPrice is the price captured at the time of the call, not a later read of item.unit_cost` | AC-2   | a catalogue price change after the call does not retroactively change the mapped price |
| `cart/checkout.test.ts › CO-04: toOrderLineItems on an empty cart returns an empty array rather than throwing`               | AC-4   | empty-cart edge case                                                                   |
| `cart/checkout.test.ts › CO-05: clearCartAfterOrder leaves the session's cart reporting a count of 0`                        | AC-5   | clear-after-order observable effect                                                    |
| `cart/checkout.test.ts › CO-06: clearCartAfterOrder on one session leaves another session's cart untouched`                  | AC-5   | clear is scoped to the session, not global                                             |

## Red run

`cart/checkout.ts` did not exist yet:

```
$ bun --bun vitest run cart/checkout.test.ts
Error: Cannot find module './checkout' imported from /workspace/repo/cart/checkout.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

## Green run

```
$ bun --bun vitest run cart/checkout.test.ts
 Test Files  1 passed (1)
      Tests  6 passed (6)
```

Then `bun run verify:full` — this stack's full pre-commit gate plus the browser tier:

```
$ bun run verify && bun run test:e2e
$ bun run lint && bun run typecheck && bun run test
 Test Files  83 passed (83)
      Tests  487 passed (487)

$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
error: script "pretest:e2e" exited with code 1
```

Chromium is genuinely not installed in this container (`AGENTS.md` § Notes from previous agents,
"Implementation containers do not ship a Chromium"). This ticket adds no `e2e/` spec and no
user-visible surface. Fell back to `bun run verify` alone, which is fully green:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  83 passed (83)
      Tests  487 passed (487)
```

487 = the pre-existing suite (SWHM-T-0134 through SWHM-T-0138 landed on this branch before it
forked) plus the 6 new `cart/checkout.test.ts` cases listed above.

TDD-RESULT: 487 passed, 0 failed
