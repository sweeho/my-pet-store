---
artifact: summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0007
ticket: SWHM-T-0075
branch: vortex/feat/SWHM-T-0075-content-management-show-localized-conten-93a95617
upstream: [artifacts/SWHM-S-0007/SWHM-T-0075/PLAN.md]
---

# Summary — SWHM-T-0075

Mounted the language control on all four catalogue screens, replaced their `return null` loading
gates with a `role="status"` pending state, and added the unavailable-in-language state for an empty
product/item list and a `missing-translation` item 404 — per PLAN.md steps 1–7.

## Changed

- `src/pages/catalog/UnavailableInLanguage.tsx` (new) — the shared message from D3/the 中文 mockup:
  heading + body naming the language in its own script, a primary "View in English (US)" action and a
  secondary "Change language" action that opens the on-page `LanguageSwitcher`. Container noun
  ("category"/"product"/"item") derives from the `noun` prop per the fixed interface.
- `vite.config.ts` — added `**/UnavailableInLanguage.tsx` to `Pages({ exclude })`, per the ticket's own
  Gotcha: without it, `vite-plugin-pages` registers the component as a public route.
- `src/pages/catalog/index.tsx`, `category/[categoryId].tsx`, `product/[productId].tsx`,
  `item/[itemId].tsx` — mounted `LanguageSwitcher` in each screen's header (rendered before any data
  arrives), added a `role="status"` pending element in place of the old `return null`, added the
  `document.documentElement.lang` effect (AC-8), and wired the empty-list/missing-translation branches
  to `UnavailableInLanguage`.
- Matching `.test.tsx` updates for all four screens plus the new component's own test file.

## Design decisions

- **Item screen's `reason` discrimination without touching `shared.ts`.** `useCatalogFetch` collapses
  a 404 to a boolean and discards the body, and `shared.ts` is out of this ticket's ownership
  (SWHM-T-0072's). Rather than escalating, `item/[itemId].tsx` defines a small local
  `useItemFetch` (same shape as the shared hook, scoped to this one file) that reads the `reason`
  field the 404 body carries. Category and product entity 404s keep the existing boolean `notFound` —
  PLAN.md scopes the reason distinction to the item screen only (S4: below category level is out of
  scope for zh_CN), and no product/category test needed it.
- **`noun` → container word.** `UnavailableInLanguage` derives "category"/"product" from
  `noun: "products" | "items"` (a category lists products, a product lists items) so the body copy
  reads "This category has nothing translated…" / "This product has nothing translated…" without a
  third prop; the item screen omits `noun` and gets "This item…".
- **"Change language" isn't in the fixed interface's single callback prop.** It opens the page's
  mounted `LanguageSwitcher` by id (`LANGUAGE_SWITCHER_MOUNT_ID`) rather than adding a second prop,
  keeping the interface exactly as PLAN.md specifies.

## Acceptance criteria

- AC-1 (犬/ja_JP retrieval) — unchanged, already covered upstream (`catalog/seed.test.ts` ST-02); the
  category page's zh_CN test exercises the same path at the UI layer.
- AC-2 (control on all four screens, including in-flight) — one test per screen (`PT-03`/`PT-04`
  variants), asserting the switcher button while the data fetch never resolves.
- AC-3 (empty list → unavailable state with a one-click English (US) recovery) — category/product
  tests.
- AC-4 (item 404 reason discrimination, all three locales) — item page tests PT-03/04/05.
- AC-5 (en_US unchanged) — category/product PT-05 (empty list stays empty); all PT-01/02 regression
  tests pass unmodified in behavior.
- AC-6 (control labels stay English) — no control label is derived from `noun`/locale; verified by
  inspection, all button text is a literal English string.
- AC-7 (`role="status"` pending element) — one test per screen.
- AC-8 (`document.documentElement.lang`) — one test per screen.

## Verification

- Red: ran the new/updated test files against the pre-ticket implementation (four page `.tsx` files
  and `vite.config.ts` reverted via `git stash`, `UnavailableInLanguage.tsx` removed) — 11 of 24 tests
  failed, exactly the new-behavior assertions; the 13 pre-existing-behavior tests stayed green.
  Implementation then restored. See `tdd-test-result.md`.
- Green: `bun run verify:full` — E2E preflight reports Chromium not installed in this container (known
  gap, see `AGENTS.md` § Notes from previous agents); fell back to `bun run verify`. Result: lint +
  typecheck + full unit suite green, 297/297 tests (was 279 before this ticket's 18 new tests across 5
  files).

## Follow-ups

None.
