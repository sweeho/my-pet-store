# PLAN — SWHM-T-0080: landing logo hotlinks a tailwindcss.com demo asset

Change: `swhm-s-0008-bugfix-found-by-inspector`
Requirement: _Product-branded application shell_ (`application-foundation`)

## Design reference

This sprint was raised from a defect batch with no linked idea, so there are no design blocks to
export and no `artifacts/SWHM-S-0008/design/` directory. The visual target is the existing header
layout — the mark occupies the same `h-8 w-auto` box the removed `<img>` did, in both places.

## Objective

Remove both requests to `tailwindcss.com` from `/` and render a store-branded mark in their place,
in the desktop header and in the mobile navigation panel.

## Steps

1. Read `design.md` § RC-1 and § D-1 first — they carry the root cause and the decision this plan
   executes. Do not re-derive them.
2. Add `src/components/StoreMark.tsx` exporting `StoreMark`, an inline SVG mark plus the
   `STORE_NAME` wordmark from `@/constants`. It takes a `className` (the call sites pass
   `h-8 w-auto`), uses `currentColor` so it reads on the dark header, and is `aria-hidden` — the
   accessible name stays on the surrounding `<a>`'s existing `sr-only` span, per § D-1.
3. Export it from `src/components/index.ts` alongside the existing components.
4. Replace the `<img>` at `src/pages/index.tsx:25-29` (desktop nav) and `:61-65` (mobile panel) with
   `<StoreMark className="h-8 w-auto" />`. Leave the `<a>`, its `sr-only` span and the surrounding
   layout classes exactly as they are.
5. Extend `src/pages/index.test.tsx` with an assertion that no rendered element on the page carries a
   `src` or `href` pointing off-origin, and that the store mark is present in both the header and the
   opened mobile dialog.

Do not touch the `navigation` array or any `href` — those belong to SWHM-T-0081, which runs after
this ticket on the same file.

## File / module ownership

Create:

- `src/components/StoreMark.tsx`

Modify:

- `src/components/index.ts` — one export line
- `src/pages/index.tsx` — the two logo `<img>` elements only
- `src/pages/index.test.tsx` — added assertions

Do not modify anything else. `src/constants.ts` is read, not changed.

## Definition of Done

- AC-1 and AC-2 on the ticket are met.
- `src/pages/index.test.tsx`'s four existing tests pass unmodified.
- No file outside the ownership map above is changed.
