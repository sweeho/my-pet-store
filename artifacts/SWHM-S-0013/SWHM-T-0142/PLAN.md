---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0013
ticket: SWHM-T-0142
idea: SWHM-I-0007
branch: vortex/sprint/swhm-s-0013-b8e5db3c
upstream:
  [
    openspec/changes/swhm-i-0007-shopping-cart-management/design.md,
    artifacts/SWHM-S-0013/SWHM-T-0139/PLAN.md,
  ]
---

# PLAN — SWHM-T-0142: Browser-tier cart journey

## Objective

One `e2e/cart.spec.ts` covering the shopper's whole cart journey in a real browser: add, update, remove, the empty state, persistence across navigation, and reachability without signing on.

## Steps

1. Create `e2e/cart.spec.ts`, following the shape of `e2e/catalog.spec.ts` (public journeys) and `e2e/admin.spec.ts` (multi-step journeys with a denial block). Playwright runs on port 5178 with `--strictPort`, so a dev server never collides with it.
2. Cover each ticket AC as its own test. Group them in one or two `test.describe` blocks — the journey, and the anonymous-access case.
3. Locate elements by role and accessible name. The quantity inputs carry `aria-label="Quantity for <itemId>"` (SWHM-T-0138's AC-7), which is the stable handle for the update and remove cases.
4. Use a real seeded item id from `catalog/seed.ts`, not `1001` — § Spec discrepancies S12 records that the scenario's numeric id stands for "a particular item" and this catalogue's ids are strings.
5. Assert the subtotal against the item's `unit_cost`, not its `list_price`. § Spec discrepancies S1: the cart prices from `unit_cost` by design, and the catalogue screen shows `list_price`, so a spec that carries the price across from the item page will fail for the wrong reason.

## Scope boundary

§ Spec discrepancies S10. Task group 10's eight checkboxes are tagged to this ticket because every box in a group takes that group's key, but seven of them describe assertions the implementing tickets already own at the unit tier — SWHM-T-0134 through SWHM-T-0139 each carry their own. This ticket owns the browser tier alone and does not re-open another ticket's files to duplicate coverage. If a landed module or screen is wrong, raise a defect; do not fix it here.

## On running it

Implementation containers ship no Chromium (§ Codebase findings F12). If the preflight reports the browser genuinely missing, say so plainly in the work log and let the spec first execute in CI on this ticket's branch — do not retry and do not install a browser. AC-7 asks for exactly that honesty: either the spec ran, or the log says why it could not. A spec nobody has executed anywhere is the one outcome to avoid.

## File/module ownership

Create only: `e2e/cart.spec.ts`.

Nothing else. Every module, route and page this spec drives is landed and owned by an earlier ticket.

## Design reference

`artifacts/SWHM-S-0013/design/mockup-shopping-cart-populated.html` and `mockup-shopping-cart-empty.html` fix the copy this spec asserts on — in particular the exact string `Your Shopping Cart is Empty.` and the currency form `$350.00`.

## Definition of Done

AC-1 through AC-7 on the ticket.
