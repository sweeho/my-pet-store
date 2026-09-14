---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0008
ticket: SWHM-T-0080
branch: vortex/fix/SWHM-T-0080-landing-page-header-mobile-menu-logo-hot-4fa0675d
upstream: [artifacts/SWHM-S-0008/SWHM-T-0080/PLAN.md]
---

# TDD result — SWHM-T-0080

## Test cases

| Test                                                                                                                                 | Covers     | Intent                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/index.test.tsx › Home page › requests no third-party asset and renders a store-branded mark instead of the template logo` | AC-1, AC-2 | header + opened mobile-dialog logo links keep their accessible name and render an inline SVG mark; no element on the page carries a `src`/`href` pointing off-origin (in particular, none reference `tailwindcss.com`) |
| `src/pages/index.test.tsx` — 4 pre-existing tests (hero heading/CTA, highlights, opens/lists nav links in dialog, closes dialog)     | AC-3       | pass unmodified alongside the new assertion                                                                                                                                                                            |

## Red run

`bun run test -- src/pages/index.test.tsx` (before the fix — `<img>` still pointed at
`tailwindcss.com`, no `StoreMark` yet):

```
 ❯ |client| src/pages/index.test.tsx (5 tests | 1 failed) 140ms
     × requests no third-party asset and renders a store-branded mark instead of the template logo 8ms

 FAIL  |client| src/pages/index.test.tsx > Home page > requests no third-party asset and renders a store-branded mark instead of the template logo
Error: expect(received).toBeInTheDocument()
received value must be an HTMLElement or an SVGElement.
Received has type:  Null
Received has value: null
 ❯ src/pages/index.test.tsx:65:49
     65|     expect(headerLogoLink.querySelector("svg")).toBeInTheDocument();

 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
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
      Tests  298 passed (298)
   Duration  4.54s
```

Lint and typecheck reported no errors (both commands exited 0 before the test run; `bun run
verify` runs them in sequence with `&&`). All 55 test files / 298 tests pass, including the 5 in
`src/pages/index.test.tsx` (the 4 pre-existing tests plus the new regression test).

TDD-RESULT: 298 passed, 0 failed
