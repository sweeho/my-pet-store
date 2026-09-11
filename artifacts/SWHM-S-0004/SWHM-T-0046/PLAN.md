---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0004
ticket: SWHM-T-0046
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
upstream: [artifacts/SWHM-S-0004/INTERFACES.md]
downstream: [artifacts/SWHM-S-0004/SWHM-T-0046/summary.md]
---

# Plan — SWHM-T-0046: Catalog data model and entities

## Objective

The catalogue exists in the database and in the type system: six tables with their generated migration, the four entity types every later ticket imports, and the two registration lines that make `catalog/` a testable, type-checked server-side module. Nothing reads the catalogue yet — this ticket is what the other eleven stand on.

## Steps

1. Add the six tables to `db/schema.ts` exactly as fixed in `artifacts/SWHM-S-0004/INTERFACES.md` § Tables: `category`, `product` and `item` carrying identity and untranslatable facts, each with a `_details` sibling keyed on (entity id, locale). The entity/detail split is the localization mechanism, not a normalization preference — see `openspec/changes/swhm-i-0004-product-catalog-search/design.md` § Planning record, D2.
2. Give every foreign key `ON DELETE CASCADE` upward, following the shape `account/` already uses in the same file.
3. Add the five indexes named in § Tables.
4. Generate the migration into `drizzle/` with the project's generate step and commit it alongside the schema change. Never hand-write the SQL — `AGENTS.md` § Conventions.
5. Create `catalog/types.ts` with `Category`, `Product`, `Item`, `Page<T>` and `Locale` exactly as fixed in § Types. `Item` carries all 13 fields; `Page<T>` is generic because four services return pages of three different element types.
6. Register the new directory in both places named in § Registration gotchas — `vitest.config.ts` and `tsconfig.node.json`. Each failed exactly once before, at SWHM-T-0018 and SWHM-T-0034, and each failed nowhere else.
7. Write `catalog/schema.test.ts`: insert a category, a product under it and an item under that, each with detail rows, then read all three back and compare field for field.

## File/module ownership

- `db/schema.ts`
- `drizzle/` — the generated migration and its `meta/` update
- `catalog/types.ts`
- `catalog/schema.test.ts`
- `vitest.config.ts`
- `tsconfig.node.json`

## Definition of Done

- AC-1 (`Category entity representation — Category data is stored and retrieved`) — proven by `catalog/schema.test.ts`.
- AC-2 (`Product entity representation — Product data includes category relationship`) — same test, via the `catid` foreign key.
- AC-3 (`Item entity representation — Item contains all attributes`) — same test, all 13 fields.
- AC-4, AC-5 — the tables, keys, cascades, committed migration and indexes.
- AC-6 — `catalog/types.ts` against § Types.
- AC-7 — the round-trip assertion.
- AC-8 — the two registration lines.

## Design reference

_The idea carries no design blocks — `a2a_get_idea_design` returns an empty list, and the change's own § User Interface records that no screen records were extracted for this capability. Nothing was exported to `artifacts/SWHM-S-0004/design/`, and this ticket has no mockup to match._
