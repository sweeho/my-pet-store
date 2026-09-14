---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0008
ticket: SWHM-T-0083
branch: vortex/fix/SWHM-T-0083-every-catalog-item-image-404s-no-images-02eacf9d
upstream:
  [
    artifacts/SWHM-S-0008/SWHM-T-0083/PLAN.md,
    openspec/changes/swhm-s-0008-bugfix-found-by-inspector/design.md,
  ]
---

# TDD result — SWHM-T-0083

## Test cases

| Test                                                                                                                        | Covers           | Intent                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/catalog/item/[itemId].test.tsx › PT-08: falls back to the placeholder image on a load error, and does not loop…` | AC-1, AC-2, AC-4 | image swaps to the placeholder on error, keeps the product-name alt text, and a second error on the placeholder itself does not re-trigger the swap |

AC-3 (imageLocation contract unchanged) is covered by the existing, unmodified route
tests, re-run below rather than duplicated in this file.

## Red run

`bun --bun vitest run src/pages/catalog/item/[itemId].test.tsx` against the unmodified
page (no `onError` handler, no placeholder asset):

```
 ❯ |client| src/pages/catalog/item/[itemId].test.tsx (8 tests | 1 failed) 125ms
     × PT-08: falls back to the placeholder image on a load error, and does not loop if the placeholder itself errors

 FAIL  |client| src/pages/catalog/item/[itemId].test.tsx > ItemPage (/catalog/item/:itemId) > PT-08: falls back to the placeholder image on a load error, and does not loop if the placeholder itself errors
Error: expect(element).toHaveAttribute("src", "/images/placeholder.svg")

Expected the element to have attribute:
  src="/images/placeholder.svg"
Received:
  src="/images/birds/african-grey.jpg"
 ❯ src/pages/catalog/item/[itemId].test.tsx:219:17

 Test Files  1 failed (1)
      Tests  1 failed | 7 passed (8)
```

## Green run

After adding `public/images/placeholder.svg` and the guarded `onError` handler on the
item image:

`bun --bun vitest run src/pages/catalog/item/[itemId].test.tsx`:

```
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

`routes/api/catalog/items` and `routes/api/catalog/search.get.test.ts` re-run unmodified,
confirming the `imageLocation` contract (AC-3) is untouched:

```
 Test Files  3 passed (3)
      Tests  7 passed (7)
```

`bun run verify` — this stack's full browser-free gate (lint, typecheck, complete
unit/integration suite):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  55 passed (55)
      Tests  298 passed (298)
```

`bun run verify:full` was attempted first; its E2E tier failed at the preflight
(`scripts/ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not
installed"), the documented limitation in this project's `AGENTS.md` Notes for this
sprint's implementation containers. Fell back to `bun run verify` per that note. This
ticket changes only the item image's error handling within an existing page — no new
route or navigable flow — so there is no new E2E-observable behavior; CI and
INTEGRATION_QA run the full pipeline including E2E before merge.

TDD-RESULT: 298 passed, 0 failed
