---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0133
branch: vortex/feat/SWHM-T-0133-cart-data-model-types-and-module-registr-9c1656a8
upstream: [artifacts/SWHM-S-0013/SWHM-T-0133/PLAN.md]
downstream: [artifacts/SWHM-S-0013/SWHM-T-0134/PLAN.md]
---

# Summary — SWHM-T-0133: Cart data model, types and module registration

## What changed

Added the storage substrate for the cart capability, no behaviour and no HTTP surface, per
design.md D1/D8. `cart_items` in `db/schema.ts` is keyed on (`session_id`, `itemid`), stores only
`quantity`, and foreign-keys to `sessions.id` and `item.itemid` with `ON DELETE CASCADE` declared
for intent (design.md D4 — foreign-key enforcement is off, so neither cascade actually fires;
clearing the cart is an explicit delete, owned by a later ticket). `cart/types.ts` exports the
full fixed `CartItem`/`Cart` shapes (design.md D8, S4) whole, for every later ticket in the sprint
to import unchanged. `cart/repository.ts` exports the four row-level operations named in the
ticket's fixed contract, with no price lookup or session resolution — `upsertCartRow` sets the
quantity rather than adding to it. Registered the new `cart/` module in the three places a new
top-level module needs (design.md F5): `vitest.config.ts`'s `server` include and `client` exclude,
and `tsconfig.node.json`'s include.

## Files

- `db/schema.ts` — added the `cart_items` table.
- `drizzle/0007_ancient_iron_lad.sql`, `drizzle/meta/0007_snapshot.json`, `drizzle/meta/_journal.json` — generated migration for `cart_items`.
- `cart/types.ts` — new: `CartItem`, `Cart`.
- `cart/repository.ts` — new: `readCartRows`, `upsertCartRow`, `deleteCartRow`, `deleteAllCartRows`.
- `cart/repository.test.ts` — new: round-trip, cross-session isolation, upsert-replaces, per-row and per-session delete, against the real in-memory db.
- `vitest.config.ts` — added `cart/**` to the `client` project's exclude and `cart/**/*.test.ts` to the `server` project's include.
- `tsconfig.node.json` — added `cart` to the include list.

## AC coverage

- AC-1 (`cart_items` shape) — `db/schema.ts`; matches verbatim (composite PK, `quantity` non-null integer, both FKs `ON DELETE CASCADE`).
- AC-2 (migration present, builds the table from committed migrations alone) — `drizzle/0007_ancient_iron_lad.sql`; verified by running `migrate()` against a fresh file-backed sqlite db and inspecting `PRAGMA table_info(cart_items)` (see `tdd-test-result.md`).
- AC-3 (fixed `CartItem`/`Cart` shapes) — `cart/types.ts`, written whole.
- AC-4 (fixed `cart/repository.ts` exports) — `cart/repository.ts`.
- AC-5 (session isolation) — `CR-01`, `CR-02`.
- AC-6 (upsert replaces, not duplicates) — `CR-03`.
- AC-7 (`cart/**` registered in both vitest projects and `tsconfig.node.json`) — `vitest.config.ts`, `tsconfig.node.json`; the test itself running in the `server` project (resolving `bun:sqlite` via `db/client.ts`) is the proof.
- AC-8 (`cart/repository.test.ts` assertions pass) — see `tdd-test-result.md`, `TDD-RESULT: 436 passed, 0 failed`.

## Verification

```
$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   # clean
$ tsc --build                                                                  # clean
$ NODE_ENV=test bun --bun vitest run
 Test Files  76 passed (76)
      Tests  436 passed (436)
```

Full detail (including the red→green proof for this ticket's 5 new tests) in
`tdd-test-result.md`. `bun run verify:full`'s E2E tier could not run in this container (Chromium
genuinely not installed, per the repository's implementation-container notes); this ticket has no
browser-tier surface. E2E runs at INTEGRATION_QA and in CI.

## Notes

- Per S1/D2, the cart's unit cost is `item.unit_cost`, resolved on read (no price column on
  `cart_items`) — that resolution belongs to `cart/cart.ts` (SWHM-T-0134), out of scope here.
- No route and no page exists yet; `cart/cart.ts` is SWHM-T-0134's file.
