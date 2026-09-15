---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0009
ticket: SWHM-T-0095
branch: vortex/fix/SWHM-T-0095-no-catalog-item-ships-a-real-product-ima-95db0853
upstream: [artifacts/SWHM-S-0009/SWHM-T-0095/PLAN.md]
downstream: [artifacts/SWHM-S-0009/qa-test-report.md]
---

# Fix note — SWHM-T-0095: no catalog item ships a real product image

## Root cause

`catalog/seed.ts` wrote 20 distinct `.jpg` image locations across its 40 item-detail rows
(e.g. `/images/birds/african-grey.jpg`), but `public/images/` shipped only
`placeholder.svg`, added by SWHM-T-0083 as the error fallback. Nothing compared the seed's
locations against the files on disk, so every real image request 404'd and silently
degraded to the placeholder via the item page's `onError` handler — the page kept
rendering, so the gap was only visible in a network log. Confirms design.md RC-2 exactly;
no correction to Planning's diagnosis needed.

## Fix

Shipped one committed flat-vector SVG illustration per distinct location (20 files under
`public/images/<category>/<slug>.svg`), following `placeholder.svg`'s idiom — no external
reference, no embedded raster — per design.md D3. Each illustration uses a distinct
silhouette, color palette and pattern so it reads as the breed it names and is
distinguishable from the other 19 (e.g. the two poodles differ by body size and coat
color; the two goldfish differ by tail shape and color pattern; the two snakes differ by
body pose — S-curve vs coiled — and marking shape).

Updated all 40 `image` values in `catalog/seed.ts` from `.jpg` to the matching `.svg` path.
This is a data change only — `imageLocation`'s name, type and position are untouched in
`catalog/item.ts`, `catalog/search.ts`, `catalog/types.ts` and every API response shape, and
nothing in the codebase parses the extension (design.md D3).

Left `src/pages/catalog/item/[itemId].tsx`'s `onError` fallback and its PT-08 test alone,
per PLAN.md step 6 — that test drives the error path with a synthetic event against its own
fixture and is independent of real asset availability.

## Regression test

`catalog/seed-images.test.ts` (new file, `server` Vitest project — it imports
`catalog/seed.ts`, which reaches `db/client.ts` and the `bun:sqlite` builtin, per design.md
D4 and AGENTS.md's Cross-cutting constraints note):

- `IT-01: every distinct seeded image location is a file the app actually ships` — walks
  `CATALOG_SEED`, collects the distinct `image` values, asserts each resolves to a file
  under `public/`.
- `IT-02: the seed names exactly the 20 distinct illustrations this ticket shipped` — pins
  the exact set of 20 locations, so a future edit that reintroduces an unshipped path (or
  silently drops one of the 20 illustrations) fails here rather than only in a network log.

Extended `e2e/catalog.spec.ts`'s existing item-detail assertion to also check the rendered
image's `src` is the item's own location (not the placeholder) and that no `image`-typed
response in the whole browse+search journey came back non-OK. This is the browser-tier half
of the fix (AC-2/AC-3) and does not run in this container — see Notes.

Red→green recorded in `tdd-test-result.md`.

## Files touched

- `catalog/seed.ts` — 40 `image` values changed from `.jpg` to the matching `.svg` path.
- `public/images/{birds,cats,dogs,fish,reptiles}/*.svg` — 20 new committed illustrations, one
  per distinct location.
- `catalog/seed-images.test.ts` — new regression test (server project).
- `e2e/catalog.spec.ts` — extended the existing item-detail scenario with the own-image and
  no-404 assertions.

## Notes

The browser tier (`bun run test:e2e`, part of `verify:full`) does not run in this
implementation container — `scripts/ensure-playwright-browser.mjs` reports Chromium is
genuinely not installed, consistent with AGENTS.md's "Notes from previous agents" entry for
this same sprint. Fell back to `bun run verify` (lint + typecheck + the full unit/integration
suite), which is fully green. The `e2e/catalog.spec.ts` assertions are observed in CI on this
branch and again at INTEGRATION_QA, per design.md's Verification note.
