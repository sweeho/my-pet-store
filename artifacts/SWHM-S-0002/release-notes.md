---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0002
idea: SWHM-I-0002
branch: vortex/sprint/swhm-s-0002-728cef7d
upstream: [artifacts/SWHM-S-0002/qa-test-report.md]
---

# Release notes — SWHM-S-0002

My Pet Store now knows who you are. This release adds accounts and sign-on; nothing that already existed behaves differently.

## Added

- You can create an account at `/signon` with a username and a password you confirm. A username longer than 25 characters, or containing `%` or `*`, is refused with the reason shown on screen. (SWHM-T-0022, SWHM-T-0023)
- You can sign in with those credentials. A wrong password or an unknown username takes you to a sign-on failure page rather than leaving the form silently unchanged. (SWHM-T-0021, SWHM-T-0023)
- Ticking **remember my username** pre-fills the username field on your next visit, for 31 days. Leaving it unticked clears a previously remembered username. Only the username is stored in the browser — never the password. (SWHM-T-0020, SWHM-T-0021, SWHM-T-0023)
- Pages that require an account send you to sign-on if you are not signed in, and **return you to the page you originally asked for** once you are. Signing in without a pending destination lands you on a welcome page. (SWHM-T-0019, SWHM-T-0021)
- Two new pages behind sign-on: `/customer` and `/signon-welcome`. (SWHM-T-0023)
- Being signed in now survives a page reload and a server restart — the session is held by the server, not by the browser tab. (SWHM-T-0018)

## Upgrade notes

- **Two database migrations run on first start** — `drizzle/0001_easy_tomorrow_man.sql` and `drizzle/0002_chilly_texas_twister.sql`, adding the `auth_users` and `sessions` tables. They are applied automatically by `db/client.ts`; no manual step. Existing tables are untouched.
- **Two new cookies.** `bp_session` identifies your server-side session, is httpOnly, and lasts for the browsing session. `bp_signon` holds a remembered username for 2,678,400 seconds (31 days) and is set only when you tick the remember box.
- No breaking changes, no configuration changes and no feature flags. Every page that worked before this release still works without an account.

## Not included

- **Sessions do not expire.** The specification for this capability defines no expiry, so none was implemented. (SWHM-T-0026)
- **Two of the four protected resources have no page yet** — `customer.do` and `enter_order_information.screen` belong to later ideas (SWHM-I-0003, SWHM-I-0008). Both are already registered as protected, so interception works the moment their pages land.
- **Password reset, password recovery, multi-factor authentication and social or federated sign-in** are standing product non-goals, not omissions — see PRODUCT.md § Scope.
- **Signing out.** No sign-out control ships in this release; a session ends when its cookie does.
- One known cosmetic defect is open against the design tokens (SWHM-T-0025). It affects no screen in this release — the error pages deliberately avoid the broken token pair.

## Verification

Verified at integration QA against the built, deployed sprint branch — see `artifacts/SWHM-S-0002/qa-test-report.md` (PASS: 24/24 specified scenarios, 74 unit tests, 8 browser tests, no defects found).

## Compliance / Control Evidence

| Control                        | Evidence                                    | Location                                                                      | Status    | Exception |
| ------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------- | --------- | --------- |
| Release contents recorded      | this file                                   | `artifacts/SWHM-S-0002/release-notes.md`                                      | Satisfied | —         |
| Release verified before land   | QA PASS verdict, 24/24 scenarios            | `artifacts/SWHM-S-0002/qa-test-report.md`                                     | Satisfied | —         |
| Known limitations communicated | § Not included, with ticket keys            | this file                                                                     | Satisfied | —         |
| Data migrations identified     | two migrations named, applied automatically | `drizzle/0001_easy_tomorrow_man.sql`, `drizzle/0002_chilly_texas_twister.sql` | Satisfied | —         |
