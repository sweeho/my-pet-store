---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0024
branch: vortex/feat/SWHM-T-0024-integration-testing-f170bc06
upstream: [artifacts/SWHM-S-0002/SWHM-T-0024/PLAN.md]
---

# TDD result — SWHM-T-0024

## Test cases

| Test                                                                                                                   | Covers (task / AC)       | Intent                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `routes/api/signon/flows.test.ts › FT-01`                                                                              | 10.1, 10.4               | create-user then sign-in with the same credentials succeeds end to end, session reflects the username      |
| `routes/api/signon/flows.test.ts › FT-02`                                                                              | 10.2 (boundary accept)   | a 25-char username is accepted for creation and authenticates                                              |
| `routes/api/signon/flows.test.ts › FT-03`                                                                              | 10.2 (boundary reject)   | a 26-char username is rejected for creation and never authenticates                                        |
| `routes/api/signon/flows.test.ts › FT-04`                                                                              | 10.3                     | a username with `%` is rejected for creation and never authenticates                                       |
| `routes/api/signon/flows.test.ts › FT-05`                                                                              | 10.5                     | a wrong password fails sign-in; the session it created stays unsigned-on                                   |
| `routes/api/signon/flows.test.ts › FT-06`                                                                              | 10.6                     | a never-created username fails sign-in; its session stays unsigned-on                                      |
| `e2e/signon.spec.ts › remembers the username after a sign-in with the checkbox checked`                                | 10.7 / AC-8              | register, sign in with "Remember" checked, reload `/signon`, username field is pre-filled from `bp_signon` |
| `e2e/signon.spec.ts › redirects an unauthenticated visit to /customer to /signon, then returns there after signing in` | 10.8, 10.9 / AC-9, AC-10 | an unauthenticated `/customer` visit lands on `/signon`; signing in from there returns to `/customer`      |

## Red run

Genuinely unobtainable, and said so rather than fabricated: every endpoint and page this suite
exercises was built and proved individually by an already-DONE ticket in this sprint
(SWHM-T-0015 through SWHM-T-0023). This ticket's job is to prove the capability _as a whole_ —
there is no prior state in which the cross-endpoint flows or the browser journeys were
expected to fail, so writing the tests produces a pass on the first run, not a red one.

To confirm the tests are real assertions and not vacuously true, `routes/api/signon/flows.test.ts`
FT-01 was temporarily mutated (`created: true` → `created: false` in the expectation) and
re-run before being reverted:

```
$ bun --bun vitest run routes/api/signon/flows.test.ts   # with the mutated expectation
FAIL  |server| routes/api/signon/flows.test.ts > ... > FT-01
AssertionError: expected { created: true, … } to deeply equal { created: false, … }
Tests  1 failed | 5 passed (6)
```

The mutation was reverted immediately after; the committed file has the correct expectation.

## Green run

`bun run verify` — this stack's full pre-commit gate (lint + typecheck + complete test suite):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  21 passed (21)
      Tests  74 passed (74)
```

`bun run test:e2e -- e2e/signon.spec.ts` could not run in this container: Chromium is not
installed (`scripts/ensure-playwright-browser.mjs` fails fast with the same message every
prior ticket in this sprint hit, and says to fall back to `verify` here and let CI run the E2E
tier). Not retried, no browser installed, per PLAN.md step 4 and the no-retry/no-install
guidance. CI runs the full `verify:full` gate including this spec — its pass/fail is recorded
in the ticket's CI check before DONE.

TDD-RESULT: 74 passed, 0 failed
