---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0016
idea: SWHM-I-0009
branch: vortex/sprint/swhm-s-0016-da83b0d8
upstream: [artifacts/SWHM-S-0016/qa-test-report.md]
---

# Release notes — SWHM-S-0016

## Added

- Checkout now has a payment step. After entering billing and shipping details you are taken to a payment screen showing your order summary, the addresses you just entered, and the card fields — card number, cardholder name, card type, and expiry month and year. (SWHM-T-0177)
- The store checks your card before taking the order. A card type it does not accept, or an expiry date that has already passed, is refused on the field it belongs to with a message naming the problem — an expired card is told the exact month and year it expired. A card with no expiry entered is asked for one rather than being called expired. (SWHM-T-0176, SWHM-T-0177)
- Submitting a payment shows an "Authorizing…" state while the request is in flight, and the submit control cannot be pressed twice. (SWHM-T-0177)
- A payment that is not approved tells you so and says plainly that no order was placed and the card was not charged. (SWHM-T-0177)

## Changed

- An order is created only after its payment is authorized. Previously the order form placed the order itself; it now sends you to the payment step, and a refused or declined card leaves no order behind. (SWHM-T-0177)
- The empty-cart refusal now appears at the payment step rather than on the order form, because that is where the order is placed. (SWHM-T-0177)

## Upgrade notes

- No database migration and no configuration change. The card details the store already held — type, expiry and last four digits — are unchanged, and nothing new is written.
- **No live payment processor is connected and no money moves.** Authorization is decided locally by a built-in stub that approves every card except one whose last four digits are `0002`, which it declines so the refusal path can be exercised. Connecting a real processor is a change to one module (`payment/processor.ts`) and nothing else. (SWHM-T-0177)
- Your full card number is still never stored. It is held only for the length of the authorization request. The store keeps the card type, the expiry and the last four digits, as before.

## Not included

- Settlement, capture, refunds and any live gateway integration. The authorization boundary exists and is observed; no payment is taken.
- The "Encrypted at rest" badge shown in the payment mockup. With no card number stored there is nothing to encrypt, and showing the badge would claim a protection the store does not perform.
- A saved cardholder name. The name is used for the authorization request and not kept.
- The mockup's example card brands (Visa, MasterCard, American Express). The store's accepted types remain `Java(TM) Card`, `Duke Express` and `Meow Card`.

## Verification

Verified at integration QA — see `artifacts/SWHM-S-0016/qa-test-report.md` (PASS; 619 unit tests and 41 browser tests green, no defect found).

## Compliance / Control Evidence

| Control                         | Evidence                                                  | Location                                  | Status    | Exception |
| ------------------------------- | --------------------------------------------------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded       | this file                                                 | `artifacts/SWHM-S-0016/release-notes.md`  | Satisfied | —         |
| Release verified before land    | QA PASS verdict                                           | `artifacts/SWHM-S-0016/qa-test-report.md` | Satisfied | —         |
| Known limitations communicated  | Stub processor, no settlement, no encryption badge        | `## Upgrade notes`, `## Not included`     | Satisfied | —         |
| Cardholder data handling stated | No card number persisted; type, expiry and last four only | `## Upgrade notes`                        | Satisfied | —         |
