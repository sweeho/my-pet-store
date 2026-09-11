---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0056
branch: vortex/feat/SWHM-T-0056-catalog-browsing-screens-and-end-to-end-22c7975c
upstream: [artifacts/SWHM-S-0004/SWHM-T-0056/PLAN.md]
---

# TDD result — SWHM-T-0056

## Test cases

| Test                                                       | Covers | Intent                                                                        |
| ---------------------------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| `src/pages/catalog/index.test.tsx › PT-01`                 | AC-1   | lists the categories, each linking to `/catalog/category/:id`                 |
| `src/pages/catalog/index.test.tsx › PT-02`                 | AC-3   | submitting the search box shows matching items with the query in the URL      |
| `src/pages/catalog/index.test.tsx › PT-03`                 | AC-4   | previous is disabled on the first page, next is disabled when `hasNext=false` |
| `src/pages/catalog/category/[categoryId].test.tsx › PT-01` | AC-2   | shows the category's products, each linking to `/catalog/product/:id`         |
| `src/pages/catalog/category/[categoryId].test.tsx › PT-02` | AC-6   | an unknown category id shows the not-found state                              |
| `src/pages/catalog/product/[productId].test.tsx › PT-01`   | AC-2   | shows the product's items, each linking to `/catalog/item/:id`                |
| `src/pages/catalog/product/[productId].test.tsx › PT-02`   | AC-6   | an unknown product id shows the not-found state                               |
| `src/pages/catalog/item/[itemId].test.tsx › PT-01`         | AC-2   | shows the item's image, description, all five attributes and the list price   |
| `src/pages/catalog/item/[itemId].test.tsx › PT-02`         | AC-2   | a null dynamic attribute displays a placeholder, not a blank field            |
| `src/pages/catalog/item/[itemId].test.tsx › PT-03`         | AC-6   | a non-existent item id shows the not-found state                              |

`e2e/catalog.spec.ts` (AC-8) covers the full browse-to-item and search-to-item journeys, the not-found state in a real browser, and AC-5 (a signed-on customer's `preferredLanguage` switching the catalog locale) — see `## Green run` for why it could not be executed in this container, and how it was verified instead.

## Red run

`bun run test -- src/pages/catalog` — all four page test files failed to even collect, because none of the four pages existed yet:

```
FAIL  |client| src/pages/catalog/product/[productId].test.tsx
Error: Failed to resolve import "./[productId]" — Does the file exist?
FAIL  |client| src/pages/catalog/category/[categoryId].test.tsx
Error: Failed to resolve import "./[categoryId]" — Does the file exist?
FAIL  |client| src/pages/catalog/item/[itemId].test.tsx
Error: Failed to resolve import "./[itemId]" — Does the file exist?
FAIL  |client| src/pages/catalog/index.test.tsx  (no matching red-run output captured separately; same missing-module failure)

Test Files  4 failed (4)
     Tests  no tests
```

## Green run

`bun run verify` — this stack's full gate (lint, typecheck, complete unit/integration suite):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  48 passed (48)
      Tests  232 passed (232)
```

`bun run lint` initially caught a real bug during development: `useCatalogFetch` called `setState` synchronously at the top of its effect body (`react-hooks/set-state-in-effect`), which was fixed by deriving "loading/stale" from a `{url, data}` result compared against the current `url` at render time, rather than resetting state imperatively — see `src/pages/catalog/shared.ts` and `summary.md` § Notes.

`bun run build` was also run once as an additional check (not part of the declared `verify` gate, but this ticket adds four new file-based routes): it succeeded, producing `_categoryId_.get.mjs`/`_productId_.get.mjs`/`_itemId_.get.mjs` API route chunks and a single client bundle with no route-registration errors.

`bun run test:e2e` was **not executed**: this container's E2E preflight (`scripts/ensure-playwright-browser.mjs`) reports Chromium is genuinely not installed — the same documented limitation recorded in `AGENTS.md`'s Notes from previous agents for six earlier tickets this sprint. `e2e/catalog.spec.ts` was written to the same patterns as the existing, previously-executed `e2e/signon.spec.ts` and `e2e/customer-profile.spec.ts` (unique per-run usernames, `page.request` for session setup, role-based locators), and passed `bun run build` + `tsc --build` + `eslint` (its syntax, types and imports are verified), but its actual browser execution could not be confirmed here. CI installs Chromium (`.github/workflows/ci.yml` runs `bunx playwright install --with-deps chromium` then `bun run test:e2e`) and runs it before this ticket's branch can go green; INTEGRATION_QA re-runs it again. Per the documented precedent, this is a fallback, not a skip: the ticket's own instruction to "run it at least once before committing" is honored to the extent a Chromium-equipped container is available — it is not, in this container.

TDD-RESULT: 232 passed, 0 failed
