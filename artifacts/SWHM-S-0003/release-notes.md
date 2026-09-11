---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0003
idea: SWHM-I-0003
branch: vortex/sprint/swhm-s-0003-849ec4ef
upstream: [artifacts/SWHM-S-0003/qa-test-report.md]
downstream: []
---

# Release notes — SWHM-S-0003

## Added

- Signed-on customers now have a profile page at `/customer`, showing their contact information and account details in a read-only view. (SWHM-T-0036)
- Contact details, a delivery address, a payment card and preferences can be edited from that page and are saved to the account. (SWHM-T-0036)
- A preferred language can be chosen and is remembered — sign out, sign back in, and the store still has it, and the page reports it as the document's language. (SWHM-T-0036)
- A registered card is remembered by its type, expiry and last four digits, so a customer can tell which card the store already has. (SWHM-T-0034, SWHM-T-0036)
- Registering now creates the full account — status, contact, address, card and preference rows — with the store's defaults (`en_US`, no favourite category, my-list and banners on), so a new customer's profile page works immediately. (SWHM-T-0034)

## Changed

- The account a customer sees and edits is their own and only their own: every read and write is scoped to the signed-on session, and an unauthenticated request is refused without returning any account data. (SWHM-T-0035)
- A card number typed into the profile form is reduced to its last four digits before it is stored. The number itself is never written anywhere. (SWHM-T-0034, SWHM-T-0036)

## Fixed

- Registering a user name that already exists now fails with `User ID <name> already exists` instead of an unhandled database error. (SWHM-T-0034)

## Upgrade notes

- One database migration ships with this release — `drizzle/0003_quick_clea.sql`, adding the six account tables. It must be applied before the profile page or the account API will work.
- Customers who registered before this release have no account rows. They are served the store's default preferences on their first read rather than an error, and saving the profile form creates their rows.
- No configuration change, no feature flag, no breaking change to an existing endpoint or page.

## Not included

- Separate billing and shipping addresses. One address per account ships, per the account specification; separate addresses belong with order placement (SWHM-I-0008) and are tracked as SWHM-T-0037.
- Translated content. The language preference is stored and reported; translating the storefront into it is the `internationalization` capability (SWHM-I-0005).
- Disabling or suspending an account. The account status field exists and reads `active`; nothing changes it, and suspension is out of the idea's scope.
- Storing a full card number. A standing product non-goal — a future payment capability integrates a processor instead.

## Verification

Verified at integration QA — see `artifacts/SWHM-S-0003/qa-test-report.md` (PASS: 119 unit/integration tests, 9 E2E, 16/16 spec scenarios, no defects found).

## Compliance / Control Evidence

| Control                        | Evidence produced                          | Location                                  | Status    | Exception |
| ------------------------------ | ------------------------------------------ | ----------------------------------------- | --------- | --------- |
| Release contents recorded      | this file                                  | `artifacts/SWHM-S-0003/release-notes.md`  | Satisfied | —         |
| Release verified before land   | QA report, PASS verdict                    | `artifacts/SWHM-S-0003/qa-test-report.md` | Satisfied | —         |
| Known limitations communicated | `## Not included`, with owning idea/ticket | this file                                 | Satisfied | —         |
| Schema change controlled       | Generated, committed migration             | `drizzle/0003_quick_clea.sql`             | Satisfied | —         |
