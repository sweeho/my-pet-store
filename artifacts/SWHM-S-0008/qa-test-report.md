---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHM-S-0008
branch: vortex/sprint/swhm-s-0008-6b835023
upstream: [artifacts/SWHM-S-0008/SPRINT-PLAN.md]
---

# QA test report — SWHM-S-0008

## Executive Summary

**Verdict: PASS.** All five committed tickets (SWHM-T-0080 through SWHM-T-0084) hold on the
integrated sprint branch. Verified the sprint goal "Bugfix found by Inspector" against every
scenario in the change's three delta specs (`catalog-browsing`, `internationalization`,
`application-foundation`) — 11 of 11 scenarios pass. Ran the full unit suite (302 tests) and the
full Playwright E2E suite (20 tests) against the built, integrated branch; both are green. One
defect (DEFECT-1, minor) was found during AC verification — a residual placeholder `href="#"` on
the landing-page logo links, outside the scope any of the five tickets actually claimed — and was
fixed in place; see `integration-defects-resolution.md`.

## E2E Test Status

`bun run test:e2e -- --project=chromium` (single Playwright project; `--list` confirmed all 20
tests / 7 spec files run under it) → **20 passed, 0 failed, 0 skipped**, re-run after DEFECT-1's
fix. Full per-spec table, the environment note on the container's Chromium/Playwright version
mismatch, and three additional ad-hoc real-browser probes run during AC verification are in
`integration-test-result.md`.

## Unit Test Results

```
$ bun run test
$ NODE_ENV=test bun --bun vitest run

 Test Files  55 passed (55)
      Tests  302 passed (302)
   Duration  4.52s
```

Same command also gates `bun run verify` (lint + typecheck + test), which passed clean:
`eslint` reported no violations, `tsc --build` reported no errors.

## Code Review

Read every file each ticket touched (`git log`, five ticket PRs) against `design.md`'s stated
root causes and decisions. No notable concerns beyond DEFECT-1 below:

- `StoreMark.tsx` is `aria-hidden`, inherits `currentColor`, matches D-1.
- `UnavailableInLanguage`'s `onChangeLocale`/`LanguageSwitcher`'s `label` are both optional exactly
  as D-5 specifies, and the four pre-existing isolated-render tests (`UL-01`–`UL-04`) still compile
  and pass unmodified.
- The `<img>` fallback in `catalog/item/[itemId].tsx` guards against a placeholder-load loop
  (`if (img.src.endsWith(...)) return;`) exactly as D-4 requires, and `catalog/item.ts`,
  `catalog/search.ts` and their route tests are byte-identical (`imageLocation` contract untouched).
- `routes/api/users/**`, `db/schema.ts`'s `users` table, and `e2e/smoke.spec.ts` are byte-identical
  after SWHM-T-0082's page deletions, confirmed by `e2e/legacy-routes.spec.ts`'s passing
  `GET /api/users still answers with rows from the database` case.

## Coverage Summary

No coverage tool is declared in this project (`package.json` has no `coverage` script; `verify`/
`verify:full` do not run one). Verified by inspection: `bun run test` reports 55 test files / 302
tests passing, up from the pre-sprint baseline reachable via `git log` (each ticket added tests
alongside its fix — e.g. `UL-05` for SWHM-T-0084, `PT-08` for SWHM-T-0083). No regression in test
count or pass rate was observed.

## Issues Found

- **DEFECT-1** (minor) — landing-page logo links (`src/pages/index.tsx`, header and mobile panel)
  still carried the Tailwind Plus template's `href="#"`, violating the `application-foundation`
  scenario "No control leads nowhere". Neither SWHM-T-0080 nor SWHM-T-0081 claimed this element —
  `design.md` § RC-1/D-2 never names it, and `src/pages/index.test.tsx` explicitly carved it out of
  its placeholder-fragment check. Fixed in place: both logo anchors now use `react-router`'s `Link`
  to `/`, matching every other in-app control in the file. Full record, fix round and re-run
  evidence: `integration-defects-resolution.md` DEFECT-1. No future-sprint DEFECT ticket was
  needed — resolved within the 3-round budget on the first round.

## Recommendation

**Proceed.** Every acceptance criterion and every delta-spec scenario for SWHM-S-0008 passes on
the integrated sprint branch; the one defect found was fixed in place and re-verified. Firing
`validation.all_acs_passed`.

### Scenario verdicts (spec-driven — `openspec/changes/swhm-s-0008-bugfix-found-by-inspector/`)

#### `catalog-browsing` — Requirement: Item image association

SCENARIO-VERDICT: Item image association / Item image location is retrieved — pass (`catalog/item.test.ts` asserts `imageLocation` unchanged and passed through, e.g. line 76; contract untouched by SWHM-T-0083 per D-4)
SCENARIO-VERDICT: Item image association / Item detail screen shows a placeholder when the image is unavailable — pass (unit: `PT-08` in `src/pages/catalog/item/[itemId].test.tsx`, no-loop fallback; live browser probe: `bunx playwright test -g "item image 404s"` → seeded path 404s, `<img>` src becomes `/images/placeholder.svg`, `alt` unchanged — see `integration-test-result.md`)

#### `internationalization` — Requirement: Language recovery from an untranslated screen

SCENARIO-VERDICT: Language recovery from an untranslated screen / Language can be changed from the untranslated screen — pass (unit: `UL-04`/`UL-05` in `UnavailableInLanguage.test.tsx`; live browser probe: `bunx playwright test -g "QA probe"` opened the panel's own "Change language" menu with a real click and selected a language — see `integration-test-result.md`)
SCENARIO-VERDICT: Language recovery from an untranslated screen / The control still works after the language has already been changed — pass (unit: `UL-05` performs two full open→select cycles on one render, asserting `onChangeLocale` called twice with the right locales; live browser probe reproduced the exact RC-2 failure shape — open, close, reopen the same button — and it opened both times post-fix)

#### `application-foundation` — Requirement: Product-branded application shell

SCENARIO-VERDICT: Product-branded application shell / Home page names the product — pass (`src/pages/index.test.tsx` asserts the level-1 heading "My Pet Store"; e2e `smoke.spec.ts` + `home.spec.ts` confirm live)
SCENARIO-VERDICT: Product-branded application shell / Browser tab and web app manifest name the product — pass (live probe: document title "My Pet Store", `GET /manifest.webmanifest` → 200, `name: "My Pet Store"`; `package.json` `name: "my-pet-store"` — see `integration-test-result.md`)
SCENARIO-VERDICT: Product-branded application shell / Home page requests no third-party asset — pass (`src/pages/index.test.tsx` "no third-party asset" test inspects every `[src],[href]` in header + opened mobile panel, none contain `tailwindcss.com` or an absolute `http(s)://` URL; `StoreMark` is an inline SVG, no network request)
SCENARIO-VERDICT: Product-branded application shell / Boilerplate example screens are not reachable — pass (e2e `legacy-routes.spec.ts`, all 4 cases: `/users`, `/users/1`, `/users/profile` render not-found; `GET /api/users` still answers from the database)

#### `application-foundation` — Requirement: Application shell navigation

SCENARIO-VERDICT: Application shell navigation / Primary call to action opens the catalogue — pass (`src/pages/index.test.tsx` asserts "Get started" → `/catalog`; e2e `catalog.spec.ts` browses from `/catalog` onward)
SCENARIO-VERDICT: Application shell navigation / Sign-in control opens the sign-on screen — pass (`src/pages/index.test.tsx` asserts both header and mobile-dialog "Log in" → `/signon`; e2e `signon.spec.ts` exercises the sign-on screen itself)
SCENARIO-VERDICT: Application shell navigation / No control leads nowhere — pass after fix (DEFECT-1: both logo `<a href="#">` anchors were a placeholder-fragment violation of this exact scenario, not caught by any of the five tickets since none claimed the logo's `href`; fixed in place to `<Link to="/">`, re-verified live — `LOGO HREF` now `/` for both header and mobile-panel logo links)
