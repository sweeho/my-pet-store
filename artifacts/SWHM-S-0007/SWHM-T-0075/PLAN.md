# SWHM-T-0075 — Content Management

**Change:** `swhm-i-0005-multi-language-support` · **Group:** `## 4. Content Management` (4.1–4.4)
**Requirement:** Multi-language support
**Depends on:** SWHM-T-0072 (the hook and the control), SWHM-T-0074 (the `reason` discriminator)

> Read `openspec/changes/swhm-i-0005-multi-language-support/` first — and note that its decisions
> document states the user interface for this capability was never extracted and is unspecified
> (`artifacts/SWHM-S-0007/PLANNING-NOTES.md` § S8). For everything on a screen, the authority is the
> design references below plus D3 and D4 in PLANNING-NOTES.

## Objective

The four catalogue screens carry the language control, render localized content, and say so honestly
when the chosen language has none. Under `en_US` nothing a customer sees changes.

Boxes 4.1–4.3 (translated content) are already satisfied for `en_US` and `ja_JP` and are out of scope
for `zh_CN` below category level (S4); box 4.4 resolves to no work (S5). The group's remaining work is
the presentation of localized content and of its absence — this ticket.

## Design reference

Build what these show. They are committed on the sprint branch; open the files.

- `artifacts/SWHM-S-0007/design/mockup-category-page-in-language-menu-open.html` — the category screen
  in 日本語. Fixes where the control sits (heading row, right-aligned) and that `Previous` / `Next`
  stay English while the category name and description are Japanese.
- `artifacts/SWHM-S-0007/design/mockup-category-page-in-no-content-in-this-lang.html` — the same
  screen in 中文 with no product content. **This mockup is the copy contract**: heading
  _"No products in 中文 yet"_, body _"This category has nothing translated into 中文. Nothing has gone
  wrong — the products exist, but not in this language."_, a primary **View in English (US)** action
  and a secondary **Change language** action. Note the category's own name and description still
  render in Chinese — `category_details` does carry `zh_CN`.
- `artifacts/SWHM-S-0007/design/wireframe-catalog-before-after-the-language-contro.html` — the
  before/after, including that the control appears on _every_ catalogue screen.
- `artifacts/SWHM-S-0007/design/MANIFEST.md`.

## Steps

1. **`UnavailableInLanguage`** — one local component in `src/pages/catalog/`, used by three screens.
   Props: the active locale and the noun ("products" / "items" / nothing for an item screen), plus the
   two actions. The language is named in the customer's own script (`中文`, not `zh_CN`) — the mockup's
   copy, not a paraphrase. See `DESIGN.md § Unavailable content states` for the standing pattern this
   instantiates.
2. **Mount the control on all four screens** — `/catalog`, category, product, item — wired to
   `useCatalogLocale()`'s `setLocale`. It must render **before** the screen's data arrives, so place
   it in the stable chrome alongside the heading, above any early return.
3. **Replace the `return null` loading gates** (`category/[categoryId].tsx:38` and the same line in
   the product and item screens) with the screen's chrome plus a `role="status"` element naming what
   is loading. Two reasons, both binding: a screen rendering nothing cannot carry the control step 2
   requires, and `return null` already contradicts `ARCHITECTURE.md § Key Decisions` and
   `DESIGN.md § Loading states` (PLANNING-NOTES D4).
4. **Empty-list state, category and product screens.** When the fetched page has
   `objects.length === 0` **and** the active locale is not `DEFAULT_LOCALE`, render
   `UnavailableInLanguage` instead of the empty `<ul>`. Under `en_US` an empty list stays an empty
   list — that is the existing behaviour AC-5 protects. The `/catalog` home needs no empty state:
   categories exist in all three locales, and a search that matches nothing already has its own
   message which is a different thing entirely.
5. **Item screen.** Switch on the 404 body's `reason` from SWHM-T-0074: `"missing-translation"` renders
   `UnavailableInLanguage`, `"not-found"` renders the existing `NotFound` screen — in every locale,
   which is the whole point of the discriminator. Do not infer either case from the locale alone.
   `useCatalogFetch` currently collapses a 404 to `notFound: true` and discards the body
   (`src/pages/catalog/shared.ts:55-57`); the reason has to survive that. `shared.ts` belongs to
   SWHM-T-0072 — if the hook cannot carry it, escalate to planning rather than editing that file.
6. **`document.documentElement.lang`** on each screen, matching the active locale. `setLocale` sets it
   on a switch (SWHM-T-0072 step 3); each screen must also set it on first render, or a direct load of
   `/catalog/category/BIRDS?locale=ja_JP` leaves the attribute stale.
7. **Update the four page tests** for the new chrome, the pending state and the unavailable state.
   These four files are the sprint's only jsdom cover for this behaviour.

## Fixed interface contracts

Consumed, not defined here — from SWHM-T-0072 (`useCatalogLocale(): { locale, setLocale }`,
`LanguageSwitcher({ locale, onChange })`) and SWHM-T-0074 (`reason: "not-found" | "missing-translation"`
on a 404 body). This ticket defines one:

```ts
// src/pages/catalog/UnavailableInLanguage.tsx
export function UnavailableInLanguage(props: {
  locale: Locale;            // named in its own script in the rendered copy
  noun?: string;             // "products" | "items"; omitted on the item screen
  onViewInEnglish: () => void;
}): ReactElement;
```

## File / module ownership

`src/pages/catalog/index.tsx` + `.test.tsx`, `src/pages/catalog/category/[categoryId].tsx` + `.test.tsx`,
`src/pages/catalog/product/[productId].tsx` + `.test.tsx`, `src/pages/catalog/item/[itemId].tsx` + `.test.tsx`,
`src/pages/catalog/UnavailableInLanguage.tsx` (new) + `.test.tsx` (new).

Not this ticket's: `src/pages/catalog/shared.ts` and `src/components/**` (SWHM-T-0072), `src/pages/NotFound.tsx`,
`src/pages/customer.tsx`, anything under `catalog/`, `routes/`, `db/` or `e2e/`.

## Definition of Done

AC-1 through AC-8 on the ticket. AC-2 is step 2 including the in-flight case; AC-3 is step 4; AC-4 is
step 5, and its "under ja_JP and zh_CN as well" clause is the part a locale-only heuristic fails;
AC-5 is the en_US no-change constraint; AC-6 is the labels-stay-English constraint from the idea's
Out of Scope; AC-7 is step 3; AC-8 is step 6.

## Gotchas

- `UnavailableInLanguage.tsx` sits under `src/pages/catalog/` and **is a `.tsx` file in a routed
  directory**. `vite-plugin-pages` will register it as the route `/catalog/UnavailableInLanguage`
  unless it is excluded. Check `Pages({ exclude })` in `vite.config.ts`: it currently excludes
  `**/*.test.tsx` only. Either add the exclusion or put the component in `src/components/` instead —
  but `src/components/` is SWHM-T-0072's, so if that is the answer, escalate to planning. Do not ship
  an accidental public route.
- `react` and `react-router` are auto-imported; add no import for `useState`/`useEffect`, and do not
  hand-edit `auto-imports.d.ts`.
- The existing page tests locate everything by role and accessible name, never by class name. Keep to
  it — the empty state needs a real heading, and the two actions need real accessible names, or
  SWHM-T-0076 has nothing to target in a browser.
- The 中文 copy names the language in Chinese script inside otherwise-English chrome. That is
  deliberate and is what the mockup shows: the customer reading it may not read English.
- Under `zh_CN` a _category_ screen still renders its own name and description, because
  `category_details` has `zh_CN` rows; only the product list is empty. A blanket "no zh_CN content"
  branch would wrongly blank the heading.
