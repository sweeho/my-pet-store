---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0008
ticket: SWHM-T-0084
branch: vortex/fix/SWHM-T-0084-change-language-button-on-the-catalog-s-95ffe1a7
upstream:
  [
    artifacts/SWHM-S-0008/SWHM-T-0084/PLAN.md,
    openspec/changes/swhm-s-0008-bugfix-found-by-inspector/design.md,
  ]
---

# Fix note — SWHM-T-0084

## Root cause

Per `design.md` § RC-2: `UnavailableInLanguage.openLanguageSwitcher()` found the header's
`LanguageSwitcher` button by DOM id and called `.click()` on it — a synthetic click aimed
at another component's internal state. `@headlessui/react` v2.2.10's
`use-handle-toggle.js` tracks the last `pointerType` in a ref that is set on every real
`pointerdown` and never cleared. A bare `.click()` (no preceding `pointerdown`) opens the
menu only while that ref is still `null` — i.e. only before the header button has ever
received one real mouse press in that session. After one real press, `r.current ===
"mouse"` for the component's lifetime, the `onClick` guard discards the synthetic click,
and the panel's button never opens the menu again. This matches the reported asymmetry
exactly, including why a fresh `?locale=zh_CN` load still worked.

## Fix

Per `design.md` § D-5 (O3, chosen over O1 dispatching a fuller synthetic pointer sequence
— rejected as depending on a private ref with no way to test it under jsdom's missing
`PointerEvent` — and O2 lifting a controlled `open` state — unavailable, `@headlessui`
v2's `Menu` exposes none): the panel now owns its own menu instead of driving the header's.

- `LanguageSwitcher` gained one optional prop, `label?: string`. Omitted, nothing changes
  (`LanguageSwitcher.test.tsx` passes unmodified). Present, the `MenuButton` renders that
  text instead of the current language name.
- `UnavailableInLanguage` now renders `<LanguageSwitcher label="Change language" locale={locale}
onChange={...} />` as its secondary action instead of a plain button + DOM-id click.
  Gained `onChangeLocale?: (next: Locale) => void` (optional so `UL-01`–`UL-04`, which
  render the panel in isolation, keep compiling). `openLanguageSwitcher()` and the
  `LANGUAGE_SWITCHER_MOUNT_ID` export are deleted — nothing reaches across components by id
  anymore.
- The three catalogue screens (`category/[categoryId].tsx`, `product/[productId].tsx`,
  `item/[itemId].tsx`) drop the `LANGUAGE_SWITCHER_MOUNT_ID` import and the `id` attribute
  on their header switcher's wrapper `div` (the `div` itself stays — it carries layout),
  and each now passes `onChangeLocale={setLocale}` to `UnavailableInLanguage`.

## Files touched

- `src/components/LanguageSwitcher.tsx` — new optional `label` prop.
- `src/pages/catalog/UnavailableInLanguage.tsx` — panel renders its own `LanguageSwitcher`;
  `openLanguageSwitcher()` and `LANGUAGE_SWITCHER_MOUNT_ID` removed; new optional
  `onChangeLocale` prop.
- `src/pages/catalog/UnavailableInLanguage.test.tsx` — new regression test UL-05: opens the
  panel's menu, selects a language, opens it again, selects a second language, asserts
  `onChangeLocale` fired twice with the two expected locales.
- `src/pages/catalog/category/[categoryId].tsx`, `src/pages/catalog/product/[productId].tsx`,
  `src/pages/catalog/item/[itemId].tsx` — dropped the mount-id import/attribute, pass
  `onChangeLocale={setLocale}`.

`src/pages/catalog/shared.ts`, `LanguageSwitcher.test.tsx`, and everything under `catalog/`
and `routes/` are untouched, per the PLAN.md ownership map. The item page's `<img>`
(SWHM-T-0083) was left alone.
