---
artifact: fix-note
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

# Fix note — SWHM-T-0083

## Root cause

`catalog/seed.ts` names 20 `/images/<category>/<slug>.jpg` files that were never added to
the repository. `catalog/item.ts` and `catalog/search.ts` pass `imageLocation` through
unchanged, and every route test for both asserts the exact string, so that value cannot
move. `src/pages/catalog/item/[itemId].tsx`'s `<img>` (was at :126-130) rendered
`item.imageLocation` with no fallback, so every item detail page requested a file that
does not exist and rendered a broken image.

Per `design.md` § D-4, shipping the 20 asset files (O1) was rejected: the container has no
image encoder (no `sharp`, `jimp`, ImageMagick, PIL, or Chromium) to produce them, and the
real fix is product photography — a content problem, not something to fabricate. O2 —
render-time fallback — was chosen instead.

## Fix

Added a committed placeholder asset, `public/images/placeholder.svg`, and an `onError`
handler on the item page's `<img>` that swaps `src` to `/images/placeholder.svg` exactly
once. The handler checks `img.src.endsWith("/images/placeholder.svg")` before reassigning,
so a failure to load the placeholder itself is a no-op rather than a second swap — no loop
is possible. `alt={item.productName}` and every existing class are unchanged, so the
accessible name is identical whichever image renders.

**Known residual (deliberate, per design.md § D-4):** the request for the seeded
`imageLocation` still 404s before the fallback fires — the asset genuinely does not exist.
The acceptance criteria are written against the visible outcome (an image renders) for
this reason.

## Files touched

- `public/images/placeholder.svg` — new committed placeholder asset (flat vector, no
  external reference, no embedded raster data).
- `src/pages/catalog/item/[itemId].tsx` — added `onError` to the item image only; no other
  line changed.
- `src/pages/catalog/item/[itemId].test.tsx` — new regression test (PT-08): fires a load
  error on the image, asserts `src` becomes the placeholder and `alt` stays the product
  name, then fires a second error and asserts `src` does not change again.

`catalog/seed.ts`, `catalog/item.ts`, `catalog/search.ts` and their route tests are
untouched — verified by running `routes/api/catalog/items` and
`routes/api/catalog/search.get.test.ts` unmodified (7/7 passing).
