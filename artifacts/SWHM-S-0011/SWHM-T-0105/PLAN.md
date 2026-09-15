# PLAN — SWHM-T-0105: the category screen's untranslated panel calls the category an "item"

Change: `swhm-s-0011-bugfix-swhm-t-0105-category`. **Read that change's technical design note first** —
the call-site table, the reachability facts and decisions D1–D3 are there, and these steps cite them
rather than repeating them.

## Objective

The language-unavailable panel describes its subject as the level of the catalogue the screen is
showing, at all three levels, and a call site that does not name its subject fails to compile.

## Design reference

This sprint's defect has no Ideas Canvas and no mockups, so there is nothing to export under
`artifacts/SWHM-S-0011/design/`. The visual pattern is already implemented and already governed:
`src/pages/catalog/UnavailableInLanguage.tsx`, under DESIGN.md § Unavailable content states. Do not
invent UI — the panel's layout, actions and heading do not move, and only the noun inside its body
sentence changes (§ What must not regress).

## Steps

1. In `src/pages/catalog/UnavailableInLanguage.tsx`, make the subject prop required and widen it to
   the three catalogue levels, removing the default that supplied one (D1). Nothing else about the
   component's signature moves.
2. In the same file, delete the plural-noun lookup table and build the body sentence from the subject
   prop directly (D2). Keep the plural-noun prop: it still decides the heading and the clause that
   says what exists.
3. Pass a category as the subject from the untranslated branch of
   `src/pages/catalog/category/[categoryId].tsx`. This is the defect; it is one prop at one call site.
4. Give the four remaining call sites — the category and product screens' empty-list branches, the
   product screen's untranslated branch, the item screen's untranslated branch — the explicit subject
   each already renders today. Step 1 makes the compiler name every one of them, so there is no call
   site to find by hand. See the design note's call-site table for what each renders now; the rendered
   strings must not move (§ What must not regress).
5. Add a case to `src/pages/catalog/UnavailableInLanguage.test.tsx` covering a category subject,
   alongside the item and product cases already there (D3). The existing cases keep their assertion
   strings exactly; only the props they pass become explicit.
6. Extend the untranslated-branch test in `src/pages/catalog/category/[categoryId].test.tsx` to assert
   the panel's body text, not only its heading. The heading does not depend on the subject, which is
   why that test passes on the broken output today (§ Measured context).
7. Add the category-screen mirror of the untranslated-product assertion already in
   `e2e/language.spec.ts`. Reach the branch with an unsupported locale — every seeded category has a
   `zh_CN` row, so only a locale the catalogue has no rows for renders the panel (§ Verification note).

## File / module ownership

Only these files. No other ticket is in this sprint, so nothing here is shared, but a change outside
this list means a step went further than it specifies.

- `src/pages/catalog/UnavailableInLanguage.tsx` and `src/pages/catalog/UnavailableInLanguage.test.tsx`
- `src/pages/catalog/category/[categoryId].tsx` and `src/pages/catalog/category/[categoryId].test.tsx`
- `src/pages/catalog/product/[productId].tsx` and `src/pages/catalog/product/[productId].test.tsx`
- `src/pages/catalog/item/[itemId].tsx` and `src/pages/catalog/item/[itemId].test.tsx`
- `e2e/language.spec.ts`

Fixed contracts, none of which this ticket may move:

- Every route under `routes/api/catalog/` keeps its response shape, including the 404 body's `error`
  and `reason` fields, and `catalog/availability.ts` keeps `MissingReason` as
  `"not-found" | "missing-translation"`. The server already answers this case correctly.
- `catalog/seed.ts` is not touched, so the catalogue's locale coverage is unchanged — five categories
  in `en_US`/`ja_JP`/`zh_CN`, no `de_DE` row anywhere.
- `catalog/locale.ts` keeps passing an unsupported locale through rather than rejecting it, and
  `catalog/types.ts` keeps `Locale` as `string`. Step 7's assertion depends on both.
- `useCatalogFetch` in `src/pages/catalog/shared.ts` keeps its `{ data, reason }` signature; this
  ticket reads no reason it does not already read.

## Definition of Done

The ticket's acceptance criteria AC-1 through AC-4 hold, each observed rather than asserted:

- **AC-1** by the browser-tier assertion from step 7 and the screen-tier assertion from step 6.
- **AC-2** by the panel-tier case from step 5 and the product screen's existing untranslated-branch
  tests, which must pass unchanged — if one needs editing, step 4 changed rendered output and is wrong.
- **AC-3** by the item screen's existing tests, under the same condition.
- **AC-4** by the unknown-id assertions already in the three screens' tests and in `e2e/language.spec.ts`.

The browser tier runs in CI on this branch, not in the implementation container — see the design
note's § Verification note before reaching for a browser that is not there.
