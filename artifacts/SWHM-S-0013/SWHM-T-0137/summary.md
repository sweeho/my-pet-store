---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0137
branch: vortex/feat/SWHM-T-0137-clear-the-cart-4af38e5f
upstream: [artifacts/SWHM-S-0013/SWHM-T-0137/PLAN.md]
downstream: [artifacts/SWHM-S-0013/SWHM-T-0140/PLAN.md, artifacts/SWHM-S-0013/SWHM-T-0141/PLAN.md]
---

# Summary — SWHM-T-0137: Clear the cart

## What changed

Appended `clearCart(sessionId): void` to `cart/cart.ts`, delegating to `cart/repository.ts`'s
`deleteAllCartRows`. No route and no page — nothing a shopper does empties a whole cart in one
step; the two real callers (the order-placement seam and logout) are server-side and out of scope
here (design.md S8, D4). This lands the shared function ahead of both of its callers so neither
one defines it and stamps its own assumptions on it.

## Files

- `cart/cart.ts` — added `clearCart`.
- `cart/cart.test.ts` — added CC-01/02/03: full clear, session isolation, clearing an already-empty cart.

## AC coverage

- AC-1 (cart is empty after clearing, `count = 0`) — `CC-01`.
- AC-2 (fixed `clearCart(sessionId): void` signature) — `cart/cart.ts`.
- AC-3 (empty `items`, `subtotal` 0 after clearing) — `CC-01`.
- AC-4 (only the named session's rows are removed) — `CC-02`.
- AC-5 (clearing an empty cart does not throw) — `CC-03`.
- AC-6 (assertions in `cart/cart.test.ts` pass) — see `tdd-test-result.md`, `TDD-RESULT: 481 passed, 0 failed`.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  82 passed (82)
      Tests  481 passed (481)
```

Full detail (including the red→green proof for this ticket's 3 new tests) in
`tdd-test-result.md`. `bun run verify:full`'s E2E tier could not run in this container (Chromium
genuinely not installed, per the repository's implementation-container notes); this ticket has no
browser-tier surface.

## Notes

- No order-creation function, order route or order page was built — order creation belongs to
  `swhm-i-0008-order-submission-checkout` (scope boundary in `PLAN.md`).
- Did not touch `auth/session.ts` or the logout route — those are SWHM-T-0141's, which will call
  `clearCart` once it lands.
