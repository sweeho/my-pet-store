# Design — SWHM-S-0010, SWHM-T-0098

Read this before the `PLAN.md`. The plan's steps cite the sections here rather than repeating them.

## Measured context

Read from the working tree at `bf8a233`, the sprint branch's fork point, not taken from the report.
Every claim in the report held. The measurements below add what it did not cover.

**Which entities carry which locales** (`catalog/seed.ts`):

| Entity kind  | `en_US` | `ja_JP` | `zh_CN`  |
| ------------ | ------- | ------- | -------- |
| Category (5) | all     | all     | **all**  |
| Product (10) | all     | all     | **none** |
| Item (20)    | all     | all     | **none** |

So in `zh_CN` today: `/catalog` lists five translated categories; a category screen resolves but its
product list comes back empty, which the existing empty-list path already answers with the recovery
panel; an item screen 404s and gets the panel; and a product screen 404s and gets the generic Not
Found. One screen out of four is wrong, and it is the one between two that are right.

**Where the reason is produced and lost.** All three detail endpoints —
`routes/api/catalog/{categories/[categoryId],products/[productId],items/[itemId]}.get.ts` — answer a
404 with `{ error, reason }`, where `reason` comes from `missingReason()` in
`catalog/availability.ts`. The list endpoints answer `400` on a bad argument and never 404, so a 404
in this application always carries a reason. `useCatalogFetch` (`src/pages/catalog/shared.ts:95`) never
reads the body on its 404 branch.

**How the three detail screens consume it:**

| Screen                      | Hook                      | 404 handling                                     |
| --------------------------- | ------------------------- | ------------------------------------------------ |
| `item/[itemId].tsx`         | page-local `useItemFetch` | branches on `reason` — correct                   |
| `product/[productId].tsx`   | shared `useCatalogFetch`  | `if (notFound) return <NotFound />` — the defect |
| `category/[categoryId].tsx` | shared `useCatalogFetch`  | `if (notFound) return <NotFound />` — latent     |

The category row is the one the report does not mention. It is the identical fault and it is currently
unreachable, because no category is missing a locale row. It becomes reachable the first time one is.

## RC — the reason is thrown away one layer below the screen that needs it

`useCatalogFetch` collapses a 404 to `{ data: null, notFound: true }` without parsing the response, so
the discrimination the server performs is destroyed before any screen sees it. The product screen is
not making a wrong decision; it has nothing to decide with.

The item screen was given a page-local copy of the hook rather than a fix to the shared one, and its
comment says why: _"shared.ts belongs to SWHM-T-0072, so this is scoped to the one screen that needs it
rather than changing the shared hook."_ That was a reasonable ownership call inside its own sprint. Its
lasting effect is two hooks that differ in exactly one respect, with two of the three screens on the
wrong one.

## D1 — fix the shared hook, not the screen

Change `useCatalogFetch` to return `{ data, reason }` where `reason` is `MissingReason | null`, delete
`useItemFetch`, and branch all three detail screens on `reason`.

The narrower alternative — give the product screen its own local hook, mirroring the item screen —
produces three copies of one fetch, leaves the category screen's dead end in place, and repeats the
decision that caused this defect. The ownership reason that justified the first copy has expired.

Changing the return type is what makes this safe rather than risky: `notFound` disappears, so
TypeScript fails on every site that reads it and the latent category instance cannot be overlooked. The
three list call sites (`categories`, `products`, `items`, `searchResults`) destructure `data` only and
are unaffected.

Net effect is less code than before: one hook instead of two, and one `MissingReason` declaration on
the browser side instead of two.

## D2 — parse the 404 body defensively

The new 404 branch reads the body to get `reason`. A 404 whose body is missing or is not JSON must
yield `"not-found"` — today's behaviour, and the safe direction, since the failure mode of guessing
"missing-translation" is telling a visitor that a page which genuinely does not exist is merely
untranslated.

This is defensive rather than reachable through the API: every 404 the application itself produces
carries a reason. It is worth having anyway because it also removes a real hang. `useItemFetch` calls
`response.json()` on _every_ response without a guard, so any non-JSON body leaves the screen on
"Loading item…" indefinitely, with no error and no timeout. The consolidated hook must not inherit
that.

## D3 — the panel has to name what it is talking about

`UnavailableInLanguage` derives its body copy from an optional `noun` prop describing a list's
contents, and falls back to the literal `"item"` when there is none
(`src/pages/catalog/UnavailableInLanguage.tsx:38`). Rendering it as-is on the product screen would read
"This **item** has nothing translated into 中文" on a page about a product.

Add an optional `entity?: "product" | "item"` defaulting to `"item"`, so the item screen's rendered
copy is byte-identical to today's and the product screen reads "This product has nothing translated
into 中文". The three-part pattern DESIGN.md § Unavailable content states fixes — a heading naming the
cause, a body saying nothing is broken, a one-click resolution plus a control that changes the
condition — is unchanged; only the noun inside part two moves.

## D4 — `MissingReason` is declared once on the browser side

Declare it in `src/pages/catalog/shared.ts`, carrying forward the comment the item screen already has:
it mirrors `catalog/availability.ts` rather than importing it, because that module reaches
`db/client.ts` and would pull the database driver into the browser bundle. Two browser-side copies
become one.

`catalog/types.ts` is pure type declarations with no imports and is already imported by every
catalogue screen, so it is the better long-term home — but moving the type there touches `catalog/**`
and the `catalog/catalog.ts` barrel that the routes import from, which is wider than this defect earns.
Recorded as a follow-up in `proposal.md`.

## What must not regress

- An id that names nothing still reaches the Not Found screen, on all three detail screens.
  `e2e/language.spec.ts` already asserts this for the item screen and must keep passing.
- The product screen's existing `showUnavailable` path — product translated, item list empty in this
  locale — is a different condition with a different trigger and is not touched. PT-04 and PT-05 on
  both the product and category screens pin it.
- The item screen's rendered output does not change at all. Its hook is replaced by an equivalent one
  and its panel copy is preserved by D3's default.

## Sequencing

One ticket, no dependencies. The whole fix is inside `src/pages/catalog/` plus one browser-tier spec.

## Verification note

The browser tier does not run in an implementation container — `scripts/ensure-playwright-browser.mjs`
fails fast because Chromium is genuinely absent (`.vortex/agents-generated.md`). The browser-tier
assertion in this change is observed in CI on the ticket branch and again at integration QA. Do not
retry it locally and do not install a browser.
