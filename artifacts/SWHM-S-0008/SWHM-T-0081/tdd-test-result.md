---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0008
ticket: SWHM-T-0081
branch: vortex/fix/SWHM-T-0081-landing-page-nav-hero-links-are-all-dead-423b8bd1
upstream: [artifacts/SWHM-S-0008/SWHM-T-0081/PLAN.md]
---

# TDD result — SWHM-T-0081

## Test cases

| Test                                                                                                       | Covers     | Intent                                                                                                               |
| ---------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/pages/index.test.tsx › Home page › renders the hero heading and primary CTA that opens the catalogue` | AC-1       | hero "Get started" carries `href="/catalog"`                                                                         |
| `src/pages/index.test.tsx › Home page › points the header Log in control at the sign-on screen`            | AC-2       | header "Log in" carries `href="/signon"`                                                                             |
| `src/pages/index.test.tsx › Home page › opens the mobile nav dialog and lists the nav links inside it`     | AC-2, AC-3 | mobile dialog's "Catalog" (`/catalog`), "My account" (`/customer`) and "Log in" (`/signon`) links target real routes |
| `src/pages/index.test.tsx › Home page › leaves no navigation or hero link as a placeholder fragment`       | AC-3       | no nav/hero link (header or opened mobile dialog), other than the out-of-scope logo link, carries `href="#"`         |
| `src/pages/index.test.tsx` — 3 other pre-existing tests (highlights, closes dialog, no-third-party-asset)  | AC-4       | pass unmodified/adjusted only for the `MemoryRouter` wrapper alongside the new assertions                            |

## Red run

`bun run test -- src/pages/index.test.tsx` (before the fix — `navigation` array and all anchors
still `href="#"`/template copy):

```
 ❯ |client| src/pages/index.test.tsx (7 tests | 4 failed) 261ms
     × renders the hero heading and primary CTA that opens the catalogue 83ms
     × points the header Log in control at the sign-on screen 10ms
     × opens the mobile nav dialog and lists the nav links inside it 51ms
     × leaves no navigation or hero link as a placeholder fragment 30ms

 FAIL  |client| src/pages/index.test.tsx > Home page > renders the hero heading and primary CTA that opens the catalogue
Error: expect(element).toHaveAttribute("href", "/catalog")
Expected the element to have attribute:
  href="/catalog"
Received:
  href="#"

 FAIL  |client| src/pages/index.test.tsx > Home page > points the header Log in control at the sign-on screen
Error: expect(element).toHaveAttribute("href", "/signon")
Expected the element to have attribute:
  href="/signon"
Received:
  href="#"

 FAIL  |client| src/pages/index.test.tsx > Home page > opens the mobile nav dialog and lists the nav links inside it
TestingLibraryElementError: Unable to find an accessible element with the role "link" and name "Catalog"

 Test Files  1 failed (1)
      Tests  4 failed | 3 passed (7)
```

## Green run

`bun run verify:full` was attempted first (this stack's full gate); its `test:e2e` stage fails
its own preflight in this container — `node scripts/ensure-playwright-browser.mjs` reports
Chromium is genuinely not installed (`/ms-playwright/chromium-1155/chrome-linux/chrome` missing).
Per `AGENTS.md` § Test & validate and the prior-agent note "Implementation containers do not ship
a Chromium", the documented fallback is `bun run verify` (lint + typecheck + the complete unit
suite) with the gap stated rather than retried or worked around — E2E runs again in CI and at
INTEGRATION_QA, both browser-equipped.

`bun run verify` (lint + typecheck + complete unit suite, after the fix):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  55 passed (55)
      Tests  301 passed (301)
   Duration  4.97s
```

Lint and typecheck reported no errors (both commands exited 0 before the test run; `bun run
verify` runs them in sequence with `&&`). All 55 test files / 301 tests pass, including the 7 in
`src/pages/index.test.tsx` (3 pre-existing + 4 new/rewritten regression tests above).

TDD-RESULT: 301 passed, 0 failed
