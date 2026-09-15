# Close the three defects the Inspector found on `dev` HEAD `81f55c7`

## Why

Three defects were raised against `dev` HEAD `81f55c7`. Two of them are the same shape: a rule the
project already wrote down, with nothing in `openspec/specs/` or in any test that enforces it, so the
violation shipped unseen. The third is a real interaction bug with a precise, reproducible mechanism.

- **SWHM-T-0094** — `vite.config.ts` wires `unplugin-fonts` in Google-hosted mode, so every page's
  `<head>` carries a `preconnect` to `fonts.gstatic.com` and a `fonts.googleapis.com/css2` stylesheet
  link. DESIGN.md § Brand mark says a mark, icon or font is never referenced from a third-party host,
  and the requirement _Product-branded application shell_ already has a scenario asserting that every
  asset a page requests is served from the application's own origin. Nothing tests it at the network
  level, which is how a font survived the sprint that was about third-party assets.
- **SWHM-T-0095** — `catalog/seed.ts` names 20 distinct `/images/<category>/<slug>.jpg` paths across
  41 item-detail rows, and `public/images/` holds one file: `placeholder.svg`. Every catalogue image
  request is answered 404 and degrades to the placeholder SWHM-T-0083 added. DESIGN.md § Image states
  is explicit that the fallback is a degradation and not a fix.
- **SWHM-T-0097** — `middleware/signon.ts` remembers the requested path as the post-sign-on
  destination for _any_ denied request, including a background `fetch`. `/api/customer` is a protected
  resource and every catalogue screen fetches it on mount to resolve locale, so an anonymous visitor
  who merely browsed the catalogue is sent to a raw JSON endpoint after signing in.

Root-causing corrected the reported hypothesis on two of the three. The font is not applied to
anything — `Space Grotesk` appears in exactly one file in the repository and no stylesheet declares
it — so self-hosting the `.woff2` files, as the report proposed, would ship a typeface nothing uses.
And the protected-resource list is not what is wrong in SWHM-T-0097: denying an anonymous request for
`/api/customer` is correct. What is wrong is treating "deny this" and "remember where to send them
back" as one decision. `design.md` carries both.

## What Changes

- Remove the Google Fonts wiring — the plugin registration, its configuration file and the dependency
  — rather than self-hosting a face the application never applies. Add the network-level browser
  assertion the existing origin scenario never had.
- Ship a committed illustration at every image location the seed names, as flat SVG in the idiom
  `placeholder.svg` already established, and add the test that compares the seed's image locations
  against what the repository actually serves — the check whose absence let 20 missing files ship.
- Scope the remembered original URL to requests a visitor could have navigated to, leaving the access
  decision itself untouched, and answer a denied background request as unauthenticated instead of
  redirecting it to an HTML page it cannot use.

## Impact

- **`application-foundation`** — one MODIFIED requirement (_Product-branded application shell_,
  gaining a regression scenario for the document head and web fonts).
- **`catalog-browsing`** — one MODIFIED requirement (_Item image association_, gaining two scenarios:
  every seeded location resolves, and an item screen shows its own image rather than the fallback).
- **`user-authentication`** — one MODIFIED requirement (_Intercept unauthenticated access to protected
  resources_, gaining two scenarios separating the denial from the remembered destination).
- **Code** — `vite.config.ts`, `configs/**` (deleted), `tsconfig.node.json`, `package.json`;
  `catalog/seed.ts` and 20 new files under `public/images/`; `auth/signon-filter.ts` and
  `middleware/signon.ts`; the tests covering each, in the unit and browser tiers.
- **Not changed** — `auth/protected-resources.ts` (the list is correct), `routes/api/signon/check.get.ts`
  (it is given an explicit resource path, not the request's own), `db/schema.ts`, and every API
  response shape except the status of a denied non-navigation request. `src/index.css` gains and loses
  nothing: the store's type is unchanged because the removed font was never applied.
- **Root docs** — `ARCHITECTURE.md` only. Its § Stack names `unplugin-fonts`, its § Directory
  structure names `configs/`, and its § Request flow describes the middleware remembering every denied
  path — three statements this change makes untrue.

## Follow-ups / out of scope

Found while root-causing, covered by none of the three committed defects, and left for a later sprint.
Planning cannot raise a defect ticket by design, so they are recorded here.

- **`tailwind.config.ts` is a 0-byte tracked file** that nothing reads. ARCHITECTURE.md § Stack already
  records it as an inherited template remnant. Deleting it is a one-line change that belongs to no
  defect in this batch.
- **`middleware/auth.ts` still attaches `{ name: "Yeasin" }`** to `event.context.user` on every
  request. Carried over from the SWHM-S-0008 follow-up list, still present, still gating nothing.
- **`src/constants/index.ts` exports `API_BASE_URL = "https://api.your-api.com"`**, a template
  placeholder with no reader. Also carried over from SWHM-S-0008.
- **`GET /api/signon/check` will remember any same-origin path its caller names**, including an API
  path. No caller does, and this change does not widen it, but the guard that stops a background
  request from setting a return address does not apply to a client that asks for one explicitly.
