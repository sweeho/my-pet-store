# PLAN — SWHM-T-0084: "Change language" works exactly once per page load

Change: `swhm-s-0008-bugfix-found-by-inspector`
Requirement: _Language recovery from an untranslated screen_ (`internationalization`)

## Design reference

No design blocks — idea-less defect batch, no `artifacts/SWHM-S-0008/design/` directory. The panel
keeps the shape DESIGN.md § Unavailable content states requires: a heading naming the cause, a body
saying nothing is broken, a primary action that resolves it and a secondary action that changes the
condition. Only the secondary action's mechanism changes.

## Objective

Make the panel's language control work on every use, by removing the synthetic DOM click that drives
another component's menu.

## Steps

1. Read `design.md` § RC-2 and § D-5 first. § RC-2 pins the cause to one unreset ref in
   `@headlessui/react`'s `use-handle-toggle.js` and explains the "works once" asymmetry exactly;
   § D-5 records why the two obvious alternatives were rejected. Do not re-derive either.
2. Add the optional `label?: string` prop to `src/components/LanguageSwitcher.tsx`. When present the
   `MenuButton` renders that text in place of the current language name; when absent nothing about
   the component changes. The `Globe` and `ChevronDown` icons, the `onChange` contract and the item
   list stay as they are.
3. In `src/pages/catalog/UnavailableInLanguage.tsx`: delete `openLanguageSwitcher()` and the
   `LANGUAGE_SWITCHER_MOUNT_ID` export, add an optional `onChangeLocale?: (next: Locale) => void`
   prop, and render `<LanguageSwitcher label="Change language" locale={locale} onChange={…} />` as
   the secondary action. The prop is optional by design — § D-5 gives the reason, and changing it to
   required breaks the type-check of the four existing tests.
4. In `src/pages/catalog/category/[categoryId].tsx`, `product/[productId].tsx` and
   `item/[itemId].tsx`: drop the `LANGUAGE_SWITCHER_MOUNT_ID` import and the `id` attribute on the
   wrapper `div` (keep the `div` — it carries layout), and pass `onChangeLocale={setLocale}` to
   `UnavailableInLanguage`.
5. Add the regression test § D-5 describes to `src/pages/catalog/UnavailableInLanguage.test.tsx`: one
   render, open the panel's menu, select a language, open it again, select another, and assert
   `onChangeLocale` was called twice with the two expected locales. The second open is the assertion
   that matters — the old code failed there.

## File / module ownership

Modify:

- `src/components/LanguageSwitcher.tsx` — the new optional `label` prop
- `src/pages/catalog/UnavailableInLanguage.tsx` — the secondary action and the removed mount id
- `src/pages/catalog/UnavailableInLanguage.test.tsx` — one added test
- `src/pages/catalog/category/[categoryId].tsx`, `src/pages/catalog/product/[productId].tsx`,
  `src/pages/catalog/item/[itemId].tsx` — the mount-id import, the wrapper `id`, the new prop

Do not modify `src/pages/catalog/shared.ts`, `src/components/LanguageSwitcher.test.tsx`, or anything
under `catalog/` or `routes/`. `src/pages/catalog/item/[itemId].tsx`'s `<img>` belongs to
SWHM-T-0083 — leave it alone.

## Definition of Done

- AC-1, AC-2 and AC-3 on the ticket are met.
- `UnavailableInLanguage.test.tsx`'s UL-01 to UL-04 and every test in `LanguageSwitcher.test.tsx`
  pass unmodified.
- `LANGUAGE_SWITCHER_MOUNT_ID` appears nowhere in the repository.
- No file outside the ownership map above is changed.
