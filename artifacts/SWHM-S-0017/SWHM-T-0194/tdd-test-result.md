---
ticket: SWHM-T-0194
type: tdd-test-result
---

# TDD test result — SWHM-T-0194

## Test cases

`src/pages/supplier/index.test.tsx` (client project, jsdom), mirroring
`src/pages/admin/index.test.tsx`'s pattern:

| Case                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------ |
| Shows a pending indicator (`role="status"`) for the username while the session read is outstanding, without hiding the heading |
| Renders the heading, description and both controls (Display Inventory, Logout) once the session read resolves                  |
| Navigates to `/supplier/inventory` when Display Inventory is activated                                                         |
| POSTs to `/api/signon/logout` and navigates to `/` when Logout is activated                                                    |

## Red run

Command: `bun --bun vitest run src/pages/supplier/index.test.tsx`

Before `src/pages/supplier/index.tsx` existed:

```
FAIL  |client| src/pages/supplier/index.test.tsx [ src/pages/supplier/index.test.tsx ]
Error: Failed to resolve import "./index" from "src/pages/supplier/index.test.tsx". Does the file exist?

 Test Files  1 failed (1)
      Tests  no tests
```

Confirmed red: the suite fails to collect because the module under test does not exist yet.

## Green run

Command: `bun --bun vitest run src/pages/supplier/index.test.tsx`

```
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

(One intermediate run failed on an ambiguous test assertion — the lede and a
"What this module does" list item both matched the same substring; the
assertion was narrowed to a phrase unique to the lede. That failure was a
test-authoring issue, not a red/green cycle against the production code.)

Full pre-commit gate — `bun run verify` (lint + typecheck + full unit suite):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  108 passed (108)
      Tests  694 passed (694)
```

`bun run verify:full` (adds the E2E tier) was attempted first; its preflight
(`scripts/ensure-playwright-browser.mjs`) reports Chromium is not installed
in this container — the same documented limitation recorded in `AGENTS.md` §
Notes from previous agents. The browser journey through this screen belongs
to SWHM-T-0196. Falling back to `verify` per that note; the browser tier
runs in CI and at INTEGRATION_QA.

TDD-RESULT: 694 passed, 0 failed
