---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0048
branch: vortex/feat/SWHM-T-0048-catalog-localization-and-demo-seed-505b0ce4
upstream: [artifacts/SWHM-S-0004/SWHM-T-0048/PLAN.md]
downstream: [artifacts/SWHM-S-0004/qa-test-report.md]
---

# Summary — SWHM-T-0048: Catalog localization and demo seed

## What changed

Added `catalog/locale.ts` (locale resolution, importing `LANGUAGES` from `account/vocabulary.ts` rather than duplicating it) and `catalog/seed.ts` (the demo catalog fixture: five categories, two products per category, two items per product). Wired `seedCatalog()` into `db/client.ts` behind a guard so it runs only when the `category` table is empty and `VITEST` is unset.

## Files

- `catalog/locale.ts` — `DEFAULT_LOCALE`, `isSupportedLocale`, `resolveLocale`.
- `catalog/locale.test.ts` — unit tests for the three exports.
- `catalog/seed.ts` — `CATALOG_SEED` data and `seedCatalog()` insert logic.
- `catalog/seed.test.ts` — assertions against `INTERFACES.md` § Seed data's minimum content.
- `db/client.ts` — imports `seedCatalog` and `category`, adds the empty-table + non-Vitest guard, directly below the existing `users` seed.

## AC coverage

- AC-1 (Category content is localized) — `catalog/seed.ts`'s `DOGS` category details; `seed.test.ts › ST-02`.
- AC-2 (Missing locale data returns null) — no `de_DE` row is ever written; `seed.test.ts › ST-07`. (The `null` return itself is `catalog/category.ts`'s behavior, SWHM-T-0051 — out of this ticket's file ownership.)
- AC-3 (`locale.ts` exports + imports `LANGUAGES`) — `catalog/locale.ts:1,5-7`; `locale.test.ts › LT-01, LT-02`.
- AC-4 (unsupported locale is not an error) — `resolveLocale` passes it through unchanged; `locale.test.ts › LT-03, LT-07`. The `null`/`EMPTY_PAGE` read outcome belongs to the query-level tickets (SWHM-T-0050 onward), which read through `isSupportedLocale`/`resolveLocale`.
- AC-5 (seed contents) — `catalog/seed.ts`'s `CATALOG_SEED`; `seed.test.ts › ST-01, ST-03, ST-04, ST-05, ST-06`.
- AC-6 (guarded seed call site) — `db/client.ts:41-43`.
- AC-7 (users seed / smoke probe unchanged) — the `users` seed block is untouched; `bun run verify`'s full unit suite (136/136) includes the existing route-level tests over `routes/api/users/`.

## Verification

```
$ bun run test -- catalog/locale.test.ts catalog/seed.test.ts   # red, before locale.ts/seed.ts existed
Test Files  2 failed (2)
     Tests  no tests

$ bun run verify   # green, full gate
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
Test Files  30 passed (30)
     Tests  136 passed (136)
```

See `tdd-test-result.md` — `TDD-RESULT: 136 passed, 0 failed`.

`bun run test:e2e` / `bun run verify:full` were not run: the E2E preflight reports Chromium is genuinely missing in this container (see `tdd-test-result.md` § Green run and `AGENTS.md`'s Notes from previous agents). E2E runs in CI and at INTEGRATION_QA against the same `e2e/smoke.spec.ts`, whose database-backed probe (`GET /api/users`) is unaffected by this change — the `users` seed and its guard are untouched, and the new catalog seed guard is additive and independently conditioned on `VITEST`.

## Notes

`seedCatalog()` takes no arguments and imports `db` from `db/client.ts`, which in turn imports `seedCatalog` from `catalog/seed.ts` — a circular ES module import. This resolves cleanly because both modules only _use_ the other's binding inside function bodies (never at top-level module evaluation), which is safe under live ES module bindings; confirmed by the green run above (no module-resolution or TDZ error) and is the same pattern already exercised by `catalog/schema.test.ts` and `catalog/seed.test.ts` importing `db` directly.
