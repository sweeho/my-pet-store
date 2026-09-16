---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0012
idea: SWHM-I-0006
branch: vortex/sprint/swhm-s-0012-04c8d46e
upstream: [artifacts/SWHM-S-0012/qa-test-report.md]
---

# Release notes — SWHM-S-0012

My Pet Store now has an administration area. The person running the store can sign in, read the order queue, move orders through their statuses, and see what sold over a period — in the same application shoppers use, behind the same sign-in.

## Added

- Administrators sign in at `/admin/signon` with the same username and password as any other account; there is no second login and no second password to remember. (SWHM-T-0114)
- An administration home page at `/admin` lists what the area offers and gives one-click access to the orders screen and a sign-out. (SWHM-T-0115)
- The orders screen at `/admin/orders` shows approved, completed and denied orders with their id, customer, date, amount and status. It is read-only by design — nothing in the table can be edited by clicking it. (SWHM-T-0122)
- Several orders can be moved to a new status in one request, and the batch either moves entirely or not at all: an interrupted update never leaves half the orders changed. (SWHM-T-0119)
- A revenue report at `/admin/reports/revenue` shows what sold between two dates, broken down by category — or by individual item when one category is selected. (SWHM-T-0120)
- An order-count report at `/admin/reports/orders` answers the same question by units sold rather than by money. (SWHM-T-0121)
- Signing out ends the session immediately, rather than leaving it usable until the browser is closed. (SWHM-T-0116)
- A wrong password on the administrator sign-in leads to a page that says the credentials were not recognised and links straight back to the sign-in form, instead of a blank or generic error. (SWHM-T-0123)

## Changed

- Being signed in and lacking administrator access are now different outcomes. A signed-in shopper who reaches an administrator page is refused where they stand; previously the only outcome available was a redirect to sign-in, which would have sent someone already signed in back to sign in again. Anyone not signed in is still sent to sign-in and returned to where they were heading. (SWHM-T-0114)
- No shopper-facing screen changes because an administrator exists. Accounts without the administrator marker behave exactly as before. (SWHM-T-0114)

## Upgrade notes

- **Two database migrations ship with this release** — `drizzle/0005_mighty_gertrude_yorkes.sql` adds the administrator marker to the account table, and `drizzle/0006_exotic_cannonball.sql` adds the order and order-line tables. Both are applied on startup. Existing accounts are unaffected: the marker is nullable and every existing account reads as a shopper.
- **The administrator account is seeded development data and must not reach a real deployment as it stands.** `jps_admin` / `admin` is created by the seed and its password is pre-filled on the sign-in form, matching the specification this capability was built from. Nothing in the product grants or revokes the administrator marker, so today it is set in the database — see PRODUCT.md § Not yet decided. Remove or re-credential that account before deploying.
- **Demo orders are seeded** alongside the demo catalogue, so the orders screen and both reports have content on a fresh database. They are demo data, not a product decision.
- No configuration change, no feature flag, and no breaking change to any existing endpoint.

## Not included

- **No rich desktop client.** The legacy system launched its administration screens as a Java Web Start desktop application; "Launch Rich Client" opens the orders screen in the same browser tab instead. There is one deployable and it is the web application — PRODUCT.md § Scope makes this a standing non-goal.
- **Status updates are immediate, not queued.** The legacy system handed batch updates to a message queue for asynchronous processing. Here the batch is applied in a single transaction, which delivers the property the specification actually asserts — all-or-nothing — without a queue this single-deployable product has no use for.
- **The administration API speaks JSON, not XML.** Any integration written against the legacy XML request and response documents will not work against these endpoints.
- **The reports are tables with bars, not interactive charts.** The date range, the grouping and the figures are all there; no charting library was added, so there is no zooming, hovering or exporting.
- **Nothing grants administrator access from inside the product**, no action is recorded against the administrator who took it, and sessions still do not expire for anyone. All three are open product decisions rather than omissions — PRODUCT.md § Scope and § Not yet decided.
- **The administration screens are English only**, and report category names in the default locale, even though the catalogue itself is localized.

## Verification

Verified at integration QA on the sprint branch — see `artifacts/SWHM-S-0012/qa-test-report.md` (PASS, no defects found).

## Compliance / Control Evidence

| Control                      | Evidence                                 | Location                                  | Status    | Exception                                                             |
| ---------------------------- | ---------------------------------------- | ----------------------------------------- | --------- | --------------------------------------------------------------------- |
| Release contents recorded    | this file                                | `artifacts/SWHM-S-0012/release-notes.md`  | Satisfied | —                                                                     |
| Release verified before land | QA PASS verdict, 431 unit + 28 E2E green | `artifacts/SWHM-S-0012/qa-test-report.md` | Satisfied | —                                                                     |
| Schema changes communicated  | both migrations named in § Upgrade notes | this file                                 | Satisfied | —                                                                     |
| Known limitations disclosed  | § Not included, § Upgrade notes          | this file                                 | Satisfied | Seeded administrator credentials disclosed as a pre-deployment action |
