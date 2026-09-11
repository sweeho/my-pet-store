---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0050
branch: vortex/feat/SWHM-T-0050-catalog-query-composition-layer-c492320b
upstream: [artifacts/SWHM-S-0004/SWHM-T-0050/PLAN.md]
downstream:
  [
    artifacts/SWHM-S-0004/SWHM-T-0051/PLAN.md,
    artifacts/SWHM-S-0004/SWHM-T-0052/PLAN.md,
    artifacts/SWHM-S-0004/SWHM-T-0053/PLAN.md,
    artifacts/SWHM-S-0004/SWHM-T-0054/PLAN.md,
  ]
---

# Summary — SWHM-T-0050: Catalog query composition layer

## What changed

Added `catalog/query.ts`, the one module that composes how a catalogue query is built:
`paginatedQuery` (the `count + 1` limit/offset request inside one `readConsistent`
transaction, handed to `buildPage`), `localeJoin` (the single `locale = ?` condition), and
`searchPredicate` (AND across keywords, OR across fields, with `%`/`_`/backslash escaped so
a keyword matches literally). Every retrieval and search service from here on reads through
this module rather than composing its own SQL.

## Files

- `catalog/query.ts` — new: `paginatedQuery`, `localeJoin`, `searchPredicate`.
- `catalog/query.test.ts` — new: pagination at first/middle/final/out-of-range positions
  plus a negative-start short-circuit and a single-call assertion (`PQ-*`); locale
  filtering (`LJ-*`); AND/OR/case-insensitive/wildcard-escaping search matching (`SQ-*`).

## AC coverage

- AC-1 (exported signatures against § Query composition) — `catalog/query.ts`.
- AC-2 (`count+1` via limit/offset, through `buildPage`, inside `readConsistent`) — `PQ-01`
  through `PQ-03` (row counts/`hasNext`), `PQ-05` (negative start never calls `build`),
  `PQ-06` (`build` called exactly once with `(count+1, start)` — the rows and `hasNext`
  come from the same call, hence the same transaction).
- AC-3 (drizzle query builder throughout, no assembled SQL string) — `localeJoin` is
  `eq()`; `searchPredicate` uses `sql` as a parameterized tagged template (the same
  primitive drizzle's own `like()` is implemented with), never string concatenation of a
  keyword into a query.
- AC-4 (`localeJoin` as the single locale-condition definition) — `LJ-01`–`LJ-03`.
- AC-5 (AND/OR structure, literal wildcard matching) — `SQ-01`–`SQ-05`.
- AC-6 (four page positions against a seeded fixture table) — `PQ-01`–`PQ-04`, a 5-row
  `category` fixture.

## Verification

```
$ NODE_ENV=test bun --bun vitest run catalog/query.test.ts   # red, catalog/query.ts moved aside
Error: Cannot find module './query'
Test Files  1 failed (1)

$ bun run verify                                             # green, full gate
lint ✓  typecheck ✓  168 passed (0 failed)
```

See `tdd-test-result.md` — `TDD-RESULT: 168 passed, 0 failed`.

## Notes

- `searchPredicate`'s signature takes a second `fields: AnySQLiteColumn[]` parameter not
  shown in INTERFACES.md's one-line stub (`searchPredicate(keywords: string[])`). Unlike
  `paginatedQuery`, that stub carries no return type or full parameter list — "OR across
  fields" is not expressible without the field columns being passed in, and no other
  source names how they would otherwise reach this module. Minor deviation, no fixed
  contract changed (the stub was never a complete type); documented here per the
  deviation protocol rather than escalated.
- `localeJoin` takes the whole details-table object (typed structurally as `{ locale:
AnySQLiteColumn }`) rather than a bare column, matching the stub's `detailsTable`
  parameter name and leaving room for it to reference other columns of that table later.
- SQLite's `LIKE` is case-insensitive for ASCII by default, so `searchPredicate` needs no
  `LOWER()` on either side — the legacy's explicit `LOWER()` calls (design.md § Search
  Implementation) are redundant here, not a behavior this module is missing.
- `verify:full`'s E2E tier cannot launch Chromium in this container (confirmed via the
  `pretest:e2e` preflight); `verify` (lint + typecheck + full unit suite) is the gate
  actually satisfied here, per AGENTS.md's guidance to fall back rather than retry or
  install. No E2E specs are owned by this ticket.
