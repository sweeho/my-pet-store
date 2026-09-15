---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0010
ticket: SWHM-T-0098
branch: vortex/fix/SWHM-T-0098-product-detail-page-shows-generic-not-fo-8175cf8e
upstream: [artifacts/SWHM-S-0010/SWHM-T-0098/PLAN.md]
downstream: [artifacts/SWHM-S-0010/qa-test-report.md]
---

# Fix note — SWHM-T-0098: product screen shows Not Found instead of the language-unavailable panel

## Root cause

All three catalogue detail endpoints (`routes/api/catalog/{categories,products,items}/[id].get.ts`)
answer a 404 with `{ error, reason }`, where `reason` is `"not-found" | "missing-translation"`
(`catalog/availability.ts`). `useCatalogFetch` (`src/pages/catalog/shared.ts`) collapsed every 404
to a bare `{ data: null, notFound: true }` without reading the body, destroying that discrimination
one layer below the screens that need it. The product screen branched only on `notFound`, so a
product that exists but has no `zh_CN` row rendered the generic Not Found page instead of the
recovery panel. The category screen carried the identical fault via the same hook, currently
latent because every seeded category (unlike every product and item) has a `zh_CN` row — confirmed
by design.md's measured locale-coverage table. Confirms Planning's RCA in design.md without
correction.

The item screen had already been fixed once, but by giving it a page-local `useItemFetch` copy
rather than fixing the shared hook (its own code comment cites `shared.ts belongs to SWHM-T-0072`
as the reason). That left two of the three screens on the defective shared hook.

## Fix

Changed `useCatalogFetch` in `src/pages/catalog/shared.ts` to return
`{ data, reason: MissingReason | null }`: a 404 now reads the response body and surfaces its
`reason`, falling back to `"not-found"` when the body is absent or fails to parse as JSON (the safe
direction — a body-read failure must never be read as "merely untranslated"). `MissingReason` is
declared once in `shared.ts`, mirroring (not importing) `catalog/availability.ts`'s type, since that
module reaches `db/client.ts` and must not enter the browser bundle. Deleted the item screen's
page-local `useItemFetch`/`MissingReason` and pointed it at the shared hook instead — its rendered
output is unchanged. Fixed at the shared-hook layer rather than adding a third page-local copy for
the product screen (the option that would have mirrored the item screen's original approach),
because the category screen carries the identical latent fault and a per-screen fix would have left
it in place.

Branched the product and category screens on `reason`: `"not-found"` renders `<NotFound />` as
before; `"missing-translation"` renders `<UnavailableInLanguage>` (gated ahead of both screens'
existing `showUnavailable` empty-list path, which answers a different condition and is untouched).
Added an optional `entity?: "product" | "item"` prop to `UnavailableInLanguage`
(`src/pages/catalog/UnavailableInLanguage.tsx`), defaulting to `"item"` so every existing caller
renders byte-identical copy; the product screen passes `entity="product"` so its panel reads "This
product has nothing translated…" rather than "This item…".

## Regression test

- `src/pages/catalog/shared.test.ts › useCatalogFetch` (FC-01..FC-04) — the hook's reason plumbing
  and the defensive 404-body parse.
- `src/pages/catalog/product/[productId].test.tsx › PT-02b` — an untranslated product reaches the
  panel, names the product, and not the not-found screen.
- `src/pages/catalog/category/[categoryId].test.tsx › PT-02b` — the same for the category screen's
  previously-latent instance.
- `src/pages/catalog/UnavailableInLanguage.test.tsx › UL-03b` — `entity="product"` renders "This
  product has nothing translated…".
- `e2e/language.spec.ts` — extended with the product-screen mirror of the item-screen assertion
  (browser tier; not runnable in this container — see PLAN.md § Definition of Done).

Red→green recorded in `tdd-test-result.md`.

## Files touched

- `src/pages/catalog/shared.ts` — `useCatalogFetch` returns `reason` instead of `notFound`; declares
  `MissingReason`; defensively parses the 404 body.
- `src/pages/catalog/item/[itemId].tsx` — deleted the page-local `useItemFetch`/`MissingReason`;
  uses the shared hook. Rendered output unchanged.
- `src/pages/catalog/product/[productId].tsx` — branches on `reason`; renders the panel with
  `entity="product"` on `"missing-translation"`.
- `src/pages/catalog/category/[categoryId].tsx` — branches on `reason`; renders the panel on
  `"missing-translation"` (closes the latent instance).
- `src/pages/catalog/UnavailableInLanguage.tsx` — added the optional `entity` prop.
- Matching `*.test.tsx`/`.test.ts` beside each of the above, and `e2e/language.spec.ts`.
