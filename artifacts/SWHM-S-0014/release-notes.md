---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0014
idea: SWHM-I-0008
branch: vortex/sprint/swhm-s-0014-61fcd4b6
upstream: [artifacts/SWHM-S-0014/qa-test-report.md]
---

# Release notes — SWHM-S-0014

## Added

- **A cart can now be turned into an order.** The cart page has a **Proceed to Checkout** control that opens a new checkout screen at `/enter-order-information`. Signing on is required to reach it. (SWHM-T-0153)
- **The checkout screen collects a billing address and a shipping address**, each with name, address, city, state, postcode, country, email and phone, alongside a read-only summary of what is being ordered and its subtotal. States and countries are chosen from the same lists the account screens already use. (SWHM-T-0153)
- **Submitting the form places the order.** The order records who placed it, the date it was placed, both addresses exactly as they were typed, and one line per cart item with the quantity and the price paid. (SWHM-T-0156, SWHM-T-0157)
- **Orders are numbered from 1001.** The first order placed in an empty store is 1001 and each one after it gets a higher number. (SWHM-T-0155)
- **A confirmation screen at `/order-completed`** shows the order number as "Your order Id is 1001", tells the shopper a confirmation e-mail is coming to the email address they gave, and offers **Continue Shopping** back to the catalogue. (SWHM-T-0159, SWHM-T-0160)
- **The form says what is wrong and where.** A missing required field or a malformed email address is flagged on the field itself, with a short message beneath it, and a single message above the form says the submission was refused. Name fields stop at 30 characters and address fields at 70. (SWHM-T-0154)

## Changed

- **The cart is emptied when an order is placed** — and only then. The order, its lines and the cart clear happen together, so if anything fails the cart is left exactly as it was and no half-written order survives. (SWHM-T-0158)
- **Submitting with an empty cart is refused.** The shopper is returned to the cart page with "Your shopping cart is empty. Please add items before ordering." rather than being shown an error on the checkout form. (SWHM-T-0161)

## Upgrade notes

- **A database migration ships with this release** — `drizzle/0008_sour_thanos.sql` adds billing, shipping and contact columns to `orders` and category, product and shipped-quantity columns to `order_line_item`. Every change is an additive `ALTER TABLE … ADD`; no existing column or row is altered, and nothing else in the schema changes.
- **Order numbering is seeded once, at startup, and only when the store has never taken an order.** On a store that already holds orders the seed does nothing and numbering continues from where it was. A store starting empty issues 1001 first.
- **The confirmation screen promises an e-mail that nothing sends yet.** The wording is deliberate and specified, but no message is delivered in this release; sending is a later capability, tracked as SWHM-T-0163.
- **Nothing takes payment.** An order is recorded and totalled; no card is charged, no tax is added and no shipping is charged. No card details are collected by the checkout form.
- **Order totals are still priced at unit cost, not list price** — the open question SWHM-S-0013 raised (SWHM-T-0143) now has consequences, because an order permanently records the figure it was placed at. It should be settled before anything takes a shopper's money.
- No configuration change, no feature flag, and no breaking change to any existing screen or endpoint.

## Not included

- **Paying for an order.** Placing one and paying for it are separate capabilities; payment integrates a processor and is not built here (PRODUCT.md § Not yet decided).
- **Sending the confirmation e-mail.** The screen says one is coming; delivery belongs to a later notifications capability (SWHM-T-0163).
- **Order history for the shopper.** There is no list of past orders and no way to look one up by its number — a shopper who leaves the confirmation screen has no route back to it.
- **Prefilling checkout from the saved account address, or saving what is typed at checkout back to the account.** The form starts empty and writes nothing back; whether it should is an open product question (SWHM-T-0164).
- **Fulfilment and approval.** An order is created with a `PENDING` status and nothing in this release moves it beyond that except the existing administration screens.

## Verification

Verified at integration QA on the sprint branch — see `artifacts/SWHM-S-0014/qa-test-report.md` (PASS, 19/19 scenarios, 577 unit tests and 37 browser tests green). One defect was found by the browser run and fixed before release: the confirmation screen was not receiving the order number or email address from the form.

## Compliance / Control Evidence

| Control                              | Evidence produced                                          | Location                                                  | Status    | Exception                                                                                                |
| ------------------------------------ | ---------------------------------------------------------- | --------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| Release contents recorded            | this file                                                  | `artifacts/SWHM-S-0014/release-notes.md`                  | Satisfied | —                                                                                                        |
| Release verified before land         | QA PASS verdict, 19/19 scenarios                           | `artifacts/SWHM-S-0014/qa-test-report.md`                 | Satisfied | —                                                                                                        |
| Schema change communicated           | Migration named in § Upgrade notes                         | `drizzle/0008_sour_thanos.sql`                            | Satisfied | —                                                                                                        |
| Known limitations disclosed          | § Upgrade notes and § Not included, each with a ticket key | SWHM-T-0163, SWHM-T-0164, SWHM-T-0143                     | Satisfied | All three open, awaiting triage                                                                          |
| Defects dispositioned before release | 1 found at QA, fixed in place before land                  | `artifacts/SWHM-S-0014/integration-defects-resolution.md` | Satisfied | Two backlog DEFECTs describing the same fixed bug remain open — see `sprint-summary.md` § Defects Raised |
