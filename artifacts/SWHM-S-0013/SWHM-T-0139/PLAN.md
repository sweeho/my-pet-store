---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0013
ticket: SWHM-T-0139
idea: SWHM-I-0007
branch: vortex/sprint/swhm-s-0013-b8e5db3c
upstream:
  [
    openspec/changes/swhm-i-0007-shopping-cart-management/design.md,
    artifacts/SWHM-S-0013/SWHM-T-0138/PLAN.md,
  ]
---

# PLAN — SWHM-T-0139: Cart form handling

## Objective

Make the cart screen's controls act: Update Cart submits every edited quantity in one request, each row's remove control deletes that line, and a quantity that is not a number is refused before a request is sent.

## Steps

1. Hold the edited quantities as page state, keyed by item id, seeded from the fetched cart. The input is controlled; editing it does not fetch.
2. Update Cart sends **one** `PUT /api/cart` carrying every row's current quantity. One request per row would make a partial failure visible as a half-updated cart, which is the outcome SWHM-T-0136's transaction exists to prevent.
3. Each row's remove control sends `DELETE /api/cart/items/{itemId}` for that item alone.
4. Both mutations return the resulting `Cart`; render **that**, and reseed the quantity state from it. Per § Spec discrepancies S3 the legacy POST-redirect-GET becomes a state update — no navigation, no route change, no refetch round trip.
5. Validate before sending: a field that is empty or holds a value that is not a number is refused on the screen with a message naming the row, and no request goes out. Per § Spec discrepancies S13 a numeric `0` or negative is **not** a validation failure — it is a valid instruction to remove, and passing it through is the whole point of the mockup's footnote.
6. Extend `src/pages/cart.test.tsx`. Cover each AC, including the transition to the empty state when the last line goes. Locate controls by role and accessible name; do not assert on class names or DOM shape.
7. Do not restructure SWHM-T-0138's rendering, copy or markup. This ticket adds behaviour to a screen that already looks right.

## File/module ownership

Create or modify only: `src/pages/cart.tsx`, `src/pages/cart.test.tsx`.

Nothing else. The routes are SWHM-T-0135's and SWHM-T-0136's and are landed — call them, do not edit them. If a route's contract turns out to be wrong, raise it rather than changing it here: AC-9/AC-8 on those tickets fixed those shapes and SWHM-T-0142 codes against them too.

## Design reference

`artifacts/SWHM-S-0013/design/mockup-shopping-cart-populated.html` — the "Update Cart" primary action, the per-row "Remove" control, and the footnote "Set a quantity to 0 and choose Update Cart to remove an item.", which is the behaviour contract for step 5. `artifacts/SWHM-S-0013/design/mockup-shopping-cart-empty.html` is the state reached when the last line is removed.

## Definition of Done

AC-1 through AC-8 on the ticket. AC-1 is the delta spec's scenario verbatim.
