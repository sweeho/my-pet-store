# PLAN — SWHM-T-0083: every catalogue item image is broken

Change: `swhm-s-0008-bugfix-found-by-inspector`
Requirement: _Item image association_ (`catalog-browsing`)

## Design reference

No design blocks — idea-less defect batch, no `artifacts/SWHM-S-0008/design/` directory. The
placeholder is a neutral product-image stand-in occupying the same `max-w-xs rounded-md` box the
real image does, consistent with DESIGN.md § Tokens (no new token is introduced).

## Objective

Stop the item detail screen rendering a failed image, without moving the seed data or the
`imageLocation` contract.

## Steps

1. Read `design.md` § D-4 first. It records why shipping 20 asset files was rejected on the evidence,
   what the chosen fallback is, and the residual 404 that is deliberately left in place. Do not
   re-open that decision or re-derive it in the ticket.
2. Add `public/images/placeholder.svg` — a neutral product-image placeholder, no external reference,
   no embedded raster data.
3. In `src/pages/catalog/item/[itemId].tsx` (the `<img>` at :126-130) add an `onError` that sets the
   element's `src` to `/images/placeholder.svg` exactly once. Guard the swap so a failure to load the
   placeholder itself cannot re-fire — compare against the placeholder path before assigning, or
   clear the handler on first fire. `alt={item.productName}` and every class stay as they are.
4. Cover it in the item page's test file: render an item, fire `error` on the image, and assert the
   `src` has become the placeholder and the accessible name is still the product name. Assert the
   handler does not fire a second time when the placeholder itself errors.

**Do not** change `catalog/seed.ts`, `catalog/item.ts` or `catalog/search.ts`. Their route tests
assert exact `imageLocation` strings; § D-4 requires those strings to stay put.

`src/pages/catalog/item/[itemId].tsx` is also edited by SWHM-T-0084, which owns its
language-switcher mount and the props passed to `UnavailableInLanguage`. That ticket runs after this
one. Stay inside the `<img>` element.

## File / module ownership

Create:

- `public/images/placeholder.svg`
- `src/pages/catalog/item/[itemId].test.tsx` if no test file exists for that page; otherwise extend it

Modify:

- `src/pages/catalog/item/[itemId].tsx` — the `<img>` element only

Do not modify any other file.

## Definition of Done

- AC-1 and AC-2 on the ticket are met.
- `routes/api/catalog/items/*.test.ts` and `routes/api/catalog/search.get.test.ts` pass unmodified.
- No file outside the ownership map above is changed.
