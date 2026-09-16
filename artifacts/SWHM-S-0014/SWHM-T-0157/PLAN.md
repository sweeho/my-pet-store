---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0014
ticket: SWHM-T-0157
idea: SWHM-I-0008
change: swhm-i-0008-order-submission-checkout
branch: vortex/sprint/swhm-s-0014-61fcd4b6
upstream:
  [
    openspec/changes/swhm-i-0008-order-submission-checkout/design.md,
    artifacts/SWHM-S-0014/SWHM-T-0156/PLAN.md,
  ]
---

# PLAN — SWHM-T-0157: Line item creation from cart contents

## Objective

Turn the shopper's cart into the order's line items, and total the order from them.

## Steps

1. **Call the seam that already exists.** `cart/checkout.ts` exports `toOrderLineItems(sessionId)`, built and tested by the previous sprint specifically for this caller, and it already assigns `lineNumber` from 1 upward and captures `unitPrice` as the cost at call time (design.md § Codebase findings F3). Do not re-read `cart_items`, and do not reimplement the mapping.
2. **Extend that seam with `catid` and `productid`.** It is the one thing it does not carry, because a cart line stores quantity only and resolves the rest from the catalogue on read (§ Codebase findings F4). The spec requires a line item to include both (§ Spec discrepancies S8). Resolve them from the catalogue at placement and **store** them — for the same reason `unit_price` is stored: a line item records what was true when the order was placed, and a join to the current hierarchy would restate history (ARCHITECTURE.md § Key Decisions).
3. Keep that change **additive**. `cart/checkout.test.ts` already asserts the existing fields; those assertions must keep their meaning rather than be rewritten around a new shape.
4. `quantity_shipped` is 0 on a new order. The column exists as of SWHM-T-0153; nothing in this change ever raises it — that is fulfilment, change `swhm-i-0010-order-fulfillment-shipping`.
5. **Total the order.** `order_amount` is the sum of quantity × unit price across the line items, which is the cart's subtotal at the moment of placement. Money stays `real` — § Decisions D9: this is the same arithmetic reporting already does, and SWHM-T-0058 is still where a money representation gets decided. Do not introduce minor units here.
6. Two things you are inheriting rather than choosing, both recorded so they are not mistaken for bugs: the cart totals `item.unit_cost` while the catalogue displays `item.list_price` (§ Codebase findings F18), and neither tax nor shipping is added to an order's total. Both are open product decisions.
7. Tests: `order/order.test.ts` for a three-line cart producing three line items with contiguous numbers, the hierarchy fields, `quantity_shipped` of 0, the total, and the captured price surviving a later catalogue price change; `cart/checkout.test.ts` extended for the two new fields.

## Scope boundary

No cart clearing — SWHM-T-0158 owns it and depends on this ticket. The transaction arrives there too.

## File/module ownership

Create or modify only: `order/order.ts`, `order/order.test.ts`, `cart/checkout.ts`, `cart/checkout.test.ts`.

Nothing else. `cart/cart.ts` and `cart/repository.ts` are complete — import from them, do not edit them.

## Design reference

`artifacts/SWHM-S-0014/design/mockup-enter-order-information.html`'s "Your Order" column shows the line shape a shopper sees before placing: quantity, item id, unit price and line total. The order's own total is the same figure.

## Definition of Done

AC-1 through AC-7 on the ticket. AC-7 is the compatibility constraint on the shared seam: the previous sprint's assertions keep their meaning.
