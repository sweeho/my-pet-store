---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0011
ticket: SWHM-T-0105
branch: vortex/fix/SWHM-T-0105-category-page-s-untranslated-panel-calls-c797e991
upstream: [artifacts/SWHM-S-0011/SWHM-T-0105/PLAN.md]
downstream: [artifacts/SWHM-S-0011/qa-test-report.md]
---

# Fix note — SWHM-T-0105: the category screen's untranslated panel calls the category an "item"

## Root cause

`UnavailableInLanguage`'s `entity` prop defaulted to `"item"`. A default supplies prose for whichever caller omits the prop, and the category screen's `reason === "missing-translation"` branch (`src/pages/catalog/category/[categoryId].tsx`) was one such caller — it passed no subject at all, so the panel silently fell back to `"item"` instead of `"category"`. The branch itself, and the server's `missing-translation` classification behind it, were already correct; only the word the panel then rendered was wrong. This is the same defect shape as SWHM-T-0098 (see design.md § RC): a default is a claim that the omitted value is right, and it is right for at most one of the three catalogue levels the shared panel serves.

## Fix

Per design.md D1/D2: made `entity` required and widened its union to `"category" | "product" | "item"`, removing the default. This makes every caller name its subject explicitly, and a caller that doesn't fails to compile rather than rendering a silently wrong noun. The now-redundant `CONTAINER_NOUN` lookup table (which derived the same fact from `noun` instead) was deleted, and the body sentence is built from `entity` directly. All five call sites across the category, product and item screens now pass `entity` explicitly; four of them (all but the actual defect) were given the exact word they already rendered today, so no other screen's output moves.

## Regression test

`src/pages/catalog/category/[categoryId].test.tsx › PT-02b: reason missing-translation shows the unavailable-in-language state, not the not-found screen (SWHM-T-0098)` — extended to assert the panel body text, not only its heading. Red→green recorded in `tdd-test-result.md`. Also added: `src/pages/catalog/UnavailableInLanguage.test.tsx › UL-03c` (a panel-tier case with `entity="category"`) and an e2e mirror in `e2e/language.spec.ts` (browser tier, per design.md § Verification note — not executed in this container).

## Files touched

- `src/pages/catalog/UnavailableInLanguage.tsx` — `entity` made required, widened to include `"category"`, default removed; `CONTAINER_NOUN` deleted; body built from `entity` directly.
- `src/pages/catalog/UnavailableInLanguage.test.tsx` — existing cases (UL-01, UL-02, UL-03, UL-04, UL-05) given the explicit `entity` they already relied on implicitly; new UL-03c case for a category subject.
- `src/pages/catalog/category/[categoryId].tsx` — passes `entity="category"` at both call sites (the defect's `missing-translation` branch, and the empty-product-list branch that already rendered "category" via the old table).
- `src/pages/catalog/category/[categoryId].test.tsx` — PT-02b extended to assert body text.
- `src/pages/catalog/product/[productId].tsx` — passes `entity="product"` at the empty-item-list call site (already rendered "product" via the old table; now explicit).
- `src/pages/catalog/item/[itemId].tsx` — passes `entity="item"` at its `missing-translation` call site (previously relied on the default).
- `e2e/language.spec.ts` — added the category-screen mirror of the existing untranslated-product assertion.
