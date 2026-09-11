---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHM-S-0004
ticket: SWHM-T-0048
idea: SWHM-I-0004
branch: vortex/sprint/swhm-s-0004-4d396966
upstream: [artifacts/SWHM-S-0004/INTERFACES.md]
downstream: [artifacts/SWHM-S-0004/SWHM-T-0048/summary.md]
---

# Plan — SWHM-T-0048: Catalog localization and demo seed

## Objective

A locale becomes a first-class input with one definition of what is supported, and the store gets a catalogue to show. The seed is the fixture the browser tier and every manual look at the app depend on, and it is deliberately invisible to the unit and integration tiers.

## Steps

1. Create `catalog/locale.ts` exporting `DEFAULT_LOCALE`, `isSupportedLocale` and `resolveLocale`. Take the supported list by importing `LANGUAGES` from `account/vocabulary.ts` — a second copy would drift from the one the account validator already enforces (`openspec/changes/swhm-i-0004-product-catalog-search/design.md` § Planning record, D8).
2. `resolveLocale` maps an absent or empty input to `DEFAULT_LOCALE` and passes any other string through unchanged. An unsupported locale is NOT rejected: the spec's own missing-locale scenario uses `de_DE`, and the specified outcome is an empty read, not an error (design.md § Planning record, D4).
3. Create `catalog/seed.ts` exporting `seedCatalog` and `CATALOG_SEED`, populating every row required by `artifacts/SWHM-S-0004/INTERFACES.md` § Seed data. Import `CATEGORIES` from `account/vocabulary.ts` for the five category ids.
4. Include the two exact strings the localization scenario asserts — `Dogs` for `DOGS` in `en_US` and `犬` in `ja_JP` — and the two search fixtures: an African Grey parrot matching both `large` and `african`, and a second parrot item matching `parrot` but not `african`.
5. Write no `de_DE` row for any entity. The missing-locale scenario depends on that locale being genuinely absent.
6. Call `seedCatalog` from `db/client.ts` only when the `category` table is empty AND `process.env.VITEST` is unset, following the existing `users` seed's shape directly above it (design.md § Planning record, D9).
7. Write `catalog/locale.test.ts` and `catalog/seed.test.ts`. The seed test calls `seedCatalog` directly against the in-memory database rather than relying on the import-time path, which is disabled under Vitest by step 6.

## File/module ownership

- `catalog/locale.ts`
- `catalog/locale.test.ts`
- `catalog/seed.ts`
- `catalog/seed.test.ts`
- `db/client.ts`

## Definition of Done

- AC-1 (`Localized catalog content — Category content is localized`) — the seeded `Dogs` / `犬` rows, asserted in `catalog/seed.test.ts`.
- AC-2 (`Localized catalog content — Missing locale data returns null`) — the absence of any `de_DE` row.
- AC-3 — `catalog/locale.ts` and its import from `account/vocabulary.ts`.
- AC-4 — the unsupported-locale behaviour.
- AC-5 — the seed's contents against § Seed data.
- AC-6 — the guarded call site in `db/client.ts`.
- AC-7 — the untouched `users` seed and its still-passing smoke probe.

## Design reference

_The idea carries no design blocks — `a2a_get_idea_design` returns an empty list, and the change's own § User Interface records that no screen records were extracted for this capability. Nothing was exported to `artifacts/SWHM-S-0004/design/`, and this ticket has no mockup to match._
