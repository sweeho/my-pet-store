# Let every catalogue detail screen tell "does not exist" from "not translated"

## Why

One defect, raised by the Inspector against `dev` at `81f55c7`: a product with no translation in the
active language shows the generic Not Found screen instead of the language-unavailable panel the item
screen has shown for the same condition since SWHM-S-0007.

The server already answers this correctly. All three catalogue detail endpoints return a 404 carrying
`reason: "not-found" | "missing-translation"`, and ARCHITECTURE.md § Key Decisions records why that
field exists — an entity and its per-locale detail row are separate, so a `null` has two causes that
owe a visitor different answers. The client throws the field away. `useCatalogFetch`
(`src/pages/catalog/shared.ts`) reduces every 404 to a bare `notFound` boolean without reading the
body, so the product screen cannot tell the two apart and renders a dead end for content that exists.

The item screen escaped this by carrying its own page-local copy of the hook, `useItemFetch`, whose
source comment records the shared hook as deliberately out of scope at the time: _"shared.ts belongs to
SWHM-T-0072, so this is scoped to the one screen that needs it rather than changing the shared hook."_
That scoping decision is what this defect is. The reason it gave has expired — SWHM-T-0072 shipped
several sprints ago — and the duplication it created is what left the product screen behind.

Root-causing also found the same dead end one level up. `src/pages/catalog/category/[categoryId].tsx`
branches on the same bare boolean and renders the same generic screen. It is not reachable with the
catalogue as seeded — every category carries a `zh_CN` row, while no product and no item does — so it
is a latent instance of the identical fault, not a second observable defect. Fixing one screen and
leaving it is how this defect was created the first time.

## What Changes

- Make the shared hook surface the `reason` the endpoints already send, in place of the boolean that
  discards it, and delete the page-local duplicate the item screen was given instead.
- Branch all three detail screens on that reason: not-found keeps the Not Found screen, missing
  translation gets the recovery panel. The product screen gains the behaviour it is missing; the item
  screen keeps the behaviour it has; the category screen's latent dead end closes with them.
- Let the recovery panel name the thing it is talking about, so a product screen does not tell the
  visitor "this item has nothing translated".

## Impact

- **`internationalization`** — one MODIFIED requirement (_Language recovery from an untranslated
  screen_, gaining the distinction between absent and untranslated content and two regression
  scenarios). No other capability moves: the endpoints, their response shapes and the catalogue data
  are all already correct and are not touched.
- **Code** — `src/pages/catalog/shared.ts`, the three detail screens under `src/pages/catalog/`,
  `src/pages/catalog/UnavailableInLanguage.tsx`, their unit tests, and `e2e/language.spec.ts`.
- **Not changed** — every route under `routes/api/catalog/`, `catalog/availability.ts`,
  `catalog/seed.ts`, and the `/catalog` index screen, which reads only list endpoints and never a 404.
  No API contract moves; this is a client-side defect throughout.
- **Root docs** — `ARCHITECTURE.md` only, and only § Cross-cutting constraints. § Key Decisions
  already carries the decision this defect violated; recording it a second time would be a copy.

## Follow-ups / out of scope

Found while root-causing, covered by the committed defect in neither cause nor fix, and left for a
later sprint. Planning cannot raise a defect ticket by design, so they are recorded here.

- **Four of the five capability specs carry a placeholder Purpose.** `internationalization`,
  `account-management`, `catalog-browsing` and `user-authentication` each open with
  "TBD - created by archiving change …. Update Purpose after archive." Only `application-foundation`
  has a real one. A delta cannot fix this — the text lives in `openspec/specs/`, which the platform
  owns — so it needs a deliberate pass by someone who can edit the spec of record.
- **`MissingReason` is mirrored rather than shared.** It is declared in `catalog/availability.ts` and
  hand-copied on the browser side, because importing it would pull `db/client.ts` into the browser
  bundle. `catalog/types.ts` is pure type declarations with no imports at all and is already imported
  by every catalogue screen, so it is the right home — but moving it touches `catalog/**` and the
  `catalog/catalog.ts` barrel, which is wider than this defect.
- **The three follow-ups carried forward from SWHM-S-0009's proposal are still open**: the 0-byte
  `tailwind.config.ts`, `middleware/auth.ts` attaching `{ name: "Yeasin" }` to every request, and
  `src/constants/index.ts`'s unused `API_BASE_URL` placeholder. SWHM-T-0091 tracks the last of these.
