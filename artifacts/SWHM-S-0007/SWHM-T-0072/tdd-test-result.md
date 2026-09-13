---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0007
ticket: SWHM-T-0072
branch: vortex/feat/SWHM-T-0072-locale-support-resolve-the-active-locale-71e2bfaa
upstream: [artifacts/SWHM-S-0007/SWHM-T-0072/PLAN.md]
---

# TDD result — SWHM-T-0072

## Test cases

| Test                                                   | Covers     | Intent                                                                                                                                                                                                                                |
| ------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/cookies.test.ts › writeCookie` (3 new)      | AC-6       | a value round-trips through `readCookie` unchanged, including a comma or semicolon; `Path=/` is set                                                                                                                                   |
| `src/pages/catalog/shared.test.ts › RO-01..06`         | AC-2       | resolution order: null until resolved; param wins synchronously; cookie wins synchronously (no param); param beats cookie; falls back to signed-on profile; falls back to `en_US` with no session                                     |
| `src/pages/catalog/shared.test.ts › SL-01..04`         | AC-3, AC-4 | `setLocale` writes the cookie, sets the search param, sets `document.documentElement.lang`; never PUTs with no session; PUTs `{ profile: { preferredLanguage } }` with a session; a 401 from the PUT leaves the chosen locale applied |
| `src/components/LanguageSwitcher.test.tsx › LS-01..05` | AC-5       | trigger names the current language; exactly the three `LANGUAGES` options render; the current option is marked; choosing an option calls `onChange`; the profile footnote renders                                                     |

AC-1 (ja_JP-by-default persistence) and AC-7 (the four existing page tests keep passing unmodified)
are covered by the resolution-order tests above plus running the four pre-existing catalog page test
files unmodified — see `summary.md` for the compatibility-fix deviation this required.

## Red run

`writeCookie` (temporarily reverted `src/utils/cookies.ts`, ran the new tests, then restored the
implementation — confirmed via `git diff` that the restore was byte-identical to the working version):

```
$ bun run test -- src/utils/cookies.test.ts
 FAIL  writeCookie > stores a value that readCookie then returns unchanged (AC-6)
 FAIL  writeCookie > round-trips a value containing a comma or a semicolon (AC-6)
 FAIL  writeCookie > sets Path=/ so the cookie is readable from any route
TypeError: writeCookie is not a function.

 Test Files  1 failed (1)
      Tests  3 failed | 4 passed (7)
```

`useCatalogLocale` (written against the old `Locale | null` return shape, run before the hook changed):

```
$ bun run test -- src/pages/catalog/shared.test.ts
 FAIL (all 10)
ReferenceError: useSearchParams is not defined / TypeError: null is not an object (evaluating 'result.current.locale')

 Test Files  1 failed (1)
      Tests  10 failed (10)
```

`LanguageSwitcher` (module did not exist yet):

```
$ bun run test -- src/components/LanguageSwitcher.test.tsx
Cannot resolve "./LanguageSwitcher" — no tests ran

 Test Files  1 failed (1)
      Tests  no tests
```

## Green run

`bun run verify:full` — the E2E preflight reports Chromium genuinely missing in this container
(`ensure-playwright-browser.mjs`: "Playwright's Chromium browser is not installed"), the documented
gap for implementation containers (`AGENTS.md` § Notes from previous agents). Falling back to
`bun run verify` (lint + typecheck + full unit suite) per that policy.

`bun run verify`:

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  54 passed (54)
      Tests  279 passed (279)
```

The three new/changed test files in isolation (22 of the 279):

```
$ bun run test -- src/utils/cookies.test.ts src/pages/catalog/shared.test.ts src/components/LanguageSwitcher.test.tsx
 Test Files  3 passed (3)
      Tests  22 passed (22)
```

The four pre-existing catalog page test files, unmodified, still passing after the interface change:

```
$ bun run test -- src/pages/catalog
 Test Files  5 passed (5)
      Tests  20 passed (20)
```

TDD-RESULT: 279 passed, 0 failed
