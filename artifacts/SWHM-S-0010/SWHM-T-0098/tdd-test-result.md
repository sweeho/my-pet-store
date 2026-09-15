---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0010
ticket: SWHM-T-0098
branch: vortex/fix/SWHM-T-0098-product-detail-page-shows-generic-not-fo-8175cf8e
upstream: [artifacts/SWHM-S-0010/SWHM-T-0098/PLAN.md]
---

# TDD result — SWHM-T-0098

## Test cases

| Test                                                                                        | Covers           | Intent                                                                                                              |
| ------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/pages/catalog/shared.test.ts › useCatalogFetch › FC-01..FC-04`                         | AC-1, AC-4       | the shared hook surfaces `reason` from a 404 body, defaulting to `"not-found"` on a missing/unparseable body        |
| `src/pages/catalog/product/[productId].test.tsx › PT-02b`                                   | AC-1, AC-2       | an untranslated product renders the recovery panel, not Not Found, and "View in English (US)" works                 |
| `src/pages/catalog/category/[categoryId].test.tsx › PT-02b`                                 | AC-1             | the previously-latent category instance of the same fault is closed                                                 |
| `src/pages/catalog/UnavailableInLanguage.test.tsx › UL-03b`                                 | AC-3             | `entity="product"` renders "This product has nothing translated…", not "item"                                       |
| `src/pages/catalog/product/[productId].test.tsx › PT-02` (existing, unchanged)              | AC-4             | an unknown product id still reaches Not Found                                                                       |
| `src/pages/catalog/product/[productId].test.tsx › PT-04, PT-05` (existing, unchanged)       | AC-5             | the empty-item-list `showUnavailable` path is untouched                                                             |
| `src/pages/catalog/item/[itemId].test.tsx` (existing, unchanged)                            | —                | the item screen's rendered output is byte-identical after moving to the shared hook                                 |
| `e2e/language.spec.ts › an untranslated product reaches the unavailable-in-language panel…` | AC-1, AC-3, AC-4 | browser-tier mirror of the item-screen assertion; not runnable in this container (see PLAN.md § Definition of Done) |

## Red run

`bun --bun vitest run src/pages/catalog/shared.test.ts src/pages/catalog/product/[productId].test.tsx src/pages/catalog/category/[categoryId].test.tsx src/pages/catalog/item/[itemId].test.tsx src/pages/catalog/UnavailableInLanguage.test.tsx`

Run against the pre-fix source (the fix commits were `git stash`-ed so only the new tests were
present):

```
FAIL  |client| src/pages/catalog/UnavailableInLanguage.test.tsx > UnavailableInLanguage > UL-03b: entity="product" names the product, not an item, when noun is omitted (SWHM-T-0098)
FAIL  |client| src/pages/catalog/shared.test.ts > useCatalogFetch > FC-01: resolves data with a null reason on a successful response
FAIL  |client| src/pages/catalog/shared.test.ts > useCatalogFetch > FC-02: a 404 body's reason field is surfaced as-is (missing-translation)
FAIL  |client| src/pages/catalog/shared.test.ts > useCatalogFetch > FC-03: a 404 body with no reason field defaults to not-found
FAIL  |client| src/pages/catalog/shared.test.ts > useCatalogFetch > FC-04: a 404 whose body fails to parse as JSON defaults to not-found instead of hanging
FAIL  |client| src/pages/catalog/category/[categoryId].test.tsx > CategoryPage (/catalog/category/:categoryId) > PT-02b: reason missing-translation shows the unavailable-in-language state, not the not-found screen (SWHM-T-0098)
FAIL  |client| src/pages/catalog/product/[productId].test.tsx > ProductPage (/catalog/product/:productId) > PT-02b: reason missing-translation shows the unavailable-in-language state, naming the product, not the not-found screen (SWHM-T-0098)

 Test Files  4 failed | 1 passed (5)
      Tests  7 failed | 35 passed (42)
```

(`TestingLibraryElementError: Unable to find role="heading" and name "Not available in 中文 yet"` —
the product/category screens rendered the generic "Not Found" heading instead, confirming the
defect.)

## Green run

`bun run verify` — this stack's full gate (`eslint . --max-warnings 0` → `tsc --build` →
`NODE_ENV=test bun --bun vitest run`), run after restoring the fix:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  56 passed (56)
      Tests  318 passed (318)
```

The browser tier (`bun run test:e2e`) was attempted and fails fast at the documented preflight —
`scripts/ensure-playwright-browser.mjs` reports Chromium is genuinely not installed in this
container (AGENTS.md § Notes from previous agents / § Test & validate). Not retried; the extended
`e2e/language.spec.ts` runs in CI on this branch and again at INTEGRATION_QA.

TDD-RESULT: 318 passed, 0 failed
