# SWHM-T-0237 — Header, tokens and shared width across the customer-facing screens

Change: `swhm-i-0014-consistent-look-and-site-nav`.
Read `openspec/changes/swhm-i-0014-consistent-look-and-site-nav/design.md` before this file; the
steps below cite it rather than repeat it.

Depends on SWHM-T-0236, which owns `StoreHeader` and `src/components/layout.ts`. Do not create or
edit either — consume them.

## Objective

Give the twelve customer-facing screens with no header the shared one, move the home and About pages
onto the store's design tokens, and put all of them in the one shared store column.

## Steps

1. **Render `StoreHeader` on each screen that lacks one**: cart, account, payment, order form, order
   confirmation, sign-on welcome, account-creation error, not-found, and the four catalogue screens.
   The header is a component a screen renders, not a route — design § Decisions D1, and F2 for why
   there is no layout to hang it from. Every screen's existing back-link stays; the wireframe is
   explicit that the header is added beside it, not instead of it.
2. **Pass the language switcher into the header's slot** on the four catalogue screens. Design
   § Decisions D9 — `useCatalogLocale()` stays the only place locale is resolved, which is a standing
   cross-cutting constraint, so the switcher moves but the hook does not.
3. **Move every screen this ticket owns onto the shared store width.** Design § Decisions D6.
4. **Re-flow the order form.** Design § Decisions D7 and finding F9 — the current
   `lg:grid-cols-[1fr_1fr_340px]` does not fit the column. Fields, their order and their validation
   are untouched.
5. **Rebuild the home page on the tokens.** Its bespoke `<header>` and its `@headlessui/react`
   mobile `Dialog` are replaced by the shared header; the raw palette classes go. F10 records that
   this removes the only consumer of `@heroicons/react` and that two existing tests describe the
   panel — `e2e/home.spec.ts`'s mobile-nav case and the dialog case in `src/pages/index.test.tsx`.
   Replace them with header assertions rather than deleting the coverage.
6. **Move About onto the tokens and the shared width.**
7. **Read the mockups, copy none of their CSS.** Design § Decisions D12 and § Design reference.
   `mockup-home-page-...html` and `mockup-cart-...html` are this ticket's references. They link a
   Google-hosted font; `e2e/home.spec.ts` asserts no page may.
8. **Add the two conformance tests.** Design § Decisions D11, following `src/theme-tokens.test.ts`.
9. **Decide the narrow-viewport behaviour.** Design § Open questions O1 — the mockups are authored
   at 1440px and settle nothing below it, so whether the control row wraps or the secondary controls
   collapse is this ticket's call. The 375px browser assertion is the check; a real browser is the
   only tier that observes overlap (design § Phases, phase 4).

## File/module ownership

Modify: `src/pages/index.tsx`, `about.tsx`, `cart.tsx`, `customer.tsx`, `payment.tsx`,
`enter-order-information.tsx`, `order-completed.tsx`, `signon-welcome.tsx`, `user-creation-error.tsx`,
`NotFound.tsx`, `catalog/index.tsx`, `catalog/category/[categoryId].tsx`,
`catalog/product/[productId].tsx`, `catalog/item/[itemId].tsx`, the `*.test.tsx` beside each, and
`e2e/home.spec.ts`.
Create: `src/layout-width.test.ts`, `src/palette-classes.test.ts`.

Nothing under `src/components/` and nothing under `src/pages/admin/` or `src/pages/supplier/` —
SWHM-T-0236 and SWHM-T-0238 own those. The four sign-on screens keep their bare card and are not
touched.

## Definition of Done

The ticket's acceptance criteria AC-1 through AC-18. AC-1 to AC-7 are the header on these screens,
AC-8 to AC-10 the column, AC-11 to AC-13 the tokens, AC-14 and AC-15 the branded shell, and AC-16 to
AC-18 shell navigation.
