# Design — SWHM-S-0009 bugfix batch

Read this before any `PLAN.md`. Each plan's steps cite a section here rather than repeating it.

## Measured context

Everything below was read from the working tree at `dev` HEAD `81f55c7`, not taken from the reports.
Two of the three reported hypotheses did not survive.

| Claim in the report                                     | What the code says                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The font must be self-hosted (`.woff2` under `public/`) | `Space Grotesk` occurs in exactly one file, `configs/fonts.config.ts`. `src/index.css` declares no `font-family` and no `--font-*` token, `tailwind.config.ts` is 0 bytes, and the plugin's `unfonts.css` virtual module is imported nowhere. The face is fetched and applied to nothing. |
| Seed data spans 6 categories including "others"         | 5 categories — birds, cats, dogs, fish, reptiles — matching `CATEGORIES` in `account/vocabulary.ts`. 41 item-detail rows, 20 distinct image locations.                                                                                                                                    |
| Self-hosting risks a flash of unstyled text             | No risk either way: removing the face leaves the store on the platform system stack it already renders in.                                                                                                                                                                                |
| The protected-resources list needs revisiting           | The list is correct. `routes/api/customer/index.get.ts:12` already answers 401 for an anonymous caller; the middleware simply never lets the request reach it.                                                                                                                            |

## RC-1 — the font is wiring with no reader (SWHM-T-0094)

`vite.config.ts:45` registers `Fonts({ google: { families: fonts } })`.
`unplugin-fonts`'s Google loader defaults `preconnect: true`, so every built page gets a `preconnect`
to `https://fonts.gstatic.com/` and a stylesheet `<link>` to `https://fonts.googleapis.com/css2`.
Because nothing declares the face, the store's type comes from Tailwind's default `--font-sans` — a
system stack the operating system supplies with no request at all.

### D1 — remove the wiring rather than self-host it

Self-hosting would commit four `.woff2` weights to serve a typeface no element selects. The smallest
change that satisfies the rule is to delete the plugin registration, its two imports, the `configs/`
directory (`fonts.config.ts` and the barrel that re-exports it — no other importer exists), the
`configs` entry in `tsconfig.node.json`'s `include`, and the `unplugin-fonts` dependency. An unused
dependency whose only purpose is to hotlink fonts is how this comes back.

Nothing a visitor sees changes. If a deliberate brand typeface is wanted later, that is a DESIGN.md
decision about the type scale, made on its own, and it self-hosts from the start.

### D2 — the regression guard is a network assertion, not a DOM one

The existing scenario _Home page requests no third-party asset_ has been in the spec of record since
SWHM-S-0008 and this defect still shipped, because the only thing enforcing it was
`src/pages/index.test.tsx` checking two `<img>` elements. jsdom cannot see a `<head>` link that Vite
injects at build time, so the guard has to live in the browser tier: collect every request URL the
page issues and assert each one's origin is the application's own.

## RC-2 — seeded image locations name files the repository does not contain (SWHM-T-0095)

`catalog/seed.ts` writes an `image` value on every item-detail row; `public/images/` contains only
`placeholder.svg`, added by SWHM-T-0083 as the fallback. Nothing compares the two, so the gap is
invisible outside a network log — the page still renders, with the placeholder.

### D3 — ship flat SVG illustrations, not photographs

The alternative is 20 licensed raster photographs, which an agent cannot source without reaching a
third-party host — the exact thing SWHM-T-0094 removes in this same change — and which nobody on this
team is authorised to license. A committed vector has none of those problems: it is small, diffable,
deterministic, and it is already the idiom `public/images/placeholder.svg` established and DESIGN.md
§ Image states describes.

The consequence is that the seed's locations change extension from `.jpg` to `.svg`. That is a data
change, not a contract change: `imageLocation` is specified as "an image location (file path or URL)"
and nothing parses its extension. Each of the 20 is category-appropriate and distinguishable from the
other 19 — a silhouette and palette that reads as the breed it names. Twenty copies of one glyph would
satisfy the network log and fail the screen.

Unit-test fixtures elsewhere (`catalog/item.test.ts`, `routes/api/catalog/**`,
`src/pages/catalog/**`) use arbitrary `/images/…jpg` strings of their own. They are fixtures, not
references to the seed, and do not move.

### D4 — the guard is a seed-to-disk comparison in the `server` project

A test that walks `CATALOG_SEED`, collects the distinct `image` values and asserts a file exists under
`public/` for each. It must live under `catalog/`: `catalog/seed.ts` imports `db/client.ts`, which
imports the `bun:sqlite` builtin, and the jsdom `client` project cannot resolve that at all
(ARCHITECTURE.md § Cross-cutting constraints). The browser tier adds the other half — that an item
screen shows its own image rather than the fallback — which a filesystem test cannot observe.

## RC-3 — denial and the return address are one decision when they are two (SWHM-T-0097)

`middleware/signon.ts:18` calls `setOriginalUrl(session, path)` on every denial, with no notion of who
asked or why. `/api/customer` is in `PROTECTED_RESOURCES` — carried over from the legacy `customer.do`
servlet, where it was only ever reached by a full-page form submission. In this SPA it is also a plain
JSON endpoint that `useCatalogLocale` (`src/pages/catalog/shared.ts:36`) fetches on mount on every
catalogue screen, regardless of session. So an anonymous catalogue visit writes `/api/customer` into
`sessions.original_url`, and `routes/api/signon/index.post.ts:36` hands it back verbatim as
`redirectTo`.

Worth recording because it hid the bug: the background fetch follows the 302 to the `/signon` HTML
page and receives a 200, so `response.ok` is true and `response.json()` rejects. The hook reaches its
visitor path only through its `.catch`. Nothing was ever reported as failing.

### D5 — only a navigation may set the return address

A pure predicate classifies a request as a navigation from its Fetch Metadata headers
(`Sec-Fetch-Mode: navigate`, or `Sec-Fetch-Dest: document`), falling back to an `Accept` header that
prefers `text/html` when those headers are absent. The middleware calls `setOriginalUrl` only when it
holds. `evaluateAccess` is not touched, so what is protected and who may reach it are unchanged — a
denied request is still denied, it simply no longer leaves a return address behind.

### D6 — a denied non-navigation request is answered 401, not redirected

A JSON client cannot use a redirect to an HTML sign-on page; today it "works" only because parsing the
returned HTML throws into a `catch`. Answering 401 makes the refusal legible to the caller and lands
`useCatalogLocale` on the `response.ok === false` branch it already has for a visitor. This also
matches what `routes/api/customer/index.get.ts` answers when it is reached directly.

### D7 — the predicate lives in `auth/`, beside `evaluateAccess`

`middleware/**` is in neither Vitest project's include list, so a test placed there would run under
jsdom and fail to resolve `bun:sqlite`. `auth/signon-filter.ts` already exists for exactly this reason:
it is the pure, testable half of the middleware, and it runs in the `server` project.

`routes/api/signon/check.get.ts` is deliberately unchanged. It is given an explicit `resource` path by
a client asserting a navigation intent — it is not classifying a request of its own — and CH-01/CH-02
must keep passing unchanged.

## Sequencing

The three file-ownership maps are disjoint, so no ticket depends on another and all three can run in
parallel. The only shared surface is the browser tier, and each ticket owns a different spec file
(`e2e/home.spec.ts`, `e2e/catalog.spec.ts`, `e2e/signon.spec.ts`).

One cross-cutting note for whoever lands first: SWHM-T-0094 removes a Vite plugin, which changes the
build for every branch that rebases onto it afterwards. It removes a `<head>` injection and nothing
else; no page, style or test outside its own ownership map depends on it.

## Verification note

The browser tier does not run in an implementation container — `scripts/ensure-playwright-browser.mjs`
fails fast because Chromium is genuinely absent (`.vortex/agents-generated.md`). Every browser-tier
assertion in this change is observed in CI on the ticket branch and again at integration QA. Do not
retry it locally and do not install a browser.
