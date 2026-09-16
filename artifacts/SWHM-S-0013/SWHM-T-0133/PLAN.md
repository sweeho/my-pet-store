---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0013
ticket: SWHM-T-0133
idea: SWHM-I-0007
branch: vortex/sprint/swhm-s-0013-b8e5db3c
upstream: [openspec/changes/swhm-i-0007-shopping-cart-management/design.md]
---

# PLAN — SWHM-T-0133: Cart data model, types and module registration

## Objective

Create the storage substrate for the cart capability: the `cart_items` table and its migration, the complete type set, row-level access, and the three registrations a new top-level module needs in this repository. No behaviour, no HTTP surface.

## Steps

1. Add `cart_items` to `db/schema.ts`: `sessionId` → `sessions.id`, `itemid` → `item.itemid`, `quantity` integer, composite primary key on (`sessionId`, `itemid`). Follow `orderLineItem` in the same file for the composite-key form. Declare `ON DELETE CASCADE` on both references for intent, and read § Codebase findings F4 before assuming it fires — it does not, and SWHM-T-0141 handles the consequence.
2. Generate the migration into `drizzle/` and commit it along with the `drizzle/meta/` updates. A schema edit is not complete without it (`ARCHITECTURE.md` § Data model).
3. Write `cart/types.ts` **whole**. Per § Decisions D8, every type the capability needs is defined here in this ticket — including the ones only SWHM-T-0140 and the cart screen consume — so no later ticket appends to this file. The shapes are fixed in AC-3.
4. Write `cart/repository.ts` as row-level access only: read, upsert, delete one, delete all. No price lookup, no derivation, no session resolution — those belong to `cart/cart.ts` (SWHM-T-0134) and the routes. `upsertCartRow` sets the quantity rather than adding to it; the "adding a duplicate raises the quantity" rule is `addItem`'s, not the repository's.
5. Register `cart/**` in all three places F5 names: `vitest.config.ts`'s `server` project include, its `client` project exclude, and `tsconfig.node.json`'s include. Missing either of the first two puts the tests in jsdom, where `bun:sqlite` cannot resolve at all.
6. Write `cart/repository.test.ts` against the real in-memory database, following `admin/orders.test.ts`. Cover: a row round-trips for its own session, is absent for another session, and a second upsert for the same key replaces rather than duplicates.

## File/module ownership

Create or modify only: `db/schema.ts`, the generated `drizzle/*.sql` + `drizzle/meta/*`, `cart/types.ts`, `cart/repository.ts`, `cart/repository.test.ts`, `vitest.config.ts`, `tsconfig.node.json`.

Nothing else. `cart/cart.ts` is SWHM-T-0134's. No route and no page exists yet.

## Design reference

None applies — this ticket has no user-visible surface. The sprint's mockups are at `artifacts/SWHM-S-0013/design/mockup-shopping-cart-populated.html` and `mockup-shopping-cart-empty.html`, and are consumed by SWHM-T-0138 and SWHM-T-0139.

## Definition of Done

AC-1 through AC-8 on the ticket. AC-3 and AC-4 are fixed interface contracts: every later ticket in the sprint imports those shapes and none may change them.
