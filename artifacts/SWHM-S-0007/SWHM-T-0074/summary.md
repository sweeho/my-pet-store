---
ticket: SWHM-T-0074
sprint: SWHM-S-0007
type: summary
---

# Summary — SWHM-T-0074

## What changed

Added a `reason` discriminator (`"not-found" | "missing-translation"`) to the 404 body
of the three catalog detail endpoints, so a caller can tell "no such entity" apart from
"entity exists, no content in this locale" — per D1 in `PLANNING-NOTES.md`, which
supersedes the idea canvas's "no server change" for this exact reason.

- `catalog/availability.ts` (new) — `missingReason(kind, id)`: a locale-independent
  existence check against the entity table only (`category`/`product`/`item`), run once
  on the existing `null` path, never folded into the main localized query.
- `catalog/catalog.ts` — re-exports `missingReason` and the `MissingReason` type, keeping
  it the single import path `routes/` uses into `catalog/`.
- The three detail handlers (`categories/[categoryId].get.ts`, `products/[productId].get.ts`,
  `items/[itemId].get.ts`) — on the existing 404 path, call `missingReason` and add it to
  the body. Status code and `error` text are unchanged.
- Matching `.test.ts` files: existing "not found" cases now also assert `reason: "not-found"`;
  a new case per endpoint covers an existing entity with no row in the requested locale.
- `catalog/availability.test.ts` (new) — six cases, existence/absence for each of the
  three entity kinds.

No UI change — this ticket is server-only data-access-layer work; there is no design
mockup for it (the design references attached to this ticket belong to SWHM-T-0075,
which consumes the `reason` field this ticket adds).

## Acceptance criteria

- AC-1/AC-2 (locale retrieval, locale propagation) — already shipped (S3); reconfirmed
  by the full suite passing, not rebuilt.
- AC-3 — both endpoints' 404 bodies now carry `error` and `reason`; `reason` is
  `"missing-translation"` when the entity row exists, `"not-found"` when it doesn't.
  Covered by CD-03/PD-03/ID-03 (existing entity, no content in locale) and
  CD-02/PD-02/ID-02 (unknown id).
- AC-4 — under `en_US` (the default, and the tests' un-parametrized cases) an unknown id
  still answers `reason: "not-found"`, status and error text unchanged from before this
  ticket.
- AC-5 — `routes/` imports `missingReason`/`MissingReason` only from `catalog/catalog.ts`;
  `catalog/availability.ts` is never imported directly by a route.
- AC-6 — verified with the literal ids by hand against the real seed via the dev server
  (Vitest's `db/client.ts` skips the demo seed under `VITEST=true`, so this can't be an
  automated unit test against those exact ids):
  - `GET /api/catalog/items/BIRDS-PARROTS-1?locale=zh_CN` → 404,
    `{"error":"Item not found: BIRDS-PARROTS-1","reason":"missing-translation"}`
  - `GET /api/catalog/items/NO-SUCH-ITEM?locale=zh_CN` → 404,
    `{"error":"Item not found: NO-SUCH-ITEM","reason":"not-found"}`
  - `GET /api/catalog/items/BIRDS-PARROTS-1` (default locale) → 200 with the item body,
    confirming the happy path is untouched.
    The equivalent behaviour is pinned as an automated test in ID-03 using `RT-` fixtures.
- AC-7 — `MissingReason` is a two-literal discriminated union exported by name from
  `catalog/catalog.ts` (re-exported from `catalog/availability.ts`).

## Verification

```
$ bun run verify
lint: pass
typecheck: pass
test: 259 passed, 0 failed (52 files)
```

`bun run verify:full` was also attempted; its E2E stage stops at the Chromium preflight,
which this implementation container doesn't have — documented as expected in
`.vortex/agents-generated.md` and `PLANNING-NOTES.md` § Test harness. Not retried.

## Notes

- No deviation from `PLAN.md` — implemented exactly the steps and interface contract it
  specifies.
- List endpoints, `catalog/query.ts`, `locale.ts`, `category.ts`, `product.ts`, `item.ts`,
  `seed.ts`, `db/`, and `src/` were not touched, per ownership.
