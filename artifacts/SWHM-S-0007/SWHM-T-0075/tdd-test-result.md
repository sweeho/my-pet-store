---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0007
ticket: SWHM-T-0075
branch: vortex/feat/SWHM-T-0075-content-management-show-localized-conten-93a95617
upstream: [artifacts/SWHM-S-0007/SWHM-T-0075/PLAN.md]
---

# TDD result — SWHM-T-0075

## Test cases

| Test                                           | Covers                       | Intent                                                                                                                                               |
| ---------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UnavailableInLanguage.test.tsx › UL-01/02/03` | AC-3, AC-4, AC-6             | heading/body copy per noun (products/items/omitted), language named in its own script                                                                |
| `UnavailableInLanguage.test.tsx › UL-04`       | AC-3                         | primary action calls `onViewInEnglish`; secondary "Change language" action exists                                                                    |
| `index.test.tsx › PT-04`                       | AC-2, AC-7                   | language control renders and a `role="status"` pending region names what's loading while the categories/search fetch is in flight                    |
| `index.test.tsx › PT-05`                       | AC-8                         | `document.documentElement.lang` matches the active locale                                                                                            |
| `[categoryId].test.tsx › PT-03`                | AC-2, AC-7                   | control + pending region while the category/products fetch is in flight                                                                              |
| `[categoryId].test.tsx › PT-04`                | AC-1, AC-3                   | zh_CN empty product list → unavailable-in-language state; category's own zh_CN name/description still render; "View in English (US)" switches locale |
| `[categoryId].test.tsx › PT-05`                | AC-5                         | en_US empty product list stays an empty list (no unavailable state)                                                                                  |
| `[categoryId].test.tsx › PT-06`                | AC-8                         | `document.documentElement.lang` set on load via `?locale=`                                                                                           |
| `[productId].test.tsx › PT-03..06`             | AC-2, AC-3, AC-5, AC-7, AC-8 | same four behaviours, product/items list                                                                                                             |
| `[itemId].test.tsx › PT-03`                    | AC-4                         | reason `not-found` → existing Not Found screen (regression, now asserts `reason` survives)                                                           |
| `[itemId].test.tsx › PT-04`                    | AC-4                         | reason `not-found` under zh_CN also shows Not Found, not the unavailable state                                                                       |
| `[itemId].test.tsx › PT-05`                    | AC-4                         | reason `missing-translation` shows the unavailable-in-language state, distinct from Not Found                                                        |
| `[itemId].test.tsx › PT-06`                    | AC-2, AC-7                   | control + pending region while the item fetch is in flight                                                                                           |
| `[itemId].test.tsx › PT-07`                    | AC-8                         | `document.documentElement.lang` set on load                                                                                                          |

AC-1 (犬 localization, category retrieval) is a data-layer scenario already covered upstream
(`catalog/seed.test.ts` ST-02, `catalog/category.test.ts`) — unaffected by this ticket; the category
page test's zh_CN case (PT-04) exercises the same retrieval path at the UI layer.

## Red run

`bun --bun vitest run "src/pages/catalog/index.test.tsx" "src/pages/catalog/category/[categoryId].test.tsx" "src/pages/catalog/product/[productId].test.tsx" "src/pages/catalog/item/[itemId].test.tsx" "src/pages/catalog/UnavailableInLanguage.test.tsx"`

Run against the pre-ticket implementation (the four page `.tsx` files, `vite.config.ts` and the new
`UnavailableInLanguage.tsx` temporarily reverted/removed via `git stash`, test files kept):

```
 FAIL  |client| src/pages/catalog/UnavailableInLanguage.test.tsx [ src/pages/catalog/UnavailableInLanguage.test.tsx ]
Error: Failed to resolve import "./UnavailableInLanguage" from "src/pages/catalog/UnavailableInLanguage.test.tsx". Does the file exist?

 FAIL  |client| src/pages/catalog/index.test.tsx > ... PT-04: the language control renders while the first fetch is still in flight ...
 FAIL  |client| src/pages/catalog/index.test.tsx > ... PT-05: sets document.documentElement.lang ...
 FAIL  |client| src/pages/catalog/category/[categoryId].test.tsx > ... PT-03: the language control renders ...
 FAIL  |client| src/pages/catalog/category/[categoryId].test.tsx > ... PT-04: an empty product list under a non-English locale ...
 FAIL  |client| src/pages/catalog/category/[categoryId].test.tsx > ... PT-06: sets document.documentElement.lang ...
 FAIL  |client| src/pages/catalog/item/[itemId].test.tsx > ... PT-05: reason missing-translation ...
 FAIL  |client| src/pages/catalog/item/[itemId].test.tsx > ... PT-06: the language control renders ...
 FAIL  |client| src/pages/catalog/item/[itemId].test.tsx > ... PT-07: sets document.documentElement.lang ...
 FAIL  |client| src/pages/catalog/product/[productId].test.tsx > ... PT-03: the language control renders ...
 FAIL  |client| src/pages/catalog/product/[productId].test.tsx > ... PT-04: an empty item list under a non-English locale ...
 FAIL  |client| src/pages/catalog/product/[productId].test.tsx > ... PT-06: sets document.documentElement.lang ...

 Test Files  5 failed (5)
      Tests  11 failed | 13 passed (24)
```

`UnavailableInLanguage.test.tsx` fails at module resolution (the component doesn't exist yet under
this reverted state) rather than as individual test failures, so its 4 cases aren't in the "24" —
that count is the four page test files only (5+6+6+7=24). The 13 passes there are the pre-existing
regression cases (list rendering, not-found by boolean, en_US empty-list) that this ticket doesn't
change — confirming the 11 failures plus the one module-resolution failure are exactly the new
behaviour this ticket adds, not a broken harness. Implementation was then restored (`git stash pop` +
`UnavailableInLanguage.tsx` recreated).

## Green run

`bun run verify:full` — E2E preflight reports Chromium genuinely not installed in this container
(`ensure-playwright-browser.mjs`), the known gap for implementation containers (see `AGENTS.md` §
Notes from previous agents). Falling back to `bun run verify` per that documented policy.

`bun run verify` (lint + typecheck + full unit suite, against the restored implementation):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  55 passed (55)
      Tests  297 passed (297)
```

TDD-RESULT: 297 passed, 0 failed
