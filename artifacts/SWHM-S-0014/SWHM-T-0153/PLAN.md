---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0014
ticket: SWHM-T-0153
idea: SWHM-I-0008
change: swhm-i-0008-order-submission-checkout
branch: vortex/sprint/swhm-s-0014-61fcd4b6
upstream: [openspec/changes/swhm-i-0008-order-submission-checkout/design.md]
---

# PLAN — SWHM-T-0153: Order information form, data model and module registration

## Objective

Stand up the foundation the whole change rests on, and the screen that defines it. The form's field set and the columns that store it are the same decision, so they land together: nothing downstream has to guess what shape an order is.

## Steps

1. **Columns, not tables.** Add to `orders` a billing address, a shipping address and the contact details an order is placed with; add `catid`, `productid` and `quantity_shipped` to `order_line_item`. Both tables already exist and four other modules read them — see design.md § Codebase findings F1 and § Decisions D1. Do not create an order table, do not rename an existing column (§ Spec discrepancies S11), and mirror the naming already in `db/schema.ts`.
2. Generate the migration into `drizzle/` and commit it. A schema change is not complete without it (ARCHITECTURE.md § Data model).
3. **Write `order/types.ts` whole.** Every field any ticket in this sprint persists, including the ones only later tickets consume. Reuse `Address` and `ContactInfo` from `account/types.ts` rather than redeclaring their fields — the spec's section field set is already exactly those two types. This is design.md § Decisions D8, adopted after a previous sprint had three tickets appending to one shared type file with no dependency edge between them.
4. **Register `order/` in three places** — `vitest.config.ts`'s `server` include, its `client` exclude, and `tsconfig.node.json`'s include (§ Codebase findings F12). Absent from the first two, an `order/` test runs under jsdom, where `bun:sqlite` cannot resolve at all, and the failure looks unrelated to the cause.
5. **Build `src/pages/enter-order-information.tsx`** to the mockup. Mirror `src/pages/customer.tsx` for the form idiom — `inputClassName`, a flat form state, `emptyToNull`, `Button` and `RequireSignOn` from `@/components` (§ Codebase findings F10). The screen is that page's address block twice, under "Billing Information" and "Shipping Information". Every field carries the `maxlength` the mockup gives it.
6. The two dropdowns are `STATES` and `COUNTRIES` already exported by `account/vocabulary.ts` (§ Codebase findings F9). Import them. Do not introduce a vocabulary, and do not edit that file.
7. The path is already in `PROTECTED_RESOURCES` as `enter_order_information.screen` (§ Codebase findings F7), so the screen is gated the moment the file exists — no configuration change, and no second check inside the page beyond `RequireSignOn`.
8. **Add the way in.** `/cart` has no route to checkout and nothing in the product links to one (§ Codebase findings F13). Add the control the cart mockup's layout implies, next to Update Cart, navigating to `/enter-order-information`.
9. Tests: `src/pages/enter-order-information.test.tsx` for both section headings, every field in each, the state and country options and the `maxlength` attributes; extend `src/pages/cart.test.tsx` with the checkout control.

## Scope boundary

No submit handler, no fetch, no validation, no route — SWHM-T-0154 owns all four and depends on this ticket. A field that renders and holds what is typed is the whole deliverable here.

## File/module ownership

Create or modify only: `db/schema.ts`, the generated files under `drizzle/`, `order/types.ts`, `vitest.config.ts`, `tsconfig.node.json`, `src/pages/enter-order-information.tsx`, `src/pages/enter-order-information.test.tsx`, `src/pages/cart.tsx`, `src/pages/cart.test.tsx`.

Nothing else. `account/vocabulary.ts` and `account/types.ts` are imported, never edited.

## Design reference

`artifacts/SWHM-S-0014/design/mockup-enter-order-information.html` is authoritative for this screen; `artifacts/SWHM-S-0014/design/wireframe-enter-order-information.html` fixes the structure and field order. `artifacts/SWHM-S-0014/design/MANIFEST.md` lists both and flags what to read off them rather than guess. The per-field invalid state the mockup shows belongs to SWHM-T-0154, not to this ticket; build the fields in their valid state.

The mockup's right-hand "Your Order" column is a read-only summary of the cart being ordered. It is part of this screen — build it, reading the cart the same way `src/pages/cart.tsx` does.

## Definition of Done

AC-1 through AC-11 on the ticket. AC-8 is the fixed interface contract every later ticket in this sprint codes against, so it is the one worth getting right the first time: once `order/types.ts` lands, no other ticket may extend it.
