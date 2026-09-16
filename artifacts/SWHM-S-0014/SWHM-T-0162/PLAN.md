---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0014
ticket: SWHM-T-0162
idea: SWHM-I-0008
change: swhm-i-0008-order-submission-checkout
branch: vortex/sprint/swhm-s-0014-61fcd4b6
upstream:
  [
    openspec/changes/swhm-i-0008-order-submission-checkout/design.md,
    artifacts/SWHM-S-0014/SWHM-T-0161/PLAN.md,
    artifacts/SWHM-S-0014/SWHM-T-0160/PLAN.md,
  ]
---

# PLAN — SWHM-T-0162: Order journey in a browser

## Objective

One Playwright spec covering what only a real browser and a real server round trip can show: a signed-on shopper going from a populated cart to a confirmed order, and being refused when the cart is empty.

## Why this ticket is only a spec

design.md § Spec discrepancies S12. This ticket's task group is eight checkboxes of testing work, and seven of them describe assertions the implementing tickets already own at the unit tier — tests are written by the ticket that implements the behaviour, and a verify-only ticket is forbidden by the team contract. The eighth thing, the browser-tier journey, is the one artifact no other ticket owns.

Do **not** re-open another ticket's files to add coverage there. Checkbox 10.7 has nothing to assert: nothing sends a confirmation email (§ Spec discrepancies S4).

## Steps

1. Model the file on `e2e/cart.spec.ts` — it already signs on, adds an item from the item screen and navigates between screens. Each test gets its own browser context and therefore its own session and cart.
2. **Reach the form through the control on `/cart`**, not by navigating to the URL. The entry point is part of the journey, and it is new this sprint (§ Codebase findings F13).
3. Fill both sections, submit, and assert the confirmation screen shows an order identifier and the email the order was placed with.
4. **Never assert the literal 1001.** § Spec discrepancies S2: that value is only reproducible against an empty `orders` table, and the browser tier runs against a seeded development database. Assert that an identifier is shown, and that a second order placed afterwards has a higher one.
5. Return to `/cart` and assert it is empty.
6. Cover the two refusals: submitting with an empty cart lands on `/cart` with the empty-cart message; submitting with an invalid field shows the error against that input, not only a page-level message.
7. Locate elements by role and accessible name, as every other spec in `e2e/` does.

## On running it

Implementation containers ship no Chromium (§ Codebase findings F15). Run `verify-full`; if the preflight reports the browser genuinely missing, fall back to the browser-free gate, **say so in your work log**, and move on — do not retry and do not install a browser. These assertions are executed in CI on this ticket's branch and again at integration QA against the merged sprint branch.

A spec you have not executed anywhere is still a liability, so read it back against the pages it drives before finishing.

## File/module ownership

Create or modify only: `e2e/order.spec.ts`.

Nothing else — no source file, no other spec, no configuration.

## Design reference

`artifacts/SWHM-S-0014/design/mockup-enter-order-information.html` and `artifacts/SWHM-S-0014/design/mockup-order-confirmation.html` are what the screens under test look like; the accessible names to select by come from them.

## Definition of Done

AC-1 through AC-7 on the ticket. AC-7 is a scope guard, not a formality: this ticket touching a source file means an assertion has been put somewhere it does not belong.
