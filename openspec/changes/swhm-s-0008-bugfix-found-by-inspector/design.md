# Design — SWHM-S-0008 bugfix batch

Each defect's root cause is recorded here once. The per-defect `PLAN.md` files cite these sections
rather than restating them.

## RC-1 — The landing page is unmodified template markup (SWHM-T-0080, SWHM-T-0081)

`src/pages/index.tsx` is the Tailwind Plus hero/nav template. Branding was applied to the text only:
`STORE_NAME` reached the `h1` (line 128) and both `sr-only` logo labels (lines 24, 60), and the
`highlights` array was rewritten for the store. Nothing else was touched, so the template's two
placeholder mechanisms survived intact — its demo logo `<img>` (lines 25-29 desktop, 61-65 mobile,
both pointing at `tailwindcss.com/plus-assets/…`) and its `href="#"` anchors (the whole `navigation`
array at lines 6-11, both "Log in" links at 50 and 91, and the three hero anchors at 120, 136, 141).

Both defects are therefore one edit to one file, split across two tickets only because they were
reported separately. They are sequenced, not merged, because each has its own test surface.

## D-1 — The store mark is an inline SVG component, not an image file

No logo asset exists in the repository and there is no designer role available this sprint, so the
choice is between commissioning artwork and rendering a mark from what the product already knows.
An inline SVG component (`src/components/StoreMark.tsx`) rendering a simple mark plus the
`STORE_NAME` wordmark needs no binary asset, no network request of any kind, scales at the template's
existing `h-8 w-auto` in both the desktop nav and the mobile panel, and inherits `currentColor` so it
survives the dark header without a second variant.

The accessible name stays where the template put it — the surrounding `<a>`'s `sr-only` span — so the
SVG is `aria-hidden` and the link's name does not change.

## D-2 — Nav items name screens this product has, and nothing else

"Features", "Tech Stack", "Docs", "GitHub", "View on GitHub" and "See how it works" describe a
starter template, not a pet store. Four of them have no destination that could exist. Rather than
inventing anchors for sections that are not on the page, the navigation is rewritten to the screens
the product actually ships:

| Control                                           | Destination |
| ------------------------------------------------- | ----------- |
| Nav "Catalog", hero "Get started"                 | `/catalog`  |
| Nav "My account"                                  | `/customer` |
| "Log in" (desktop and mobile)                     | `/signon`   |
| Hero "View on GitHub", eyebrow "See how it works" | removed     |

Links are `react-router`'s `Link`, as every other page in `src/pages` uses — a raw `<a href>` to an
in-app path costs a full document reload. `Link` renders an `<a>`, so `getByRole("link")` keeps
working.

This moves two existing tests: `src/pages/index.test.tsx` asserts the mobile dialog lists "Features"
and "Tech Stack", and `e2e/home.spec.ts` asserts all four old nav names are visible. Both assert the
template's copy, so both are updated to the new names in the same ticket. This is the one place in
this change where an existing test is rewritten rather than preserved.

## D-3 — Scaffold pages are deleted, the API they resemble is not (SWHM-T-0082)

The template shipped a matched pair: example pages under `src/pages/users/` and an example API under
`routes/api/users/`. The product kept and extended the API — it is database-backed, tested, and
`e2e/smoke.spec.ts` probes it deliberately as the canary for the Bun/`bun:sqlite` constraint
(ARCHITECTURE.md § Cross-cutting constraints). It never replaced the pages; it built `/customer` and
`/signon` beside them and left the scaffolds live.

Only the three page files go. `routes/api/users/**`, `db/schema.ts`'s `users` table and every
existing test stay byte-identical. Deleting the API alongside the pages would break the smoke test
and the two route test files, which is the single way this ticket can go wrong.

The root cause is structural rather than accidental, and the same shape can recur: under
`vite-plugin-pages` a file in `src/pages/` is a public route by existing, with no registration step
that anyone would notice was missing. That constraint is recorded in ARCHITECTURE.md § Routing.

## D-4 — A missing product image degrades to a placeholder; the paths stay as they are (SWHM-T-0083)

`catalog/seed.ts` names 20 `/images/<category>/<slug>.jpg` files that were never added. `catalog/item.ts`
and `catalog/search.ts` pass the value through unchanged and their route tests assert the exact
strings, so the seed data and the `imageLocation` contract must not move.

That leaves two ways to stop the broken image:

- **O1 — ship 20 asset files at those exact paths.** Preferred by the report, and it would also end
  the 404. Rejected on the evidence: the container has no image encoder (no `sharp`, no `jimp`, no
  ImageMagick, no PIL, no Chromium), so the files cannot be produced without adding a dependency
  purely to generate placeholder bytes — and the real fix is product photography, which is a content
  problem no agent can solve by generating something.
- **O2 — fall back at render time.** `src/pages/catalog/item/[itemId].tsx`'s `<img>` gets an `onError`
  that swaps `src` once to a committed `public/images/placeholder.svg`, guarded so a failure to load
  the placeholder itself cannot loop. `alt={item.productName}` is unchanged, so the accessible name is
  identical whichever image renders.

**O2 is chosen.** It fixes what a visitor experiences with about six lines and no contract change.

**Known residual:** the request for the seeded path still returns 404 before the fallback fires, so a
network log still shows one 404 per item page. That is honest — the asset genuinely does not exist —
and it is recorded as a follow-up rather than papered over. The defect's acceptance criteria are
written against the visible outcome for this reason, and the deviation from the reporter's first
criterion is deliberate.

## RC-2 — Why the "Change language" button works exactly once (SWHM-T-0084)

`UnavailableInLanguage.openLanguageSwitcher()` reaches across the DOM by id and calls `.click()` on
the header switcher's button. The failure is not vague fragility — it is one unreset ref in
`@headlessui/react` v2.2.10.

`node_modules/@headlessui/react/dist/hooks/use-handle-toggle.js` is the whole mechanism:

```js
function s(t) {
  let r = l(null);                                  // remembers the last pointerType
  let u = o(e => { r.current = e.pointerType;       // onPointerDown
                   … e.pointerType === "mouse" && e.button === Left && t(e) });
  let i = o(e => { r.current !== "mouse" && t(e) });// onClick — skipped once r.current is "mouse"
  return { onPointerDown: u, onClick: i };
}
```

`r.current` is set on every `pointerdown` and is **never cleared**. So:

- On a fresh button `r.current` is `null`. A bare `.click()` dispatches only `click`; `null !== "mouse"`
  is true, the toggle runs, the menu opens. This is the working case, and it works by accident.
- After one real mouse press on that button, `r.current === "mouse"` for the lifetime of the component.
  A bare `.click()` now hits the `onClick` guard and is discarded, and no `pointerdown` preceded it to
  take the other branch. The menu never opens again.

That is exactly the reported asymmetry, including why loading `?locale=zh_CN` directly still works —
the header button has had no real press in that session.

## D-5 — The panel owns its own menu instead of driving someone else's

Three candidate fixes:

- **O1 — dispatch a fuller synthetic sequence** (`pointerdown` with `pointerType: "mouse"`, then
  `click`). It would work, but it is written against a private ref in a dependency and would break on
  a `@headlessui` patch release with no test to catch it — and `jsdom` has no `PointerEvent`, so the
  regression test the defect asks for could not exist at the unit tier. Rejected.
- **O2 — lift the menu's open state into a shared prop.** `Menu` in `@headlessui/react` v2 exposes no
  controlled `open`, so this is not available. Rejected.
- **O3 — give `UnavailableInLanguage` its own language menu, driven by a callback.** Chosen.

`LanguageSwitcher` gains one optional prop, `label?: string`. Without it nothing changes — the button
still reads the current language, and `LanguageSwitcher.test.tsx` passes unmodified. With it the
button reads that label instead, which lets the panel render
`<LanguageSwitcher label="Change language" … />` and keep the accessible name `UL-04` already asserts.
One menu implementation, not two.

`UnavailableInLanguage` gains `onChangeLocale?: (next: Locale) => void`. It is **optional on purpose**:
`UL-01`–`UL-04` render the panel in isolation without it and must keep compiling, and a panel with no
handler behaves exactly as it does today — the control renders and selecting a language does nothing.
Every real call site passes `setLocale`, which each of the three catalogue screens already holds.

With no component reaching into another, `LANGUAGE_SWITCHER_MOUNT_ID` has no remaining purpose. The
constant and the three `<div id={…}>` wrappers that existed only to serve it are removed; the wrapper
`div`s stay where they carry layout.

The regression this fixes is "works once, then never", so the test that proves it must open the menu,
select, and open it again — a single render, two complete cycles, two `onChangeLocale` calls. The old
code fails that test at the second open, which is the property the four existing isolated-render tests
could not have.

**Standing rule this establishes:** a component never drives another component's internal state by
synthesizing DOM events. It is recorded in ARCHITECTURE.md § Key Decisions because it binds every
later screen, not just this panel.

## Sequencing

Two pairs of tickets share a file and are therefore ordered, not parallel:

- `SWHM-T-0080` → `SWHM-T-0081`, both rewriting `src/pages/index.tsx` and `src/pages/index.test.tsx`.
  The logo lands first because it is self-contained; the link rewrite then has one file to reason about.
- `SWHM-T-0083` → `SWHM-T-0084`, both editing `src/pages/catalog/item/[itemId].tsx` — the first owns
  its `<img>`, the second owns the language-switcher mount and the panel's props. They are unrelated
  regions of one file, which is exactly the case that produces a silent conflict if run together.

`SWHM-T-0082` shares no file with anything and runs independently.
