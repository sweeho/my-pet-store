---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0135
branch: vortex/feat/SWHM-T-0135-remove-items-from-the-cart-051a2417
upstream: [artifacts/SWHM-S-0013/SWHM-T-0135/PLAN.md]
downstream: [artifacts/SWHM-S-0013/SWHM-T-0138/PLAN.md, artifacts/SWHM-S-0013/SWHM-T-0139/PLAN.md]
---

# Summary — SWHM-T-0135: Remove items from the cart

## What changed

Appended `removeItem(sessionId, itemId): Cart` to `cart/cart.ts`: deletes the row through
`cart/repository.ts`'s `deleteCartRow` and returns `getCart(sessionId)`, so the caller gets the
resulting cart without a second round trip. Removing an item the cart does not hold matches zero
rows and is a no-op — no probe-then-throw. Added `DELETE /api/cart/items/{itemId}`, following the
dynamic-route form of `routes/api/catalog/items/[itemId].get.ts` and the session handling of
`routes/api/cart/index.post.ts` (public, no `j_signon` check, design.md D3).

## Files

- `cart/cart.ts` — added `removeItem`.
- `cart/cart.test.ts` — added CT-11/12/13: multi-line removal, removing the only line, removing an absent item.
- `routes/api/cart/items/[itemId].delete.ts` — new: `DELETE /api/cart/items/:itemId`.
- `routes/api/cart/items/[itemId].delete.test.ts` — new: DCR-01..04.

## AC coverage

- AC-1 ("item 1001 removed, 2 remaining items") — `CT-11` (multi-line removal, remaining lines untouched).
- AC-2 ("empty cart is handled", server half) — `DCR-02`; the rendered "Your Shopping Cart is Empty." message is SWHM-T-0138's page, not built here.
- AC-3 (fixed `removeItem` signature) — `cart/cart.ts`.
- AC-4 (removing an absent item is a no-op) — `CT-13`, `DCR-03`.
- AC-5 (fixed `DELETE /api/cart/items/{itemId}` → 200 + `Cart`) — `routes/api/cart/items/[itemId].delete.ts`; `DCR-01`.
- AC-6 (removing the only line → `count` 0, `items` empty, `subtotal` 0) — `CT-12`, `DCR-02`.
- AC-7 (assertions in `cart/cart.test.ts` and the route test pass) — see `tdd-test-result.md`, `TDD-RESULT: 461 passed, 0 failed`.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  80 passed (80)
      Tests  461 passed (461)
```

Full detail (including the red→green proof for this ticket's 7 new tests) in
`tdd-test-result.md`. `bun run verify:full`'s E2E tier could not run in this container (Chromium
genuinely not installed, per the repository's implementation-container notes); this ticket adds no
page. E2E runs at INTEGRATION_QA and in CI.

## Notes

- No page or UI control added — the mockups' per-row "Remove" control is rendered and wired by
  SWHM-T-0138/SWHM-T-0139, which call this endpoint.
