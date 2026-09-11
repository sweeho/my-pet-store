---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0046
branch: vortex/feat/SWHM-T-0046-catalog-data-model-and-entities-586cdac1
upstream: [artifacts/SWHM-S-0004/SWHM-T-0046/PLAN.md]
downstream: [artifacts/SWHM-S-0004/SWHM-T-0047/PLAN.md]
---

# Summary — SWHM-T-0046: Catalog data model and entities

## What changed

Added the six catalog tables to `db/schema.ts` (`category`, `product`, `item` and their
per-locale `_details` siblings), the generated migration for them, the five indexes the
paginated reads depend on, a new `catalog/` capability module carrying the fixed entity
types, and the two registration lines that make `catalog/` a testable, type-checked
server-side module — exactly to `artifacts/SWHM-S-0004/INTERFACES.md` §§ Tables, Types,
Registration gotchas. No query or service code yet; this is Phase 1's foundation ticket.

## Files

- `db/schema.ts` — added `category`, `categoryDetails`, `product`, `productDetails`,
  `item`, `itemDetails` per INTERFACES.md § Tables: entity/detail split, `ON DELETE CASCADE`
  upward on every foreign key, and the five indexes (`product(catid)`, `item(productid)`,
  `category_details(locale)`, `product_details(locale)`, `item_details(locale)`).
- `drizzle/0004_sloppy_ultimates.sql` + `drizzle/meta/*` — generated migration for the six
  tables, their keys and indexes.
- `catalog/types.ts` — new: `Category`, `Product`, `Item` (all 13 fields), `Page<T>`,
  `Locale`, verbatim from INTERFACES.md § Types.
- `catalog/schema.test.ts` — new: inserts a category, a product under it and an item under
  that, each with a locale detail row, and reads each back field for field.
- `vitest.config.ts` — added `catalog/**` to the `server` project's `include` and to the
  `client` project's `exclude`.
- `tsconfig.node.json` — added `"catalog"` to `include`.

## AC coverage

- AC-1 (category stored/retrieved with same id, name, description) — `SC-01`.
- AC-2 (product indicates its category relationship) — `SC-02`, via the `catid` foreign key.
- AC-3 (item contains all attributes incl. five dynamic attributes, both prices, image) —
  `SC-03`, all 13 fields asserted.
- AC-4/AC-5 (six tables, keys, `ON DELETE CASCADE`, committed migration, five indexes) —
  `db/schema.ts` + `drizzle/0004_sloppy_ultimates.sql`, inspected directly against
  INTERFACES.md § Tables.
- AC-6 (`catalog/types.ts` exports exactly the fixed shapes) — `catalog/types.ts`.
- AC-7 (round-trip test) — `catalog/schema.test.ts`.
- AC-8 (tests run in the `server` project; a `routes/` file importing `catalog/`
  type-checks) — `vitest.config.ts`/`tsconfig.node.json` changes; verified with a temporary
  probe file under `routes/api/` importing `catalog/types.ts` through `bun run typecheck`
  (removed after verification, not committed).

## Verification

```
$ NODE_ENV=test bun --bun vitest run catalog/schema.test.ts   # red, before migration existed
SQLiteError: no such table: category
3 failed (3)

$ bun run verify                                              # green, full gate
lint ✓  typecheck ✓  122 passed (0 failed)
```

See `tdd-test-result.md` — `TDD-RESULT: 122 passed, 0 failed`.

## Notes

- `verify:full`'s E2E tier cannot launch Chromium in this container (not installed,
  confirmed via the `pretest:e2e` preflight); `verify` (lint + typecheck + full unit suite)
  is the gate actually satisfied here, per AGENTS.md's own guidance to fall back rather than
  retry or install. No E2E specs are owned by this ticket.
- `db/client.ts` is untouched — it is not in this ticket's file ownership, and existing
  capability modules (`account/`) already show that a table need not be added to the
  `drizzle()` schema object to be queried directly, so no change was needed there.
