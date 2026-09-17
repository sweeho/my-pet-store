---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0021
ticket: SWHM-T-0237
branch: vortex/feat/SWHM-T-0237-header-tokens-and-shared-width-across-th-31ee6696
upstream: [artifacts/SWHM-S-0021/SWHM-T-0237/PLAN.md]
---

# TDD result — SWHM-T-0237

## Test cases

| Test                                                                                                                                                                                                                                                                                                                              | Covers           | Intent                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/pages/{about,cart,customer,payment,enter-order-information,order-completed,signon-welcome,user-creation-error,NotFound,catalog/index,catalog/category/[categoryId],catalog/product/[productId],catalog/item/[itemId]}.test.tsx › renders the shared header carrying the store mark, a catalogue link and a cart link (AC-1)` | AC-1, AC-2, AC-3 | one new test per owned screen asserting the store mark, Catalog and Cart links from `StoreHeader`                                                                  |
| `src/pages/catalog/index.test.tsx › fills the header's trailing slot with the language switcher (AC-5)`                                                                                                                                                                                                                           | AC-5             | the language switcher renders inside the header on a catalogue screen                                                                                              |
| `src/pages/index.test.tsx › renders the shared header …` / `› points the header's sign-in control at the sign-on screen`                                                                                                                                                                                                          | AC-1, AC-17      | home page carries the shared header instead of its bespoke one; Sign in still leads to `/signon`                                                                   |
| `src/pages/index.test.tsx › renders the hero heading and primary CTA that opens the catalogue`                                                                                                                                                                                                                                    | AC-16            | Get started still leads to `/catalog` after the rewrite onto tokens                                                                                                |
| `src/pages/index.test.tsx › requests no third-party asset …` / `› leaves no navigation or hero link as a placeholder fragment`                                                                                                                                                                                                    | AC-14, AC-18     | no `<img>`/hotlink for the mark, no off-origin `src`/`href`, no `#` placeholder link                                                                               |
| `src/pages/signon-welcome.test.tsx › welcomes the signed-on visitor by name …`                                                                                                                                                                                                                                                    | —                | pre-existing behaviour (new test file) preserved under the header                                                                                                  |
| `src/pages/user-creation-error.test.tsx › shows the error carried in navigation state` / `› falls back to a generic message` / `› renders a link back to sign-on`                                                                                                                                                                 | —                | pre-existing behaviour (new test file) preserved under the header                                                                                                  |
| `src/pages/NotFound.test.tsx › renders the not-found heading and message`                                                                                                                                                                                                                                                         | AC-13            | not-found screen keeps its message and now carries the header/store typography                                                                                     |
| `src/layout-width.test.ts › no screen under src/pages declares a page-level container max-w-* of its own`                                                                                                                                                                                                                         | AC-10            | repository-level guard: fails if any owned screen (or a future one) hardcodes a column width instead of the shared `CONTENT_WIDTH`/`ADMIN_CONTENT_WIDTH` constants |
| `src/palette-classes.test.ts › src/pages/{index,about}.tsx contains no raw Tailwind palette colour class`                                                                                                                                                                                                                         | AC-11            | repository-level guard: fails if home or About reintroduce a raw grey/indigo/white(etc.) class instead of the design tokens                                        |
| `e2e/home.spec.ts › the header holds together at a 375px viewport, without overlapping the hero title (AC-7)`                                                                                                                                                                                                                     | AC-7             | narrow-viewport check (design.md § Open questions O1) — not executed in this container, see Notes in `summary.md`                                                  |

Existing tests across all fourteen owned files (and the `[...all].test.tsx` re-export of `NotFound`) were also updated so their fetch mocks answer `StoreHeader`'s own `/api/signon/session` and `/api/cart` reads; those are pre-existing coverage carried forward, not new rows.

## Red run

`bun run test` (full project suite — these screens have no isolated single-file regression command; the ticket touches all of them at once). Real output, trimmed to the summary:

```
 Test Files  15 failed | 117 passed (132)
      Tests  18 failed | 880 passed (898)
```

The 18 failures were exactly: the 16 new "renders the shared header" / language-switcher-slot assertions across the owned screens (failing because no screen yet rendered `StoreHeader`), plus `src/layout-width.test.ts` and both `src/palette-classes.test.ts` cases (failing because `index.tsx`/`about.tsx` still declared their own widths and raw palette classes). No other test regressed.

## Green run

`bun run verify` — this stack's full pre-commit gate (`bun run lint && bun run typecheck && bun run test`). Real output:

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
 Test Files  132 passed (132)
      Tests  897 passed (897)
```

`bun run verify:full`'s browser tier (`bun run test:e2e`) was attempted and failed its own preflight — `scripts/ensure-playwright-browser.mjs` reports Chromium is genuinely not installed in this container (AGENTS.md § Notes from previous agents). Per that note, `verify` stands in; the new narrow-viewport e2e assertion runs in CI and at integration QA, not here.

TDD-RESULT: 897 passed, 0 failed
