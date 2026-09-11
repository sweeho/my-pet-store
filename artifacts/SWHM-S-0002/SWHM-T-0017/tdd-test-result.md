---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0017
branch: vortex/feat/SWHM-T-0017-authentication-service-f9489aed
upstream: [artifacts/SWHM-S-0002/SWHM-T-0017/PLAN.md]
---

# TDD result — SWHM-T-0017

## Test cases

| Test                                | Covers | Intent                                                                             |
| ----------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| `auth/authenticate.test.ts › AT-01` | AC-1   | authentication succeeds with correct credentials → `true`                          |
| `auth/authenticate.test.ts › AT-02` | AC-2   | authentication fails with an incorrect password → `false`                          |
| `auth/authenticate.test.ts › AT-03` | AC-3   | authentication fails for a username that was never created → `false`, not an error |
| `auth/authenticate.test.ts › AT-04` | AC-2   | a correct password in the wrong case fails (case-sensitive match, S3)              |

## Red run

`NODE_ENV=test bun --bun vitest run auth/authenticate.test.ts` — `auth/authenticate.ts` did not exist yet:

```
FAIL  |server| auth/authenticate.test.ts [ auth/authenticate.test.ts ]
Error: Cannot find module './authenticate' imported from /workspace/repo/auth/authenticate.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

## Green run

`bun run verify` (this stack's full gate — `eslint` + `tsc --build` + `NODE_ENV=test bun --bun vitest run`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
 Test Files  10 passed (10)
      Tests  34 passed (34)
```

All 10 test files (including the 4 new `auth/authenticate.test.ts` cases) pass; zero new failures against baseline.

TDD-RESULT: 34 passed, 0 failed
