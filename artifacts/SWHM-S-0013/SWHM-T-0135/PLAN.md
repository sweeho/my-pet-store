---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0013
ticket: SWHM-T-0135
idea: SWHM-I-0007
branch: vortex/sprint/swhm-s-0013-b8e5db3c
upstream:
  [
    openspec/changes/swhm-i-0007-shopping-cart-management/design.md,
    artifacts/SWHM-S-0013/SWHM-T-0134/PLAN.md,
  ]
---

# PLAN — SWHM-T-0135: Remove items from the cart

## Objective

Remove a single line from the cart, and expose it as an endpoint.

## Steps

1. Append `removeItem(sessionId, itemId)` to `cart/cart.ts`: delete the row through `cart/repository.ts` and return `getCart(sessionId)`. Returning the resulting cart rather than void is what lets the screen render a response without a second round trip.
2. Removing an item the cart does not hold is a no-op, not an error. The delete matches zero rows; do not probe first and do not throw.
3. Add `routes/api/cart/items/[itemId].delete.ts`, following the dynamic-route form in `routes/api/catalog/items/[itemId].get.ts` and the handler shape in § Codebase findings F7.
4. Tests: extend `cart/cart.test.ts` with removal from a multi-line cart, removal of the only line, and removal of an absent item. Add the route test beside the route.

## Note on this group's second scenario

"Empty cart is handled" asserts both that the cart is empty **and** that it displays "Your Shopping Cart is Empty." The server half is observable here — `count` 0, `items` empty, `subtotal` 0 — and is what this ticket proves. The rendered message belongs to `src/pages/cart.tsx`, which is SWHM-T-0138's file; do not create or edit that page here. SWHM-T-0142's browser spec covers the two halves together.

## File/module ownership

Create or modify only: `cart/cart.ts`, `cart/cart.test.ts`, `routes/api/cart/items/[itemId].delete.ts`, `routes/api/cart/items/[itemId].delete.test.ts`.

Nothing else. SWHM-T-0134's `getCart` and `addItem` are landed — call them; add to the file, do not restructure it.

## Design reference

`artifacts/SWHM-S-0013/design/mockup-shopping-cart-populated.html` shows the per-row "Remove" control this endpoint serves, and `mockup-shopping-cart-empty.html` shows the state a cart reaches when its last line goes. Both are rendered by SWHM-T-0138, not here.

## Definition of Done

AC-1 through AC-7 on the ticket. AC-1 and AC-2 are the delta spec's scenarios verbatim; AC-3 and AC-5 are fixed interface contracts SWHM-T-0139 codes against.
