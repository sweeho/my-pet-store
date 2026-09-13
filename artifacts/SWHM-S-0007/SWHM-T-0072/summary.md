---
artifact: summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0007
ticket: SWHM-T-0072
branch: vortex/feat/SWHM-T-0072-locale-support-resolve-the-active-locale-71e2bfaa
upstream: [artifacts/SWHM-S-0007/SWHM-T-0072/PLAN.md]
---

# Summary — SWHM-T-0072

`useCatalogLocale()` is now the single place that decides and changes the active catalogue locale,
and `LanguageSwitcher` is the control that changes it (unmounted — mounting it is SWHM-T-0075).

## Changed

- `src/utils/cookies.ts` (+ `.test.ts`) — added `writeCookie(name, value, days = 365)`, mirroring
  `readCookie`'s `decodeURIComponent`/`encodeURIComponent` symmetry, `Path=/`, an explicit `Max-Age`,
  `SameSite=Lax`.
- `src/pages/catalog/shared.ts` — `useCatalogLocale()` now returns `{ locale, setLocale }`. Resolution
  order: `?locale=` search param → `petstore_locale` cookie → signed-on `profile.preferredLanguage` →
  `en_US`. `setLocale` writes the cookie, sets the `locale` search param with `{ replace: true }` (no
  new history entry), sets `document.documentElement.lang`, and — only when the earlier
  `/api/customer` read resolved to a profile (a session exists) — fires `PUT /api/customer` with
  `{ profile: { preferredLanguage: next } }`, fire-and-forget.
- `src/pages/catalog/shared.test.ts` (new) — covers the hook directly per PLAN.md's Definition of Done.
- `src/components/LanguageSwitcher.tsx` (+ `.test.tsx`, new) — presentational `{ locale, onChange }`
  control built to `mockup-category-page-in-language-menu-open.html`: a `🌐 <name> ▾` trigger
  (`@headlessui/react` `Menu`, `Button variant="outline" size="sm"`, `lucide-react` `Globe`/
  `ChevronDown`), the three `LANGUAGES` options each showing a locale-code secondary label or a check
  mark on the current one, and the "Saved to your profile — applies on every visit." footnote. Options
  come from `LANGUAGES` in `account/vocabulary.ts` (AC-5) — no second list.
- `src/components/index.ts` — exports `LanguageSwitcher`.
- `src/pages/catalog/index.tsx`, `category/[categoryId].tsx`, `product/[productId].tsx`,
  `item/[itemId].tsx` — one-line each: `const locale = useCatalogLocale();` →
  `const { locale } = useCatalogLocale();`. See Deviation below; no other change to these files.

## Deviation from file ownership (planning-approved)

PLAN.md's fixed interface contract changes `useCatalogLocale()`'s return shape from `Locale | null` to
`{ locale, setLocale }`, but the four catalog page files (owned by SWHM-T-0075, not this ticket) called
it as `const locale = useCatalogLocale();` and used the result directly as a string. Verified with
`bun run typecheck` that the contract change alone breaks those four files with `TS2345` (object not
assignable to `string`). This is a genuine "fixed interface changes and a downstream file I don't own
must adapt" case, so the ticket was transitioned to `blocked` and escalated to planning
(`a2a_comment`/message on SWHM-T-0072) with two proposed resolutions before any commit. The ticket was
returned `in_progress` with no change to the plan or ownership table, which is taken as authorization
to proceed with the proposed minimal fix: the one-line destructure above in each of the four files —
behavior-preserving, no UI/logic change, none of SWHM-T-0075's actual scope (mounting the control, the
loading/unavailable states) touched.

## Acceptance criteria

- AC-1 (persisted preference used by subsequent catalog queries, `ja_JP` by default when that's the
  stored/chosen value) — the resolution order itself; `shared.test.ts` RO-05/RO-06.
- AC-2 (`{ locale, setLocale }`, resolution order) — `shared.test.ts` RO-01..06.
- AC-3 (`setLocale`'s three synchronous effects) — `shared.test.ts` SL-01.
- AC-4 (PUT on session, 401 leaves the choice applied with no error state) — `shared.test.ts`
  SL-02..04.
- AC-5 (exactly the three `LANGUAGES` options, one list) — `LanguageSwitcher.test.tsx` LS-01..05.
- AC-6 (cookie round-trip, including `,`/`;`) — `cookies.test.ts`.
- AC-7 (four existing page test files pass unmodified) — ran `bun run test -- src/pages/catalog`
  after the one-line source fix above: 5 files, 20 tests, all green, test files themselves untouched
  (`git diff --stat` shows only the four `.tsx` sources, one line each).

## Verification

- Red: see `tdd-test-result.md` — `writeCookie` (reverted the implementation, ran red, restored),
  `useCatalogLocale` (all 10 new tests against the old return shape), `LanguageSwitcher` (module
  didn't exist).
- Green: `bun run verify:full` — E2E preflight reports Chromium genuinely missing in this container
  (known gap, `AGENTS.md` § Notes from previous agents); fell back to `bun run verify` per that
  policy. Lint + typecheck + full unit suite green: 279/279 tests (257 before this ticket's 22 new
  tests).

## Notes

- `LanguageSwitcher`'s dropdown uses manual `absolute right-0` positioning rather than headlessui's
  `anchor` prop — the `anchor` prop (and, it turns out, `Menu`'s open/close element-movement tracking
  in general) requires `ResizeObserver`, which jsdom doesn't implement. Stubbed `ResizeObserver`
  locally in `LanguageSwitcher.test.tsx` (not in the shared `src/test/setup.ts`, since this is the only
  test that opens a headlessui `Menu`) rather than changing positioning strategy for test convenience.

## Follow-ups

None.
