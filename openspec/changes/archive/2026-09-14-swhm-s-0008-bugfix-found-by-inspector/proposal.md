# Close the five defects the Inspector found on `dev`

## Why

Five defects were raised against `dev` HEAD `7a82318`. Four of them are the same defect wearing
different clothes: the application still ships pieces of the template it was generated from, and
nothing in `openspec/specs/` says it must not. The fifth is a real interaction bug with a precise,
reproducible mechanism.

- **SWHM-T-0080** — the landing header and its mobile panel both `<img src="https://tailwindcss.com/plus-assets/img/logos/mark.svg…">`. The shipped product fetches its logo from a third party's demo CDN, and no store mark exists anywhere in the repository.
- **SWHM-T-0081** — every nav and hero link on `/` is `href="#"`. `/catalog`, `/signon` and `/customer` all exist and work; the landing page routes to none of them, so a first-time visitor has no way in.
- **SWHM-T-0082** — `src/pages/users/index.tsx`, `[id].tsx` and `profile.tsx` are template CRUD scaffolds serving hardcoded people (Alice Johnson, Bob Smith, Charlie Brown) to any visitor. Nothing links to them; file-based routing publishes them anyway.
- **SWHM-T-0083** — `catalog/seed.ts` names 20 distinct `/images/<category>/<slug>.jpg` paths and the repository ships no `public/images/` at all, so every item detail page renders a broken image.
- **SWHM-T-0084** — the missing-translation panel's "Change language" button opens the header switcher exactly once per page load, then never again.

The existing requirement _Product-branded application shell_ already forbids presenting "the name or
placeholder copy of the boilerplate it was generated from", but its two scenarios only check the `h1`,
the document title and the manifest. Three of the five defects sit squarely inside that requirement's
intent and outside its scenarios — which is the definition of a scenario gap, and why the delta below
mostly MODIFIES rather than ADDS.

## What Changes

- Replace both hotlinked logos with an in-repo store mark, so `/` makes no third-party request.
- Point every landing nav and hero link at a screen that exists, and drop the ones that name nothing
  this product has.
- Delete the three `src/pages/users/*` scaffold pages so those paths fall through to the catch-all.
  The `routes/api/users/*` handlers, the `users` table and their tests are deliberately untouched —
  they are real, database-backed and covered by `e2e/smoke.spec.ts`.
- Give the item detail image a placeholder to fall back to, so a missing asset degrades to a
  recognisable image rather than a broken one, with `alt` preserved. The seed's `image` values and the
  `imageLocation` contract do not move.
- Stop the missing-translation panel from reaching across the DOM to click another component's
  button; give it its own language menu driven by a callback.

## Impact

- **`application-foundation`** — one MODIFIED requirement (_Product-branded application shell_, gaining
  two regression scenarios) and one ADDED requirement (_Application shell navigation_, a genuine spec
  gap: nothing said the landing page had to reach anything).
- **`catalog-browsing`** — one MODIFIED requirement (_Item image association_, gaining a rendering
  scenario alongside its retrieval one).
- **`internationalization`** — one ADDED requirement (_Language recovery from an untranslated screen_;
  no existing requirement describes the recovery control, so there is none to modify).
- **Code** — `src/pages/index.tsx`, a new store-mark component, `src/pages/users/**` (deleted),
  `src/pages/catalog/item/[itemId].tsx`, `src/pages/catalog/UnavailableInLanguage.tsx`,
  `src/components/LanguageSwitcher.tsx`, the three catalogue screens that mount it, one new public
  asset, and the tests that cover each.
- **Not changed** — `catalog/seed.ts`, `catalog/item.ts`, `catalog/search.ts`, `db/schema.ts`,
  `routes/api/**`. No API contract moves.

## Follow-ups / out of scope

Found while root-causing, covered by none of the five committed defects, and left for a later sprint.
Planning cannot raise a defect ticket by design, so they are recorded here.

- **Product photography for the 20 seeded item images.** SWHM-T-0083 stops the broken image; it does
  not make `/images/birds/gouldian-finch.jpg` exist, so a network log still shows one 404 per item
  detail page. Ending that means shipping real assets at the seeded paths, which is a content
  decision, not a code one.
- **`middleware/auth.ts` runs on every request and attaches `{ name: "Yeasin" }`** to
  `event.context.user` — the template author's name, on every request the application serves.
  ARCHITECTURE.md already records that it is not authentication and gates nothing, and real
  authentication is `middleware/signon.ts`, so nothing depends on it. It is the same class of remnant
  as SWHM-T-0082 and should be deleted, but it sits outside every committed defect's scope.
- **`src/constants/index.ts` exports `API_BASE_URL = "https://api.your-api.com"`**, a template
  placeholder with no reader anywhere in the repository.
