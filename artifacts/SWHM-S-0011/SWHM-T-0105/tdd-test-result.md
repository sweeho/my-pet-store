---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0011
ticket: SWHM-T-0105
branch: vortex/fix/SWHM-T-0105-category-page-s-untranslated-panel-calls-c797e991
upstream: [artifacts/SWHM-S-0011/SWHM-T-0105/PLAN.md]
---

# TDD result — SWHM-T-0105

## Test cases

| Test                                                                                                                                                                                             | Covers     | Intent                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------ |
| `src/pages/catalog/category/[categoryId].test.tsx › PT-02b`                                                                                                                                      | AC-1       | the category screen's untranslated panel names the category, not an item, in its body text |
| `src/pages/catalog/UnavailableInLanguage.test.tsx › UL-03c`                                                                                                                                      | AC-1       | the panel renders `entity="category"` as "This category …" when `noun` is omitted          |
| `src/pages/catalog/UnavailableInLanguage.test.tsx › UL-03b` (pre-existing, unchanged assertion)                                                                                                  | AC-2       | the panel still renders `entity="product"` as "This product …", unmoved by this fix        |
| `src/pages/catalog/UnavailableInLanguage.test.tsx › UL-03` (pre-existing, unchanged assertion)                                                                                                   | AC-3       | the panel still renders `entity="item"` as "This item …", unmoved by this fix              |
| `src/pages/catalog/category/[categoryId].test.tsx › PT-02` / `src/pages/catalog/product/[productId].test.tsx › PT-02` / `src/pages/catalog/item/[itemId].test.tsx` not-found case (pre-existing) | AC-4       | an unknown id still reaches Not Found on all three screens                                 |
| `e2e/language.spec.ts › an untranslated category reaches the unavailable-in-language panel …`                                                                                                    | AC-1, AC-4 | browser-tier mirror; not executed in this container — see § Green run                      |

## Red run

`bun --bun vitest run "src/pages/catalog/category/[categoryId].test.tsx" -t "PT-02b"` — run against the pre-fix source (the `entity` default of `"item"` and no subject passed from the category screen's `missing-translation` branch):

```
FAIL  |client| src/pages/catalog/category/[categoryId].test.tsx > CategoryPage (/catalog/category/:categoryId) > PT-02b: reason missing-translation shows the unavailable-in-language state, not the not-found screen (SWHM-T-0098)
TestingLibraryElementError: Unable to find an element with the text: This category has nothing translated into 中文. Nothing has gone wrong — it exists, but not in this language.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.
...
 Test Files  1 failed (1)
      Tests  1 failed | 6 skipped (7)
```

The rendered DOM in the failure output showed the panel body as "This item has nothing translated into 中文 …" — confirming the reported defect.

## Green run

`bun run verify` (this stack's full pre-commit gate — `eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0` + `tsc --build` + `NODE_ENV=test bun --bun vitest run`), run against the fixed source:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  56 passed (56)
      Tests  319 passed (319)
```

Browser tier (`bun run test:e2e -- e2e/language.spec.ts`) was attempted and fails its preflight in this implementation container — no Chromium installed (`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed"). Per design.md § Verification note and `AGENTS.md`'s "Implementation containers do not ship a Chromium" note, this is expected here; the spec runs in CI on this branch and again at integration QA. Not retried, no browser installed.

TDD-RESULT: 319 passed, 0 failed
