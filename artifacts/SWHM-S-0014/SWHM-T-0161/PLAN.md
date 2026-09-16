---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0014
ticket: SWHM-T-0161
idea: SWHM-I-0008
change: swhm-i-0008-order-submission-checkout
branch: vortex/sprint/swhm-s-0014-61fcd4b6
upstream:
  [
    openspec/changes/swhm-i-0008-order-submission-checkout/design.md,
    artifacts/SWHM-S-0014/SWHM-T-0158/PLAN.md,
  ]
---

# PLAN — SWHM-T-0161: Empty cart refuses order placement

## Objective

Stop an order being placed from an empty cart, tell the shopper why, and send them back to the cart.

## Steps

1. **The error class.** design.md § Spec discrepancies S5: the specification names a Java exception type; here it is an error class the route maps to a status code, exactly as `order/validation.ts` already does. Name it `ShoppingCartEmptyOrderError` so the criterion stays traceable to the requirement it came from. If it reads better beside the existing error class in `order/validation.ts` than in a new `order/errors.ts`, put it there and say which you chose in your work log.
2. **Check before any write.** The emptiness check runs first, so a refusal leaves `orders` and `order_line_item` untouched. The transaction SWHM-T-0158 added already guarantees that; checking first makes it cheap rather than relying on a rollback.
3. Read the cart through `getCart` from `cart/cart.ts` and test `count` — count is derived on read, so an empty cart is `count === 0` with no separate emptiness flag to consult.
4. **Map it in the route** to an error response, alongside the 401 and 400 branches already there.
5. **Send the shopper to `/cart`** from the order form when that response comes back, and show the message the specification fixes on arrival: "Your shopping cart is empty. Please add items before ordering." The cart page already has an empty state; this message is a distinct thing — it says why the shopper arrived, not merely that the cart is empty — so render it as its own alert rather than by rewording the existing empty-state copy.
6. Tests: the refusal and its response in `routes/api/order/index.post.test.ts`; nothing written, in `order/order.test.ts`; the navigation in `src/pages/enter-order-information.test.tsx`; the message on arrival in `src/pages/cart.test.tsx`.

## Scope boundary

Do not change the cart's own empty state, its copy or its Browse the catalog action — `src/pages/cart.tsx` is yours only for adding this message.

## File/module ownership

Create or modify only: `order/errors.ts`, `order/errors.test.ts`, `order/order.ts`, `order/order.test.ts`, `routes/api/order/index.post.ts`, `routes/api/order/index.post.test.ts`, `src/pages/enter-order-information.tsx`, `src/pages/enter-order-information.test.tsx`, `src/pages/cart.tsx`, `src/pages/cart.test.tsx`.

Nothing else. `cart/cart.ts` is imported, never edited.

## Design reference

No mockup covers this state. Build the message with the form-level alert pattern DESIGN.md § Form validation states describes, on the cart page.

## Definition of Done

AC-1 through AC-6 on the ticket.
