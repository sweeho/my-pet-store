---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0013
idea: SWHM-I-0007
branch: vortex/sprint/swhm-s-0013-b8e5db3c
upstream: [artifacts/SWHM-S-0013/qa-test-report.md]
---

# Release notes — SWHM-S-0013

## Added

- Shoppers can put things in a cart. The item page now has a quantity field and an **Add to Cart** button; adding an item already in the cart raises its quantity instead of repeating the line. (SWHM-T-0134)
- A new **Shopping Cart** page at `/cart` lists what has been chosen — item, unit cost, quantity, line total — with the number of items and a subtotal. (SWHM-T-0138)
- Quantities can be edited on the cart page and saved with **Update Cart**; setting a quantity to 0 or a negative number takes that item out of the cart. Every row is saved in one go, so a failure part-way leaves all quantities as they were. (SWHM-T-0136, SWHM-T-0139)
- Each line has its own **Remove** action that takes just that item out. (SWHM-T-0135, SWHM-T-0139)
- An empty cart says "Your Shopping Cart is Empty." and offers a link back to the catalogue, rather than showing an empty table. (SWHM-T-0138)
- The cart follows the visit: it survives moving between pages, and no sign-on is needed to browse the catalogue, add an item, or open `/cart`. Each visit has its own cart. (SWHM-T-0133, SWHM-T-0141)

## Changed

- Signing out now empties the cart as well as ending the session. A shopper who signs out and returns starts with an empty cart. (SWHM-T-0141)

## Upgrade notes

- **A database migration ships with this release** — `drizzle/0007_ancient_iron_lad.sql` creates the `cart_items` table. It must be applied before the cart works; existing data is untouched and nothing else in the schema changes.
- No configuration change, no feature flag, and no breaking change to any existing screen or endpoint.
- **The cart's subtotal is not a price to act on yet.** The catalogue advertises an item's list price while the cart prices and totals the same item at its unit cost — for the seeded Parrots item, `$599.99` on the item page against `$350.00` in the cart. Both figures are implemented exactly as the store's specification states, and which one a shopper is actually charged is an open product decision tracked as SWHM-T-0143. Nothing takes payment in this release.

## Not included

- **Checkout and order placement.** The cart can be turned into an order's line items and emptied afterwards — that code exists and is tested — but nothing calls it yet; placing an order is the next capability (`swhm-i-0008`).
- **Carts that outlive a visit.** A cart is not recovered, merged or remembered after signing out, and a cart built while anonymous is not adopted on sign-on. Neither was in scope; both are open product questions (PRODUCT.md § Not yet decided).
- **Clearing a cart on session timeout.** Sessions in this product do not expire, so there is no timeout to clear on.

## Verification

Verified at integration QA on the sprint branch — see `artifacts/SWHM-S-0013/qa-test-report.md` (PASS: all 18 scenarios, 497 unit tests, 34 browser tests, no defects found).

## Compliance / Control Evidence

| Control                              | Evidence                                        | Location                                  | Status    | Exception             |
| ------------------------------------ | ----------------------------------------------- | ----------------------------------------- | --------- | --------------------- |
| Release contents recorded            | this file                                       | `artifacts/SWHM-S-0013/release-notes.md`  | Satisfied | —                     |
| Release verified before land         | QA PASS verdict, 18/18 scenarios                | `artifacts/SWHM-S-0013/qa-test-report.md` | Satisfied | —                     |
| Schema change migrated and committed | Generated migration for `cart_items`            | `drizzle/0007_ancient_iron_lad.sql`       | Satisfied | —                     |
| Known limitations communicated       | Pricing contradiction stated in § Upgrade notes | SWHM-T-0143 (BACKLOG)                     | Satisfied | Open, awaiting triage |
