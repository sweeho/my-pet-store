---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0009
ticket: SWHM-T-0095
branch: vortex/fix/SWHM-T-0095-no-catalog-item-ships-a-real-product-ima-95db0853
upstream: [artifacts/SWHM-S-0009/SWHM-T-0095/PLAN.md]
---

# TDD result — SWHM-T-0095

## Test cases

| Test                                                                                                            | Covers     | Intent                                                                                                                |
| --------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| `catalog/seed-images.test.ts › IT-01: every distinct seeded image location is a file the app actually ships`    | AC-1       | every distinct `image` value in `CATALOG_SEED` resolves to a real file under `public/`                                |
| `catalog/seed-images.test.ts › IT-02: the seed names exactly the 20 distinct illustrations this ticket shipped` | AC-4       | pins the exact set of 20 shipped locations against future drift                                                       |
| `e2e/catalog.spec.ts › browses categories to products to an item...` (extended)                                 | AC-2, AC-3 | item detail's rendered image `src` is the item's own location, and no `image`-typed response in the journey is non-OK |

AC-3 (placeholder shown with correct alt text when unavailable) is already covered by the
untouched `src/pages/catalog/item/[itemId].test.tsx › PT-08`, per PLAN.md step 6 — not
re-tested here. AC-5 (`imageLocation` field unchanged) is a "nothing moved" property, evidenced
by `catalog/item.test.ts` and `routes/api/catalog/**` tests continuing to pass unmodified (see
Green run).

## Red run

`bun --bun vitest run catalog/seed-images.test.ts` — run against the seed still pointing at the
missing `.jpg` locations (`catalog/seed.ts` temporarily reverted to `git show HEAD:catalog/seed.ts`,
before the `.svg` illustrations existed as far as the seed's own values were concerned):

```
 ❯ |server| catalog/seed-images.test.ts (2 tests | 2 failed) 5ms
     × IT-01: every distinct seeded image location is a file the app actually ships 3ms
     × IT-02: the seed names exactly the 20 distinct illustrations this ticket shipped 1ms

 FAIL  |server| catalog/seed-images.test.ts > catalog/seed image assets > IT-01: every distinct seeded image location is a file the app actually ships
AssertionError: /images/birds/african-grey.jpg does not exist under public/: expected false to be true // Object.is equality

 Test Files  1 failed (1)
      Tests  2 failed (2)
error: "vitest" exited with code 1
```

## Green run

`bun run verify` — this stack's full pre-commit gate (`eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0 && tsc --build && NODE_ENV=test bun --bun vitest run`),
run after restoring the `.svg` seed values and adding the 20 illustrations:

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  56 passed (56)
      Tests  304 passed (304)
   Duration  4.57s
```

`bun run test:e2e` (the browser tier, part of `verify:full`) does not run in this
implementation container — `scripts/ensure-playwright-browser.mjs` reports Chromium is
genuinely not installed here, matching AGENTS.md's existing "Notes from previous agents" entry
for this same sprint. Not retried, per that note and design.md's Verification note; the
`e2e/catalog.spec.ts` extension is observed in CI on this branch and again at INTEGRATION_QA.

TDD-RESULT: 304 passed, 0 failed
