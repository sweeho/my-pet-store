---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0021
idea: SWHM-I-0014
branch: vortex/sprint/swhm-s-0021-5e503761
upstream: [artifacts/SWHM-S-0021/qa-test-report.md]
---

# Release notes — SWHM-S-0021

## Added

- Every screen in the store now carries the same header. Wherever you are — the catalogue, your cart, checkout, payment, your account, the order confirmation, the About page, even the not-found page — the store mark takes you home, **Catalog** opens the catalogue, and **Cart** takes you to your cart and shows how many lines are in it (no number when it is empty). Previously only the home page had any navigation at all. (SWHM-T-0236, SWHM-T-0237)
- The header says who you are: **Sign in** when you are signed out, or your username with **My account** and **Sign out** when you are signed on. Signing out ends the session and returns you to the home page. (SWHM-T-0236, SWHM-T-0237)
- An administrator now sees an **Admin** link to the administration area in the header on every screen, including the home page — there is no longer any need to type the URL. Nobody without the administrator role sees the link, and the administration area is still refused to anyone who reaches it without the role. (SWHM-T-0236, SWHM-T-0237)
- The administration and supplier screens keep their administration context, the signed-in name and their back-link, and now also carry links to the catalogue and the cart. (SWHM-T-0238)

## Changed

- The home page and About page now look like the rest of the store. They were the last two screens still wearing the generated template's dark theme; they now use the store's own colours and typography. (SWHM-T-0237)
- Page content no longer jumps sideways as you move through a purchase. Every screen now sits in one shared column width — the store's screens in one, the administration screens in a slightly wider one — instead of the six different widths in use before. (SWHM-T-0237, SWHM-T-0238)
- The order information form is laid out in two columns with a full-width order summary, so it stays comfortable to fill in at the shared column width. (SWHM-T-0237)
- The not-found page is now a page of the store, with the header and the store's typography, instead of an unstyled stub. (SWHM-T-0237)
- The home page's separate mobile navigation panel is gone; the shared header serves narrow screens directly. (SWHM-T-0237)
- The catalogue's language switcher has moved into the header. The language you choose still follows you between screens. (SWHM-T-0237)
- Nothing is claimed about who you are until the store knows. The header shows neither a sign-in control nor a username nor an Admin link until the session has been read, so you never briefly see the wrong one. (SWHM-T-0236)

## Fixed

- Signing in to reach a protected page no longer flashes a wider, header-less panel before the page appears. Five screens — your account, payment, the order form, the order confirmation and the sign-on welcome — showed a one-time sideways jump while access was being checked. (found and fixed at integration QA under SWHM-T-0240)

## Upgrade notes

None required. `GET /api/signon/session` gained a `role` field, which is additive and does not change any existing field. No database migration, no configuration change, no feature flag, and no breaking change.

## Not included

Deliberately out of scope for this release, per the change's proposal: a new visual identity (the existing tokens are the target, not a new palette or typeface); the four sign-on screens, which keep their bare centred card; the root error boundary, which must not depend on a header that fetches session state; a dark-mode toggle; a footer, breadcrumbs or a header search box; nested layout routes; any redesign of administration or supplier screen _content_; and role management — who is an administrator is still decided exactly as before.

Two further items did not ship and are recorded rather than dropped. The idea asked for a single content column across the whole product; the design specifies two — one for the store and a wider one for administration — and that is what shipped. And `/RootErrorBoundary` remains reachable as a public screen (SWHM-T-0239, raised during this sprint for a later one).

## Verification

Verified at integration QA against the merged sprint branch — see `artifacts/SWHM-S-0021/qa-test-report.md` (PASS: 38 of 38 scenarios, 901 unit tests, 45 end-to-end tests).

## Compliance / Control Evidence

| Control                                  | Evidence produced                                      | Location                                  | Status    | Exception |
| ---------------------------------------- | ------------------------------------------------------ | ----------------------------------------- | --------- | --------- |
| Release contents recorded                | this file                                              | `artifacts/SWHM-S-0021/release-notes.md`  | Satisfied | —         |
| Release verified before land             | QA PASS verdict, 38/38 scenarios                       | `artifacts/SWHM-S-0021/qa-test-report.md` | Satisfied | —         |
| Known limitations communicated           | § Not included, naming SWHM-T-0239                     | this file                                 | Satisfied | —         |
| Breaking changes and migrations declared | § Upgrade notes — none; the one API change is additive | this file                                 | Satisfied | —         |
