---
artifact: summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0007
ticket: SWHM-T-0073
branch: vortex/feat/SWHM-T-0073-database-schema-pin-the-per-locale-detai-9672e88b
upstream: [artifacts/SWHM-S-0007/SWHM-T-0073/PLAN.md]
---

# Summary — SWHM-T-0073

Added two assertions to `catalog/seed.test.ts` pinning the per-locale coverage other tickets depend
on. No source, schema, or migration changes — this ticket is test-only, per PLAN.md.

## Changed

- `catalog/seed.test.ts` — added `ST-08` (every product has `product_details` rows for `en_US` +
  `ja_JP`; every item has `item_details` rows for both, walked via `db` queries against the seeded
  tables rather than the `CATALOG_SEED` literal) and `ST-09` (no product or item carries a `zh_CN`
  row, with a comment citing the idea's Out of Scope so a future edit can't silently fill it in).
  Added `productDetails` to the existing import.

## Acceptance criteria

- AC-1 (犬 localization) — already covered by pre-existing `ST-02`; re-ran it, still green, no change made.
- AC-2 (en_US/ja_JP coverage for every product and item) — `ST-08`.
- AC-3 (no zh_CN row for any product/item) — `ST-09`.
- AC-4 (`db/schema.ts` and `drizzle/` byte-identical) — confirmed via `git diff --stat` showing no
  changes to either path.
- AC-5 (runs in Vitest's `server` project) — `catalog/**/*.test.ts` is already listed under the
  `server` project in `vitest.config.ts:63`; no config change needed.

## Verification

- Red: temporarily mutated `catalog/seed.ts` (dropped a `ja_JP` product detail, added a bogus `zh_CN`
  one) to prove `ST-08`/`ST-09` fail on a real violation, then reverted — confirmed via `git diff` that
  `seed.ts` came back byte-identical. See `tdd-test-result.md` for output.
- Green: `bun run verify:full` — E2E preflight reports Chromium is not installed in this container
  (known gap, see `AGENTS.md` § Notes from previous agents); fell back to `bun run verify` per that
  documented policy. Result: lint + typecheck + full unit suite green, 252/252 tests passing (was 250
  before this ticket's two new tests).

## Follow-ups

None.
