# SWHM-T-0073 — Database Schema

**Change:** `swhm-i-0005-multi-language-support` · **Group:** `## 2. Database Schema` (2.1–2.4)
**Requirement:** Locale-based content retrieval

> Read `openspec/changes/swhm-i-0005-multi-language-support/` first, then
> `artifacts/SWHM-S-0007/PLANNING-NOTES.md` § Spec discrepancies S2 and S4 — they are why this ticket
> is small and why it deliberately does not add data.

## Objective

Assert the seeded per-locale coverage that three other tickets in this sprint depend on. Boxes 2.1–2.3
are already shipped (S2) and box 2.4 is deliberately partial by product decision (S4); what is missing
is an assertion, not a column and not a row.

## Why this is worth a ticket

The sprint's most visible screen state — "No products in 中文 yet" — exists **because** `zh_CN` has no
product or item rows. Nothing in the repository says so. A future agent tidying up the seed would read
the missing Chinese translations as an oversight, fill them in, and delete a specified behaviour
without a single failing test. Three things rest on the coverage being exactly what it is:

- `en_US` complete → the "View in English (US)" recovery action always has content to show.
- `ja_JP` complete → the Japanese screens in the mockup are fully translated, and the delta spec's
  `犬` scenario holds.
- `zh_CN` categories only → the unavailable-in-this-language state has a real fixture, reachable in a
  browser by SWHM-T-0076 without seeding anything test-specific.

## Steps

1. Read `catalog/seed.test.ts`. It already covers categories across all three locales (ST-03), the
   `犬` localization (ST-02) and the absence of `de_DE` (ST-07). Products and items are uncovered.
2. Add an assertion that **every** product in `CATALOG_SEED` has `product_details` rows for both
   `en_US` and `ja_JP`, and every item has `item_details` rows for both. Walk the seeded tables via
   `db`, the way ST-03 does, rather than asserting against the `CATALOG_SEED` literal alone — the
   literal is the input, the rows are what a query reads.
3. Add an assertion that **no** product and **no** item carries a `zh_CN` row, with a comment naming
   this as the deliberate fixture for the unavailable-in-this-language state and citing the idea's
   Out of Scope. The comment is the part that stops the next well-meaning edit.
4. Change nothing else. `db/schema.ts` and `drizzle/` come out of this ticket byte-identical; if you
   find yourself generating a migration, re-read S2.

## Fixed interface contracts

None — this ticket adds no exported surface. The invariant it pins **is** the contract other tickets
rely on:

| Entity              | `en_US` | `ja_JP` | `zh_CN` | `de_DE` |
| ------------------- | ------- | ------- | ------- | ------- |
| category (all five) | yes     | yes     | yes     | no      |
| product (all)       | yes     | yes     | **no**  | no      |
| item (all)          | yes     | yes     | **no**  | no      |

## File / module ownership

`catalog/seed.test.ts` — and nothing else.

Not this ticket's: `catalog/seed.ts` (the data is correct as it stands), `db/schema.ts`, `drizzle/`,
and every other file in the sprint.

## Definition of Done

AC-1 through AC-5 on the ticket. AC-1 is the delta spec's `犬` scenario, already covered by ST-02 —
confirm it still holds rather than duplicating it. AC-2 and AC-3 are the two new assertions. AC-4 is
the no-migration constraint from step 4. AC-5 is a placement constraint: `catalog/**/*.test.ts` is
already registered in Vitest's `server` project (`vitest.config.ts:63`), which is mandatory because
the file reaches `db/client.ts` and its `bun:sqlite` import — the jsdom project cannot resolve that
builtin at all.

## Gotchas

- `seedCatalog()` runs once per file in `beforeAll`, not per test — a second call violates the
  `category` table's primary key. Add tests to the existing `describe`, do not open a second one that
  re-seeds.
- Under Vitest the database is in-memory (`db/client.ts` keys off `VITEST=true`), so these assertions
  never read the development `sqlite.db`.
- Asserting "no `zh_CN` product rows" as `toEqual([])` on a locale-filtered select reads clearly and
  fails with the offending rows in the message, which a bare count does not.
