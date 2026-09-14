---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0008
ticket: SWHM-T-0080
branch: vortex/fix/SWHM-T-0080-landing-page-header-mobile-menu-logo-hot-4fa0675d
upstream:
  [
    artifacts/SWHM-S-0008/SWHM-T-0080/PLAN.md,
    openspec/changes/swhm-s-0008-bugfix-found-by-inspector/design.md,
  ]
downstream: [artifacts/SWHM-S-0008/qa-test-report.md]
---

# Fix note — SWHM-T-0080: Landing page header/mobile-menu logo hotlinks a tailwindcss.com demo asset

## Root cause

`src/pages/index.tsx` is unmodified Tailwind Plus hero/nav template markup (design.md § RC-1).
Branding was applied to the text only (`STORE_NAME` reached the `h1` and both `sr-only` logo
labels); the template's placeholder `<img>` pointing at
`https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500` survived untouched
in both the desktop nav (`:25-29`) and the mobile navigation panel (`:61-65`). Every render of `/`
therefore issued a request to a third-party CDN for a demo asset with no relation to this product.

## Fix

Per design.md § D-1: added `src/components/StoreMark.tsx`, an inline SVG mark plus the
`STORE_NAME` wordmark, sourced entirely from `@/constants` with no binary asset and no network
request. The whole mark is `aria-hidden` and sized via a passed-through `className`
(`h-8 w-auto`, matching the removed `<img>`'s box). Both `<img>` elements in `src/pages/index.tsx`
were replaced with `<StoreMark className="h-8 w-auto text-white" />`; the surrounding `<a>` and its
existing `sr-only` span (which already carries the accessible name `STORE_NAME`) were left
untouched, so the logo link's accessible name is unchanged. Exported `StoreMark` from
`src/components/index.ts` alongside the existing components. No other element on the page
references an off-origin host.

## Regression test

`src/pages/index.test.tsx › Home page › requests no third-party asset and renders a
store-branded mark instead of the template logo` — asserts the header and (once opened) mobile
dialog logo links keep the accessible name `My Pet Store`, render an inline `<svg>` rather than an
`<img>`, and that no element on the page carries a `src`/`href` referencing `tailwindcss.com` or
any other absolute `http(s)://` URL. Red→green recorded in `tdd-test-result.md`.

## Files touched

- `src/components/StoreMark.tsx` — new inline SVG mark + wordmark component.
- `src/components/index.ts` — export `StoreMark`.
- `src/pages/index.tsx` — replaced both hotlinked `<img>` elements with `<StoreMark />`.
- `src/pages/index.test.tsx` — added the regression test above.
