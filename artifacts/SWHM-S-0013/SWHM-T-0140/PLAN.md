---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0013
ticket: SWHM-T-0140
idea: SWHM-I-0007
branch: vortex/sprint/swhm-s-0013-b8e5db3c
upstream:
  [
    openspec/changes/swhm-i-0007-shopping-cart-management/design.md,
    artifacts/SWHM-S-0013/SWHM-T-0137/PLAN.md,
  ]
---

# PLAN — SWHM-T-0140: Checkout seam — cart to order line items

## Objective

Build the seam `swhm-i-0008-order-submission-checkout` will call at order placement: the cart-to-line-item mapping and the clear that follows. Build the function, not the caller.

## Steps

1. Write `cart/checkout.ts` with `toOrderLineItems(sessionId)`: read the cart through `getCart`, map each line to the `order_line_item` shape that already exists in `db/schema.ts` (§ Codebase findings F10). Do **not** define a new table or a parallel type — the standing decision is that later capabilities inherit that shape.
2. `unitPrice` is the cart line's `unitCost` **as read at the time of the call**. `ARCHITECTURE.md` § Key Decisions is explicit: a line item records the price paid, and a later read of the current price silently restates history. Capture, do not reference.
3. Assign `lineNumber` from 1 upward, contiguous, matching the `(order_id, line_number)` composite key `order_line_item` declares. `order_id` is not this function's to assign — the caller creating the order owns it.
4. Add `clearCartAfterOrder(sessionId)` delegating to `clearCart` (SWHM-T-0137's, landed). It exists as a named seam so the future caller has one thing to call and this capability keeps the clearing rule.
5. Tests: `cart/checkout.test.ts` — the mapping for a multi-line cart, contiguous line numbers, the captured price, an empty cart returning `[]`, and the clear leaving `count` 0.

## Scope boundary

§ Spec discrepancies S8. Order creation does not exist in this repository and is `swhm-i-0008`'s. This ticket builds a tested function with no production caller, which is deliberate and is what the idea's own Solution section asks for. Do not add an order route, an order page, an order-creation function, or an entry to `db/schema.ts`.

## File/module ownership

Create or modify only: `cart/checkout.ts`, `cart/checkout.test.ts`.

Nothing else. `cart/cart.ts` is complete and landed — import from it, do not edit it. `auth/session.ts` is SWHM-T-0141's, which may run in parallel with this ticket.

## Design reference

None applies — no user-visible surface.

## Definition of Done

AC-1 through AC-6 on the ticket. AC-1 is the fixed interface contract `swhm-i-0008` will code against, so it is the one worth getting right the first time.
