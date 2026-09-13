# SWHM-T-0072 — Locale Support

**Change:** `swhm-i-0005-multi-language-support` · **Group:** `## 1. Locale Support` (1.1–1.3)
**Requirements:** Language preference persistence; Multi-language support

> Read `openspec/changes/swhm-i-0005-multi-language-support/` first. Its decisions document is an
> extraction from the legacy application and says outright that this capability's user interface is
> unspecified — so for the screen-level decisions here, the authority is
> `artifacts/SWHM-S-0007/PLANNING-NOTES.md` § Decisions (D2) and the design references below.

## Objective

Make `useCatalogLocale()` the single place that decides _and changes_ the active catalogue locale,
and add the control a customer uses to change it. After this ticket the locale is resolvable and
settable; mounting the control on the screens is SWHM-T-0075.

## Design reference

- `artifacts/SWHM-S-0007/design/mockup-category-page-in-language-menu-open.html` — the control's
  appearance and behaviour: a `🌐 English (US) ▾` trigger, three options each showing the language
  name with its locale code as secondary text, a checked marker on the current one, and the footnote
  "Saved to your profile — applies on every visit."
- `artifacts/SWHM-S-0007/design/wireframe-catalog-before-after-the-language-contro.html` — where the
  trigger sits relative to the screen's heading row.
- `artifacts/SWHM-S-0007/design/MANIFEST.md` — what each reference fixes.

## Steps

1. **`writeCookie()` in `src/utils/cookies.ts`.** Mirror the existing `readCookie()`: it
   `decodeURIComponent`s on the way out, so the writer `encodeURIComponent`s on the way in, which is
   also what makes a value containing `;` or `,` survive the round trip. Give it a `Path=/` and an
   explicit `Max-Age` so the choice outlives the tab — a session cookie would not satisfy "survives a
   reload" in a fresh browser start. `SameSite=Lax`. Not `httpOnly` and not `Secure`: this cookie is
   written and read by the client, and the E2E tier runs over plain HTTP on :5178.
2. **Resolution order in `useCatalogLocale()`** — `?locale=` search param → `petstore_locale` cookie
   → signed-on `profile.preferredLanguage` → `DEFAULT_LOCALE`. See PLANNING-NOTES D2 for why the URL
   leads and the cookie precedes the profile. The first two are synchronous, so a screen with either
   one present must not wait on the `/api/customer` round trip before it has a locale — that latency
   is the difference between a screen that flashes English and one that does not. `Accept-Language`
   is explicitly not consulted (PLANNING-NOTES S6).
3. **The setter.** `setLocale(next)` writes the cookie, sets the `locale` search param on the current
   URL, sets `document.documentElement.lang = next`, and — only when a session exists — sends
   `PUT /api/customer` with `{ profile: { preferredLanguage: next } }`. That request is
   fire-and-forget: a 401 means "no session", which is the visitor path, so it leaves the locale
   applied and raises no error state. This mirrors how the hook already treats a failed profile read
   (`src/pages/catalog/shared.ts:25`).
4. **`LanguageSwitcher`.** Options derived from `LANGUAGES` in `account/vocabulary.ts` — one list, not
   two; the profile form already reads the same constant (`src/pages/customer.tsx:398`). The display
   names (`English (US)` / `日本語` / `中文`) are a lookup keyed by locale code beside the component.
   Use `@headlessui/react`'s `Menu` (already a dependency and already used for the home nav dialog)
   with `Button variant="outline" size="sm"` as the trigger and a `lucide-react` globe icon. The
   control is presentational: props `{ locale, onChange }`, no fetching of its own.
5. **Keep the existing screens passing.** The four page tests under `src/pages/catalog/` mock
   `/api/customer` and must not need editing: with no search param and no cookie the order still ends
   at the profile value or `en_US`, which is today's behaviour. If one of them fails, the resolution
   order is wrong — do not edit the test.

## Fixed interface contracts

SWHM-T-0075 and SWHM-T-0076 code against these. Changing one is a plan revision, not an
implementation choice — escalate to planning rather than editing it.

```ts
// src/pages/catalog/shared.ts
export function useCatalogLocale(): {
  locale: Locale | null;          // null only until the first resolution completes
  setLocale: (next: Locale) => void;
};

// src/components/LanguageSwitcher.tsx
export function LanguageSwitcher(props: {
  locale: Locale;
  onChange: (next: Locale) => void;
}): ReactElement;

// src/utils/cookies.ts
export function writeCookie(name: string, value: string, days?: number): void;
```

- Cookie name: **`petstore_locale`**. Search param: **`locale`**.
- `LanguageSwitcher` is exported from `src/components/index.ts`, so consumers import from
  `@/components` like every other shared component.

## File / module ownership

`src/utils/cookies.ts`, `src/utils/cookies.test.ts`, `src/pages/catalog/shared.ts`,
`src/pages/catalog/shared.test.ts` (new), `src/components/LanguageSwitcher.tsx` (new),
`src/components/LanguageSwitcher.test.tsx` (new), `src/components/index.ts`.

Not this ticket's: the four screens under `src/pages/catalog/**/*.tsx` (SWHM-T-0075), `src/pages/customer.tsx`,
anything under `routes/`, `catalog/`, `db/` or `e2e/`.

## Definition of Done

AC-1 through AC-7 on the ticket. AC-2 to AC-4 are the resolution order and the setter's three
persistence effects; AC-5 is the one-list constraint; AC-6 is the cookie round trip; AC-7 is the
compatibility constraint from step 5. `src/pages/catalog/shared.test.ts` is new because the hook has
never been covered directly — it has only ever been exercised through the four screens, which is why
a resolution-order regression would currently surface as four confusing page-test failures.

## Gotchas

- `src/pages/catalog/shared.ts` is deliberately `.ts`, not `.tsx`, so `vite-plugin-pages` never
  registers it as a route. It stays `.ts` — a hook needs no JSX. `LanguageSwitcher` lives under
  `src/components/`, not `src/pages/`, for the same reason.
- `react` and `react-router` are auto-imported (`unplugin-auto-import`); do not add an import for
  `useState`, `useEffect` or `useSearchParams`, and do not hand-edit `auto-imports.d.ts`.
- `LanguageSwitcher` is a behavioural component, not a design-system primitive, so it belongs beside
  `RequireSignOn.tsx` in `src/components/` — not in `src/components/ui/`, whose pattern
  (`cva` variants in a separate `*-variants.ts`) does not apply here. See `DESIGN.md § Components`.
- Setting the search param must not push a new history entry per switch, or Back walks the customer
  through their own language changes.
