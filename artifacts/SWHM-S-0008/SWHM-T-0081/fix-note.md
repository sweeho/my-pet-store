---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0008
ticket: SWHM-T-0081
branch: vortex/fix/SWHM-T-0081-landing-page-nav-hero-links-are-all-dead-423b8bd1
upstream:
  [
    artifacts/SWHM-S-0008/SWHM-T-0081/PLAN.md,
    openspec/changes/swhm-s-0008-bugfix-found-by-inspector/design.md,
  ]
downstream: [artifacts/SWHM-S-0008/qa-test-report.md]
---

# Fix note — SWHM-T-0081: Landing page nav/hero links are all dead placeholders

## Root cause

`src/pages/index.tsx` is unmodified Tailwind Plus hero/nav template markup (design.md § RC-1).
Branding was applied to text only; the template's `href="#"` placeholder mechanism survived
intact across the whole `navigation` array (`Features`/`Tech Stack`/`Docs`/`GitHub`, four entries
naming a starter template, not a pet store), both "Log in" anchors, and the three hero anchors
(the eyebrow "See how it works", "Get started", and "View on GitHub"). None of them pointed at
`/catalog`, `/signon` or `/customer`, all three of which the application already routes and
serves — a first-time visitor at `/` had no way to reach any real screen.

## Fix

Per design.md § D-2's destination table: rewrote the `navigation` array to the two entries that
name screens this product actually ships — "Catalog" → `/catalog`, "My account" → `/customer` —
and pointed both "Log in" controls (desktop + mobile) and the hero's "Get started" at `/signon`
and `/catalog` respectively. Removed the hero's "View on GitHub" anchor and the eyebrow's "See how
it works" anchor (along with its absolute-inset overlay span), since neither names a destination
this product has; the eyebrow text now renders as plain copy. Every in-app destination now uses
`Link` from `react-router` (imported the same way `src/pages/catalog/index.tsx` does), not a raw
`<a href>`, so each control gets client-side navigation instead of a full reload. `Link` renders an
`<a>`, so `getByRole("link")` queries were unaffected. The brand logo's own `<a href="#">` (owned by
SWHM-T-0080) was left untouched — out of scope for this ticket.

## Regression test

`src/pages/index.test.tsx` — rewrote the mobile-dialog test's nav-name assertions ("Features"/
"Tech Stack" → "Catalog"/"My account"), added `MemoryRouter` wrapping (the page now renders
`Link`s, which need a router context), and added two new tests: `points the header Log in control
at the sign-on screen` (asserts `href="/signon"`) and `leaves no navigation or hero link as a
placeholder fragment` (asserts no non-logo link on the page — including inside the opened mobile
dialog — carries `href="#"`). The existing hero/CTA test now asserts `Get started` carries
`href="/catalog"` instead of merely existing, and the dialog test now asserts each link's `href`
rather than just its presence. `e2e/home.spec.ts`'s desktop-nav and mobile-dialog assertions were
updated from the old template names to "Catalog"/"My account", per the ownership map (no new e2e
tests added — out of scope for this ticket's file ownership). Red→green recorded in
`tdd-test-result.md`.

## Files touched

- `src/pages/index.tsx` — `navigation` array, both "Log in" controls, the three hero anchors, and
  the `react-router` import.
- `src/pages/index.test.tsx` — nav-name assertions, `MemoryRouter` wrapper, new Log-in-destination
  and no-placeholder-href tests.
- `e2e/home.spec.ts` — desktop-nav and mobile-dialog nav names updated to match the new copy.
