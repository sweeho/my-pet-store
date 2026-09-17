# Consistent look and site navigation — Implementation Tasks

## 1. Header and session contract

- [x] 1.1 Add `StoreHeader` with the store mark, catalogue link, cart link and line count, and the trailing slot, per design.md § Fixed interface contracts (SWHM-T-0236)
- [x] 1.2 Present the signed-out, signed-on and pre-session identity states in the header, with sign-out ending the session and returning to `/` (design.md D5) (SWHM-T-0236)
- [x] 1.3 Present the Admin link only to an identity holding the administrator role, ahead of the username (design.md D4, D7a) (SWHM-T-0236)
- [x] 1.4 Add the administration variant of the header — context label, catalogue, cart, username, sign out; no account or admin link (design.md D7a) (SWHM-T-0236)
- [x] 1.5 Add the `role` field to `GET /api/signon/session`, leaving the session's return address untouched (design.md D2, D3) (SWHM-T-0236)
- [x] 1.6 Add `src/components/layout.ts` exporting the two shared content-width constants (design.md D6) (SWHM-T-0236)
- [x] 1.7 Cover the header's variants and states and the extended session response in the component and route tiers (design.md § Phases, phase 4) (SWHM-T-0236)

## 2. Customer-facing screens

- [x] 2.1 Render the header on cart, account, payment, order form, order confirmation, sign-on welcome, account-creation error, the not-found screen and the four catalogue screens (SWHM-T-0237)
- [x] 2.2 Pass the catalogue language switcher into the header's trailing slot (design.md D9) (SWHM-T-0237)
- [x] 2.3 Move every customer-facing screen onto the shared store column width (design.md D6) (SWHM-T-0237)
- [x] 2.4 Re-flow the order form to two columns with a full-width summary (design.md D7, F9) (SWHM-T-0237)
- [x] 2.5 Decide and cover the header's narrow-viewport behaviour at 375px (design.md O1) (SWHM-T-0237)

## 3. Home and About on the design tokens

- [x] 3.1 Replace the home page's bespoke navigation bar and mobile dialog with the shared header (SWHM-T-0237)
- [x] 3.2 Move the home page and About page onto the design tokens, removing every raw palette class (SWHM-T-0237)
- [x] 3.3 Replace the mobile-nav browser and page specifications with header assertions (design.md F10, § Phases phase 4) (SWHM-T-0237)

## 4. Conformance tests

- [x] 4.1 Add the content-width conformance test over the screen sources (design.md D11) (SWHM-T-0237)
- [x] 4.2 Add the palette-class conformance test over the home and About sources (design.md D11) (SWHM-T-0237)

## 5. Administration and supplier screens

- [x] 5.1 Reduce `AdminShell` to the header's administration variant plus the label, back-link and content frame, dropping its `username` prop (design.md D8) (SWHM-T-0238)
- [x] 5.2 Remove the now-dead session fetch from the seven `AdminShell` callers, leaving the spec-mandated page-level sign-out controls in place (design.md D8, F4, F12) (SWHM-T-0238)
- [x] 5.3 Move the two route guards' pending and refusal states onto the shared administration column, keeping their `role="status"` indicators (design.md D5, D6) (SWHM-T-0238)
- [x] 5.4 Update the affected component and page tests, including the `AdminShell` username-prop assertions (SWHM-T-0238)

## 6. Continuous integration

- [x] 6.1 Confirm the existing workflows trigger on pushes and pull requests to `vortex/**` branches and run every tier the phases above extend (design.md § Phases, phase 5) (SWHM-T-0236)
