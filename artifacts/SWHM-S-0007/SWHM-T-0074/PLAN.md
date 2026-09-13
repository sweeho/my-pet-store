# SWHM-T-0074 — Data Access Layer

**Change:** `swhm-i-0005-multi-language-support` · **Group:** `## 3. Data Access Layer` (3.1–3.3)
**Requirements:** Locale-based content retrieval; Locale parameter propagation

> Read `openspec/changes/swhm-i-0005-multi-language-support/` first, then
> `artifacts/SWHM-S-0007/PLANNING-NOTES.md` § Decisions **D1** and § Spec discrepancies **S3**. D1 is
> the decision this ticket implements and it **supersedes** the idea canvas's "No server change" — the
> reasoning is in D1 and it is not an implementation choice to revisit.

## Objective

Let a caller tell "this entity has no content in the requested locale" apart from "there is no such
entity". Boxes 3.1–3.3 — the locale parameter, the locale filter, the null return — are already
shipped (S3); this is the one thing the layer cannot currently express.

## The problem, precisely

`getCategory`, `getProduct` and `getItem` return `null` for both cases, because the entity/detail
inner join drops the row either way — which is the localization mechanism working as designed
(`ARCHITECTURE.md § Key Decisions`, translatable content in a per-locale detail row). The three
detail endpoints then turn that single `null` into a single 404
(`routes/api/catalog/items/[itemId].get.ts:14`). The idea requires the two to look different to a
customer: an untranslated item says so, an unknown item id still shows Not Found.

The entity table is the only place the difference is visible — `item` has a row, `item_details` does
not — so that is where the answer comes from. One extra existence check, on the unhappy path only.

## Steps

1. **`catalog/availability.ts`** — a function that answers, for a kind and an id, whether the entity
   row exists. Cite `catalog/query.ts` only for the locale predicate's single definition; this module
   deliberately does **not** take a locale, because the question it answers is locale-independent.
   Return the discriminated reason, not a boolean, so callers cannot re-derive the mapping
   differently:
   - entity row exists → `"missing-translation"`
   - entity row absent → `"not-found"`
2. **Re-export from `catalog/catalog.ts`.** That module is the single entry point `routes/` imports
   from (`catalog/catalog.ts:15-17`) and stays so — do not import `catalog/availability` from a route.
3. **The three detail endpoints.** On the existing `null` path only, ask for the reason and add it to
   the 404 body. Status stays 404; the `error` text stays exactly as it is. Under `en_US` the reason is
   always `not-found`, because `en_US` is complete (the invariant SWHM-T-0073 pins) — that is what
   makes "en_US behaves exactly as today" true rather than merely likely.
4. **Do not touch the list endpoints.** A category or product list with no content in a locale returns
   `EMPTY_PAGE`, and an empty page is already unambiguous — the screen knows the parent exists because
   it just rendered it. SWHM-T-0075 drives the empty-list state from `objects.length === 0` plus the
   active locale, with no server help needed.
5. **Tests** beside each changed file. Cover, per endpoint: an unknown id under `en_US`; an existing
   entity under `zh_CN`; an unknown id under `zh_CN`. The third is the case the idea's own client-side
   approach gets wrong, so it is the one that must exist.

## Fixed interface contracts

SWHM-T-0075 codes against the response body. Changing either shape is a plan revision — escalate to
planning.

```ts
// catalog/availability.ts, re-exported from catalog/catalog.ts
export type MissingReason = "not-found" | "missing-translation";
export function missingReason(
  kind: "category" | "product" | "item",
  id: string,
): MissingReason;
```

```jsonc
// GET /api/catalog/{categories,products,items}/:id  — 404 body, both cases
{ "error": "Item not found: BIRDS-PARROTS-1", "reason": "missing-translation" }
{ "error": "Item not found: NO-SUCH-ITEM",     "reason": "not-found" }
```

- Status code stays **404** for both. `reason` is additive — a consumer ignoring it is unaffected.
- The 200 response bodies are unchanged.

## File / module ownership

`catalog/availability.ts` (new), `catalog/availability.test.ts` (new), `catalog/catalog.ts`,
`routes/api/catalog/categories/[categoryId].get.ts` + `.test.ts`,
`routes/api/catalog/products/[productId].get.ts` + `.test.ts`,
`routes/api/catalog/items/[itemId].get.ts` + `.test.ts`.

Not this ticket's: `catalog/query.ts`, `catalog/locale.ts`, `catalog/category.ts`, `catalog/product.ts`,
`catalog/item.ts`, `catalog/seed.ts`, `catalog/seed.test.ts` (SWHM-T-0073), the list endpoints,
`db/`, and everything under `src/`.

## Definition of Done

AC-1 through AC-7 on the ticket. AC-1 and AC-2 are the delta spec's two retrieval scenarios, already
satisfied by shipped code (S3) — confirm, do not rebuild. AC-3 and AC-6 are the new discriminator and
its two worked cases. AC-4 is the en_US no-change constraint. AC-5 is the single-entry-point
constraint. AC-7 fixes the type so SWHM-T-0075 can switch on it exhaustively.

## Gotchas

- `catalog/availability.ts` must **not** go under `routes/`. Nitro scans `routes/` and a `.ts` file
  there becomes an HTTP endpoint whether or not it exports a handler — see
  `ARCHITECTURE.md § Routing` and `.vortex/agents-generated.md`.
- `catalog/**/*.test.ts` and `routes/**/*.test.ts` are already in Vitest's `server` project
  (`vitest.config.ts:59-64`). No new top-level directory is created here, so `vitest.config.ts` needs
  no edit — that is the one thing a new capability directory would have required.
- Route tests construct a real `H3Event` and run no server; mirror the existing
  `routes/api/catalog/items/[itemId].get.test.ts`.
- The extra existence check runs only when the localized read already returned `null`, so the happy
  path keeps its single statement. Do not fold it into the main query as an outer join — that trades
  a rare second read for a wider plan on every request, and it would put a `null`-name row back into
  a type that currently cannot hold one.
- `routes/` reaches `catalog/` and `db/` by relative path (`../../../../catalog/catalog`); there is no
  `@` alias on the server side.
