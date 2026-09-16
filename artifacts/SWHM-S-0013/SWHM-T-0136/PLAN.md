---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0013
ticket: SWHM-T-0136
idea: SWHM-I-0007
branch: vortex/sprint/swhm-s-0013-b8e5db3c
upstream:
  [
    openspec/changes/swhm-i-0007-shopping-cart-management/design.md,
    artifacts/SWHM-S-0013/SWHM-T-0135/PLAN.md,
  ]
---

# PLAN — SWHM-T-0136: Update cart quantities

## Objective

Change a line's quantity, with a quantity of zero or less removing the line, and expose the batch update the Update Cart button submits to.

## Steps

1. Append `updateItem(sessionId, itemId, quantity)` to `cart/cart.ts`. Per § Decisions D7 the zero-or-less rule lives **here and nowhere else**: `updateItem` delegates to `removeItem` when `quantity <= 0`, and upserts otherwise. A caller that pre-filters zeroes is how the rule comes to be applied inconsistently by the next caller.
2. Append `updateItems(sessionId, updates)`: wrap the whole batch in one `db.transaction`, passing every entry through `updateItem`. Follow `admin/order-status.ts` for the transaction form. Atomicity is the property worth having — a partial batch leaves the shopper with a cart they did not ask for and no error to explain it.
3. Add `routes/api/cart/index.put.ts`. Validate that every entry carries an `itemId` string and a `quantity` that is a **number**; answer 400 otherwise. Per § Spec discrepancies S13 this is not in tension with the removal rule: a non-numeric quantity is a malformed request, a numeric `0` or `-1` is a valid instruction to remove.
4. Tests: extend `cart/cart.test.ts` with a positive update, an update to `0`, an update to a negative value, a mixed batch, and a subtotal that moves when a quantity does. Assert the rollback against the real in-memory database rather than a mock, as `admin/order-status.test.ts` does. Add the route test beside the route.

## File/module ownership

Create or modify only: `cart/cart.ts`, `cart/cart.test.ts`, `routes/api/cart/index.put.ts`, `routes/api/cart/index.put.test.ts`.

Nothing else. The Update Cart button is SWHM-T-0139's. Earlier operations are landed; add to the file, do not restructure it.

## Design reference

`artifacts/SWHM-S-0013/design/mockup-shopping-cart-populated.html` fixes the behaviour this endpoint backs: one "Update Cart" action submitting every edited quantity at once, with the footnote "Set a quantity to 0 and choose Update Cart to remove an item." The screen itself is SWHM-T-0138's and SWHM-T-0139's.

## Definition of Done

AC-1 through AC-10 on the ticket. AC-1 to AC-4 are the delta spec's scenarios verbatim; AC-5 and AC-8 are fixed interface contracts SWHM-T-0139 codes against.
