---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0013
ticket: SWHM-T-0138
idea: SWHM-I-0007
branch: vortex/sprint/swhm-s-0013-b8e5db3c
upstream:
  [
    openspec/changes/swhm-i-0007-shopping-cart-management/design.md,
    artifacts/SWHM-S-0013/SWHM-T-0134/PLAN.md,
  ]
---

# PLAN — SWHM-T-0138: Cart screen — populated and empty states

## Objective

Build `/cart`: read the cart, render whichever of its two states applies, to the mockups. Render the controls; wiring them is SWHM-T-0139's.

## Steps

1. Create `src/pages/cart.tsx`. File-based routing means creating the file is the whole registration step (`ARCHITECTURE.md` § Routing) — do not register it anywhere.
2. Fetch `GET /api/cart` on mount. While the read is outstanding, render the heading and container with a `role="status"` pending indicator, never an empty document — this is a standing decision, not a preference (`DESIGN.md` § Loading states, and the Key Decision it cites).
3. Render the empty state from `mockup-shopping-cart-empty.html`: the bordered panel, the glyph, the exact string `Your Shopping Cart is Empty.`, the supporting line, and the action back to the catalogue. No `table` element in this state — the wireframe is explicit that there are no rows, no quantity fields, no total and no Update Cart button.
4. Render the populated state from `mockup-shopping-cart-populated.html`: back link, heading, item-count subtitle, then the five columns — Item (name, description, monospace item id), Unit Cost, Quantity (a number input), Line Total, and the remove control. Then the footer: "Update Cart" on the left, the Subtotal block on the right, and the zero-quantity hint below.
5. Reuse `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `src/components/ui/table.tsx` and `Button` from `ui/button.tsx` (§ Codebase findings F9). Do not add a new primitive and do not edit either file — `DESIGN.md` § Components governs when a primitive is added, and this screen needs none.
6. Each quantity input carries `aria-label="Quantity for <itemId>"`, as the mockup does. Tests locate elements by role and accessible name, as everything else in this codebase does.
7. The controls render but need not act in this ticket. Do not leave a control that silently does nothing at the end of the sprint — SWHM-T-0139 depends on this ticket precisely so that gap closes immediately.

## File/module ownership

Create or modify only: `src/pages/cart.tsx`, `src/pages/cart.test.tsx`.

Nothing else. Do not edit `src/components/**` or add to a barrel. Import `Cart` and `CartItem` from `cart/types.ts` (SWHM-T-0133's, landed).

## Design reference

- `artifacts/SWHM-S-0013/design/mockup-shopping-cart-populated.html` — authoritative for the populated state.
- `artifacts/SWHM-S-0013/design/mockup-shopping-cart-empty.html` — authoritative for the empty state.
- `artifacts/SWHM-S-0013/design/wireframe-shopping-cart-populated.html`, `wireframe-shopping-cart-empty.html` — column order and state boundaries.
- `artifacts/SWHM-S-0013/design/MANIFEST.md` — what each one fixes.

Match layout, spacing, hierarchy, copy and states. The mockups use this repository's own tokens (§ Codebase findings F13), so build with Tailwind utilities rather than copying the mockups' raw CSS.

## Definition of Done

AC-1 through AC-9 on the ticket. AC-1 to AC-4 are the delta spec's scenarios verbatim.
