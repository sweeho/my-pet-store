---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0013
ticket: SWHM-T-0134
idea: SWHM-I-0007
branch: vortex/sprint/swhm-s-0013-b8e5db3c
upstream:
  [
    openspec/changes/swhm-i-0007-shopping-cart-management/design.md,
    artifacts/SWHM-S-0013/SWHM-T-0133/PLAN.md,
  ]
---

# PLAN — SWHM-T-0134: Add items to the cart

## Objective

Implement adding an item, reading a whole cart, and the two routes that expose both — which is where the derived `count`, `lineTotal` and `subtotal` first exist. Add the Add to Cart control to the item detail screen.

## Steps

1. Write `cart/cart.ts` with `getCart` first. It reads the session's rows through `cart/repository.ts`, resolves each item through `getItem(itemId, DEFAULT_LOCALE)` (`catalog/item.ts`, § Codebase findings F6), and derives `lineTotal`, `subtotal` and `count`. Per § Decisions D6 none of these is stored, so there is nothing to "recalculate" after a later operation — the checkboxes that say so are satisfied by their absence.
2. **Read § Spec discrepancies S1 before writing the price lookup.** `unitCost` is `item.unit_cost`, not `item.list_price`, and the two differ substantially in the seeded catalogue. This is deliberate, matches the mockup, and is a recorded product contradiction — not a bug to fix and not a decision to revisit in this ticket.
3. `count` is the number of distinct lines, not the sum of quantities (§ Decisions D5, § Spec discrepancies S7). The remove scenario in the delta spec is what fixes this reading.
4. Add `addItem(sessionId, itemId, quantity = 1)`: reject an unknown item id, otherwise read the current quantity for that (session, item) and upsert the sum. A duplicate add therefore raises the quantity rather than adding a line.
5. Add `routes/api/cart/index.get.ts` and `routes/api/cart/index.post.ts`, following `routes/api/customer/index.put.ts` for the `defineHandler` / `readBody` / `setResponseStatus` shape (F7). Resolve the session with `useSignOnSession(event)`, which creates a session row for an anonymous visitor as well (F2). **Do not** check `j_signon` and do not add the path to `auth/protected-resources.ts` — the cart is public by § Decisions D3.
6. Add the quantity field and Add to Cart control to `src/pages/catalog/item/[itemId].tsx`. Keep the existing screen's structure, heading, image fallback and language switcher untouched; this is an addition below the existing price line. Note the screen continues to display `listPrice` — leave that as it is; S1 covers why the two differ.
7. Tests: `cart/cart.test.ts` (server project) for the operations and the derivations, route tests beside each route, and `src/pages/catalog/item/[itemId].test.tsx` for the new control.

## File/module ownership

Create or modify only: `cart/cart.ts`, `cart/cart.test.ts`, `routes/api/cart/index.get.ts` (+ `.test.ts`), `routes/api/cart/index.post.ts` (+ `.test.ts`), `src/pages/catalog/item/[itemId].tsx` (+ `.test.tsx`).

Nothing else. `cart/types.ts` and `cart/repository.ts` are SWHM-T-0133's and are landed — import them, do not edit them. `cart/cart.ts` is appended to by SWHM-T-0135, SWHM-T-0136 and SWHM-T-0137 in that order; leave it easy to extend.

## Design reference

`artifacts/SWHM-S-0013/design/mockup-shopping-cart-populated.html` is authoritative for how a cart line is priced and totalled — note it shows Parrots at `$350.00`, which is that item's `unit_cost`, and states "Sum of unit cost × quantity for all items." beneath the subtotal. It does not constrain the item detail screen; the Add to Cart control has no mockup, so build it from the existing screen's own idiom and `src/components/ui/button.tsx`.

## Definition of Done

AC-1 through AC-12 on the ticket. AC-1 to AC-5 are the delta spec's scenarios verbatim; AC-6 to AC-9 are fixed interface contracts that SWHM-T-0135, SWHM-T-0136, SWHM-T-0138 and SWHM-T-0139 all code against.
