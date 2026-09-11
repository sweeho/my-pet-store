---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0004
ticket: SWHM-T-0056
branch: vortex/feat/SWHM-T-0056-catalog-browsing-screens-and-end-to-end-22c7975c
upstream: [artifacts/SWHM-S-0004/SWHM-T-0056/PLAN.md]
downstream: [artifacts/SWHM-S-0004/qa-test-report.md]
---

# Summary — SWHM-T-0056: Catalog browsing screens and end-to-end coverage

## What changed

Added the four catalog screens named in `INTERFACES.md` § Screens (`/catalog`, `/catalog/category/:categoryId`, `/catalog/product/:productId`, `/catalog/item/:itemId`), each fetching from the existing `routes/api/catalog/*` HTTP surface (SWHM-T-0055). Pagination (`?start=`) and search (`?q=`) state live in the URL via `useSearchParams`. The catalog locale resolves once per page from `GET /api/customer`'s `profile.preferredLanguage`, falling back to `en_US` (`catalog/locale.ts`'s `DEFAULT_LOCALE`) when there's no session. Added `e2e/catalog.spec.ts` for the browse and search journeys in a real browser.

## Files

- `src/pages/catalog/shared.ts` — `useCatalogLocale`, `useCatalogFetch`, `paginationLinks`. A `.ts` file (not `.tsx`), so `vite-plugin-pages` (which only scans `tsx`/`jsx`) never registers it as a route.
- `src/pages/catalog/index.tsx` + `.test.tsx` — `/catalog`: categories, search box, search results.
- `src/pages/catalog/category/[categoryId].tsx` + `.test.tsx` — the category's products.
- `src/pages/catalog/product/[productId].tsx` + `.test.tsx` — the product's items.
- `src/pages/catalog/item/[itemId].tsx` + `.test.tsx` — one item's detail.
- `e2e/catalog.spec.ts` — the full browse/search journey and the locale-switch behavior, in a real browser.

## AC coverage

- AC-1 (reach `/catalog` with no session, categories linking to products) — `index.tsx`; `index.test.tsx › PT-01`; `e2e/catalog.spec.ts`.
- AC-2 (category → product → item journey, item detail with image/attributes/price) — the three detail pages; their component tests; `e2e/catalog.spec.ts`.
- AC-3 (search box, query preserved in the URL) — `index.tsx`'s search form + `useSearchParams`; `index.test.tsx › PT-02`; `e2e/catalog.spec.ts`.
- AC-4 (previous/next disabled against `start`/`hasNext`) — `shared.ts`'s `paginationLinks`; `index.test.tsx › PT-03`.
- AC-5 (locale from `preferredLanguage`, else `en_US`) — `shared.ts`'s `useCatalogLocale`; verified in `e2e/catalog.spec.ts` (component tests mock the 401 case only, since a real signed-on session needs a real server — see Notes).
- AC-6 (not-found state, not a blank screen or error) — `NotFound` rendered on a 404 in all three detail pages; `category/[categoryId].test.tsx › PT-02`, `product/[productId].test.tsx › PT-02`, `item/[itemId].test.tsx › PT-03`; `e2e/catalog.spec.ts`.
- AC-7 (component tests in Vitest's `client` project) — `src/pages/catalog/**/*.test.tsx`; no config change needed, `src/pages/**` is already covered.
- AC-8 (`e2e/catalog.spec.ts`) — written; see Verification for why it could not be executed here.

## Verification

```
$ bun run test -- src/pages/catalog   # red, before the four pages existed
Test Files  4 failed (4)
     Tests  no tests

$ bun run verify   # green, full gate
Test Files  48 passed (48)
     Tests  232 passed (232)

$ bun run build    # extra check: four new file-based routes
✓ built in <1s, no route-registration errors
```

See `tdd-test-result.md` — `TDD-RESULT: 232 passed, 0 failed`.

`bun run test:e2e` was not run locally: this container's Chromium is genuinely missing (`scripts/ensure-playwright-browser.mjs`), the same documented limitation six earlier tickets hit this sprint (`AGENTS.md`'s Notes from previous agents). CI (which has Chromium) ran it on the first push and found a real bug: `uniqueUsername("catalog-locale")` built a 28-character username against the 25-character limit, failing every attempt including both retries. Fixed by shortening the label to `"cat-locale"`; pushed, and CI went green on the second run — all 15 E2E specs (including all 3 in `e2e/catalog.spec.ts`) passed.

A second, pre-existing failure surfaced in the same CI run: `e2e/customer-profile.spec.ts`'s "views, edits, saves, and keeps the language preference" test failed once (timed out waiting for the saved profile to render) and passed on Playwright's automatic retry — a flake in a file this ticket doesn't own or touch. Raised as a follow-up defect rather than fixed here.

## Notes

- **`Item` has no item-specific name field** (fixed by `catalog/types.ts`, SWHM-T-0046) — only `productName` (the parent product's name, shared by every item under it). Listing multiple items under one product by `productName` would show identical, indistinguishable text, so both the items-in-a-product list and the search-results list use `item.description` (the one genuinely item-specific text field) as the link label instead. The item detail page's own heading is `productName` — this mirrors the legacy Java Pet Store's own pattern of identifying an item by its product plus its description/attributes rather than a separate name.
- **`unitCost` (store cost) is not shown in the UI.** AC-2 asks for "the list price"; unitCost is wholesale cost information with no customer-facing purpose, so the item detail page omits it deliberately.
- **A real lint failure was caught and fixed during development**: `useCatalogFetch`'s first draft called `setState` synchronously inside its effect body to reset stale data before a new fetch (`react-hooks/set-state-in-effect`). Fixed by storing `{url, data, notFound}` together and deriving "still loading" by comparing the stored `url` to the current one at render time — state is now only ever set from inside the fetch's own callback.
- **AC-5 (locale from a signed-on customer) is only exercised by `e2e/catalog.spec.ts`**, not a component test: proving it needs a real `/api/customer` response for a genuinely authenticated session, which only the real dev server can provide; the component tests mock the 401 (no-session) branch only.
