# PLAN — SWHM-T-0095: no catalog item ships a real product image

Change: `swhm-s-0009-bugfix-swhm-t-0094-swhm-t-00`. Read that change's `design.md` first — § RC-2, D3
and D4 carry the decision to ship vector illustrations rather than photographs, and where the guard
test has to live.

## Objective

Every image location the shipped catalogue content names is answered with an image from the
application's own origin, and an item detail screen shows that image rather than the shared
placeholder.

## Design reference

The idea behind this sprint carries no design blocks — these are Inspector-raised defects with no
Ideas Canvas and no mockups, so there is nothing to export under `artifacts/SWHM-S-0009/design/`. The
standing visual rules that govern this work are DESIGN.md § Image states (the placeholder is a
degradation, not a fix) and the flat-vector, no-external-reference idiom of the existing
`public/images/placeholder.svg`.

## Steps

1. Collect the 20 distinct `image` values in `catalog/seed.ts` (5 category directories: birds, cats,
   dogs, fish, reptiles; 41 rows referencing them).
2. Author one committed SVG per distinct location under `public/images/<category>/<slug>.svg`,
   following `public/images/placeholder.svg`'s idiom: flat vector, no external reference, no embedded
   raster. Each must be recognisable as the breed it names and distinguishable from the other 19 — see
   design.md D3, which is explicit that 20 copies of one glyph satisfies the network log and fails the
   screen.
3. Update the 41 `image` values in `catalog/seed.ts` to the committed `.svg` paths. Nothing parses the
   extension (design.md D3); `db/schema.ts` and every API response shape stay as they are.
4. Add a test under `catalog/` that walks `CATALOG_SEED`, collects the distinct `image` values, and
   asserts a file exists under `public/` for each. It belongs in the `server` project — see design.md
   D4 and ARCHITECTURE.md § Cross-cutting constraints.
5. Extend `e2e/catalog.spec.ts`'s item-detail coverage: assert the rendered image's source is the
   item's own location and that no image request the screen made was answered 404.
6. Leave `src/pages/catalog/item/[itemId].tsx`'s `onError` fallback and its PT-08 test alone. PT-08
   drives the error path with a synthetic event against its own fixture, so it neither depends on nor
   regresses with real assets.

## File / module ownership

Only these files. No other ticket in this sprint touches any of them.

- `public/images/<category>/*.svg` — 20 new files
- `catalog/seed.ts`
- a new seed-asset test under `catalog/`
- `e2e/catalog.spec.ts`

Fixed contract: the `imageLocation` field on every catalogue API response keeps its name, its type and
its position. `db/schema.ts`, `catalog/item.ts`, `catalog/search.ts` and `routes/api/catalog/**` do not
move. Unit-test fixtures elsewhere that contain `/images/…jpg` strings are fixtures, not references to
the seed, and stay as they are.

## Definition of Done

The ticket's acceptance criteria AC-1, AC-2 and AC-3 hold. AC-1 is observed by the test added in step
4, AC-2 and AC-3 by the browser-tier assertion added in step 5 — which runs in CI on this branch, see
design.md § Verification note.
