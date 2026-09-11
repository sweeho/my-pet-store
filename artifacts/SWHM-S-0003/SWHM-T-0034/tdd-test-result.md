---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0003
ticket: SWHM-T-0034
branch: vortex/feat/SWHM-T-0034-account-data-model-and-duplicate-account-41c69b85
upstream: [artifacts/SWHM-S-0003/SWHM-T-0034/PLAN.md]
---

# TDD result — SWHM-T-0034

## Test cases

| Test                                          | Covers     | Intent                                                                                            |
| --------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `account/customer.test.ts › CU-01`            | AC-1       | `createCustomer` writes an account row (status `active`) and a profile row                        |
| `account/customer.test.ts › CU-02`            | AC-2       | new profile has the spec's defaults                                                               |
| `account/customer.test.ts › CU-03`            | —          | `getAccountOrDefaults` returns defaults for an unknown user                                       |
| `account/customer.test.ts › CU-04`            | —          | `findAccount` returns `undefined` for an unknown user                                             |
| `account/customer.test.ts › CU-05`            | AC-3       | `updateAccount` round-trips contact info and address (one address row)                            |
| `account/customer.test.ts › CU-06`            | —          | `updateAccount` round-trips profile preferences                                                   |
| `account/customer.test.ts › CU-07`            | AC-4, AC-5 | card number reduced to `lastFour`; type + expiry stored verbatim                                  |
| `account/customer.test.ts › CU-08`            | AC-4       | a stored expiry parses back through `account/card`                                                |
| `account/card.test.ts › CT-01`..`CT-09`       | AC-4       | `expiryMonth`/`expiryYear` parsing incl. malformed/null/empty fallbacks; `lastFour`               |
| `account/validation.test.ts › VA-01`..`VA-08` | —          | `validateAccountUpdate` rejects out-of-vocabulary language/category/card type, accepts valid ones |
| `auth/validation.test.ts › VT-07`             | AC-6       | a taken user name throws `CreateUserError` naming the user name                                   |
| `auth/user.test.ts › UT-05`                   | AC-1       | registering a new user leaves account + profile rows with defaults                                |
| `auth/user.test.ts › UT-06`                   | AC-6       | a duplicate registration throws and adds no `auth_users` row                                      |

AC-7 (migration committed) and AC-8 (tests run in the `server` project) are verified structurally — `drizzle/0003_quick_clea.sql` + `drizzle/meta/*` are committed, and every file above is collected under vitest's `|server|` project (see the green run below).

## Red run

Before any implementation file existed:

```
$ bun run test
 ❯ |server| account/customer.test.ts (0 test)
 ❯ |server| auth/validation.test.ts (7 tests | 1 failed)
     × VT-07: a user name that is already registered throws naming the user name
 ❯ |server| auth/user.test.ts (0 test)
 ❯ |server| account/validation.test.ts (0 test)
 ❯ |server| account/card.test.ts (0 test)

FAIL  |server| account/validation.test.ts — Cannot find module './validation'
FAIL  |server| account/customer.test.ts — Cannot find module './customer'
FAIL  |server| account/card.test.ts — Cannot find module './card'
FAIL  |server| auth/user.test.ts — Cannot find module '../account/customer'

 Test Files  5 failed | 19 passed (24)
      Tests  1 failed | 70 passed (71)
```

## Green run

`bun run verify` — this stack's full pre-commit gate (lint + typecheck + complete test suite).
`verify:full` also ran; its E2E tier cannot launch Chromium in this container (not installed),
per `scripts/ensure-playwright-browser.mjs`'s own guidance to fall back to `verify` here, since
E2E runs in the QA phase / CI instead:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  24 passed (24)
      Tests  102 passed (102)
```

TDD-RESULT: 102 passed, 0 failed
