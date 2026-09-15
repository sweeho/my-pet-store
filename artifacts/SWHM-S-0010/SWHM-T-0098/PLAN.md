# PLAN — SWHM-T-0098: product screen shows Not Found instead of the language-unavailable panel

Change: `swhm-s-0010-bugfix-swhm-t-0098-product-d`. Read that change's technical design note FIRST —
the measured locale coverage, the three-screen comparison table and decisions D1–D4 are there, and
these steps cite them rather than repeating them.

## Objective

Every catalogue screen that shows a single thing distinguishes "no such thing" from "exists, not
translated": the first keeps the Not Found screen, the second gets the recovery panel. The product
screen gains the behaviour the item screen already has.

## Design reference

This sprint's defect has no Ideas Canvas and no mockups, so there is nothing to export under
`artifacts/SWHM-S-0010/design/`. The visual pattern to build is already implemented and documented:
`src/pages/catalog/UnavailableInLanguage.tsx`, governed by DESIGN.md § Unavailable content states. Do
not invent new UI — the panel is the design, and only the noun inside its body text moves (D3).

## Steps

1. Change `useCatalogFetch` in `src/pages/catalog/shared.ts` to return
   `{ data: T | null; reason: MissingReason | null }` in place of `{ data, notFound }`, declaring
   `MissingReason` in that file with the comment explaining why it mirrors `catalog/availability.ts`
   rather than importing it (D1, D4). Parse the 404 body defensively: an absent or non-JSON body
   yields `"not-found"` (D2).
2. Delete `useItemFetch` and its local `MissingReason` from `src/pages/catalog/item/[itemId].tsx`, and
   read the shared hook instead. The screen's rendered output must not change (D1, and § What must not
   regress).
3. Branch `src/pages/catalog/product/[productId].tsx` on `reason`: `"not-found"` returns `<NotFound />`
   as today, `"missing-translation"` renders `<UnavailableInLanguage>` with the screen's existing
   `locale`, `setLocale` and `DEFAULT_LOCALE` wiring. Leave `showUnavailable` and everything it gates
   alone — it answers a different condition (§ What must not regress).
4. Branch `src/pages/catalog/category/[categoryId].tsx` the same way. TypeScript will require this once
   step 1 lands; it closes the latent instance of the same fault described in § Measured context.
5. Add an optional `entity?: "product" | "item"` prop to
   `src/pages/catalog/UnavailableInLanguage.tsx`, defaulting to `"item"` so existing callers render
   byte-identical copy, and pass `entity="product"` from the product screen (D3).
6. Cover the new behaviour in the unit tier: the shared hook's reason plumbing and its defensive parse
   in `src/pages/catalog/shared.test.ts`; the missing-translation and not-found branches on the product
   and category screens in their own `*.test.tsx`; the new prop in
   `src/pages/catalog/UnavailableInLanguage.test.tsx`. The item screen's existing tests must pass
   unchanged — if one needs editing, step 2 changed rendered behaviour and is wrong.
7. Extend `e2e/language.spec.ts` with the product-screen mirror of the assertion it already makes for
   the item screen: an untranslated product reaches the panel, an unknown product id reaches Not Found.

## File / module ownership

Only these files.

- `src/pages/catalog/shared.ts` and `src/pages/catalog/shared.test.ts`
- `src/pages/catalog/product/[productId].tsx` and its `.test.tsx`
- `src/pages/catalog/category/[categoryId].tsx` and its `.test.tsx`
- `src/pages/catalog/item/[itemId].tsx` and its `.test.tsx`
- `src/pages/catalog/UnavailableInLanguage.tsx` and its `.test.tsx`
- `e2e/language.spec.ts`

Fixed contract: every route under `routes/api/catalog/` keeps its current response shape, including the
404 body's `error` and `reason` fields; `catalog/availability.ts`'s `MissingReason` values stay
`"not-found" | "missing-translation"`; `catalog/seed.ts` is not touched, so the catalogue's locale
coverage is unchanged. `src/pages/catalog/index.tsx` reads only list endpoints and needs no change —
if it does, the hook's signature moved further than step 1 specifies.

## Definition of Done

The ticket's acceptance criteria AC-1 through AC-4 hold. AC-1 and AC-2 are observed by the product
screen's unit tests from step 6 and the browser-tier assertion from step 7; AC-3 by the panel test in
step 6; AC-4 by the unknown-id assertions in steps 6 and 7 together with the item-screen assertion
already in `e2e/language.spec.ts`. The browser tier runs in CI on this branch, not in this container —
see the design note's § Verification note.
