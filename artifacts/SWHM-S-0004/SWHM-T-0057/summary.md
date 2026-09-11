---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0057
branch: vortex/feat/SWHM-T-0057-catalog-performance-verification-35a6f41d
upstream: [artifacts/SWHM-S-0004/SWHM-T-0057/PLAN.md]
downstream: []
---

# Summary — SWHM-T-0057: Catalog performance verification

## What changed

Added `catalog/performance.test.ts` only — no source change, no new index, no schema
edit. It builds a 1,000-category / 2,000-product / 2,000-item fixture (three locales per
entity, matching `account/vocabulary.ts`'s real `LANGUAGES`) and asserts, against the
already-shipped retrieval/search/query modules: bounded pagination independent of catalog
size, correct search results at scale including a five-keyword AND query, `EXPLAIN QUERY
PLAN` index use on the three paginated reads, and that no caching hides a write from a
subsequent read.

## Files

- `catalog/performance.test.ts` — new. Fixture builder + 11 test cases (`PF-01`–`PF-11`)
  across four `describe` blocks: bounded pagination, search at scale, index use, no
  caching.

## AC coverage

- AC-1 (bounded page read, request size independent of catalog size) — `PF-01` (25 objects
  from 1,000 categories), `PF-02` (the compiled query's LIMIT parameter is `count+1`,
  derived only from the call arguments, never from table size).
- AC-2 (search at scale, correct 5-keyword result) — `PF-03` (bounded first page, correct
  `hasNext`), `PF-04` (exactly one match for a 5-keyword AND query over 2,000 items).
- AC-3 (category read uses the locale index) — `PF-05`.
- AC-4 (product/item reads use `product(catid)`/`item(productid)`) — `PF-06`, `PF-07`.
- AC-5 (no caching — a write is visible to the next read) — `PF-08`–`PF-11`, one per
  retrieval service.

## Verification

```
$ NODE_ENV=test bun --bun vitest run catalog/performance.test.ts   # red, single-locale fixture
PF-05 failed: category plan used SCAN category_details, not the index
10 passed | 1 failed (11)

$ NODE_ENV=test bun --bun vitest run catalog/performance.test.ts   # green, after the fixture fix
Test Files  1 passed (1)
     Tests  11 passed (11)

$ bun run verify                                                   # green, full gate
lint ✓  typecheck ✓  243 passed (0 failed)
```

See `tdd-test-result.md` — `TDD-RESULT: 243 passed, 0 failed`.

## Notes

- The first run's failure (`PF-05`) was a fixture defect, not a code defect: a fixture
  where every category has only one locale makes the locale index non-selective (it
  matches 100% of rows), so SQLite's cost-based planner correctly prefers a full scan over
  it — that is the right call for that data shape, not a bug. Fixed by giving every
  category/product/item a detail row in all three real locales (`en_US`/`ja_JP`/`zh_CN`),
  making each locale ~33% of its table, which is what a real internationalized catalog
  looks like and what makes the index worth using. `db.$client.run("ANALYZE")` runs once
  after seeding so the planner has real cardinality stats to reason from, the same way a
  production database accumulates them over time.
- `EXPLAIN QUERY PLAN` needs the raw `bun:sqlite` connection — drizzle's query builder has
  no EXPLAIN of its own. `db.$client` (assigned by `drizzle-orm/bun-sqlite`'s driver) is
  the same connection every read in `catalog/` already runs on, so this reads the real
  plan, not a second connection's.
- The three `EXPLAIN QUERY PLAN` queries and the AC-1 LIMIT-parameter check reconstruct
  the exact query shape `catalog/category.ts`/`product.ts`/`item.ts` compose internally
  (verified by reading their source) — those modules have no exported way to inspect their
  compiled SQL, and this ticket owns only `catalog/performance.test.ts`.
- `verify:full`'s E2E tier cannot launch Chromium in this container (confirmed via the
  `pretest:e2e` preflight); `verify` (lint + typecheck + full unit suite) is the gate
  actually satisfied here, per AGENTS.md's guidance to fall back rather than retry or
  install. No E2E specs are owned by this ticket.
