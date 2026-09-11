---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0023
branch: vortex/feat/SWHM-T-0023-user-interfaces-cfcd2f9e
upstream: [artifacts/SWHM-S-0002/SWHM-T-0023/PLAN.md]
---

# TDD result — SWHM-T-0023

## Test cases

| Test                                                                                                         | Covers | Intent                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| `src/pages/signon.test.tsx › renders the sign-in form with username, password, remember checkbox and submit` | AC-1   | the sign-in form exposes a username textbox, a password field, the "Remember My User Name" checkbox and a submit button |
| `src/pages/signon.test.tsx › pre-populates the username field from an existing bp_signon cookie`             | AC-2   | with a `bp_signon=alice` cookie the username field's value is "alice"                                                   |
| `src/pages/signon.test.tsx › defaults the username field to empty without a bp_signon cookie`                | AC-3   | without the cookie the username field is empty                                                                          |
| `src/pages/signon.test.tsx › renders the sign-up form with username, password, password repeat and submit`   | AC-4   | the sign-up form exposes username, password, password-repeat and a submit button                                        |
| `src/pages/signon-failed.test.tsx › renders the failure message verbatim`                                    | AC-5   | `/signon-failed` displays the exact scenario string                                                                     |

## Red run

`NODE_ENV=test bun --bun vitest run src/pages/signon.test.tsx src/pages/signon-failed.test.tsx` — captured by moving `src/pages/signon.tsx`, `src/pages/signon-failed.tsx` and their sibling new page/component files aside before writing them, then running the suite against their absence:

```
FAIL  |client| src/pages/signon.test.tsx [ src/pages/signon.test.tsx ]
Error: Failed to resolve import "./signon" from "src/pages/signon.test.tsx". Does the file exist?

FAIL  |client| src/pages/signon-failed.test.tsx [ src/pages/signon-failed.test.tsx ]
Error: Failed to resolve import "./signon-failed" from "src/pages/signon-failed.test.tsx". Does the file exist?

Test Files  2 failed (2)
     Tests  no tests
```

## Green run

`bun run verify` (this stack's browser-free full gate — `eslint` + `tsc --build` + `NODE_ENV=test bun --bun vitest run`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
 Test Files  20 passed (20)
      Tests  68 passed (68)
```

`bun run verify:full`/`bun run test:e2e` was attempted first per CLAUDE.md's preference, but the E2E preflight (`scripts/ensure-playwright-browser.mjs`) reported Chromium is genuinely not installed in this container and told me to fall back to `bun run verify` rather than install it — no E2E specs are owned by this ticket (`e2e/` is out of ownership), so there is nothing further to write or run here; the browser-level flows across these screens are SWHM-T-0024's per `PLAN.md`.

All 20 test files (including the 5 new cases across `src/pages/signon.test.tsx` and `src/pages/signon-failed.test.tsx`) pass; zero new failures against baseline.

TDD-RESULT: 68 passed, 0 failed
