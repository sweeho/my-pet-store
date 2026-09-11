---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0015
branch: vortex/feat/SWHM-T-0015-user-entity-f2062ba9
upstream: [artifacts/SWHM-S-0002/SWHM-T-0015/PLAN.md]
---

# TDD result — SWHM-T-0015

## Test cases

| Test                        | Covers | Intent                                                                                        |
| --------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `auth/user.test.ts › UT-01` | AC-1   | a user inserted with valid credentials is found by `findUser` keyed on `userName`             |
| `auth/user.test.ts › UT-02` | AC-1   | `matchPassword` is true for the exact password                                                |
| `auth/user.test.ts › UT-03` | AC-1   | `matchPassword` is false for a different-cased password (S3: comparison stays case-sensitive) |
| `auth/user.test.ts › UT-04` | AC-1   | the stored `password` column is not the plaintext (S3: scrypt hash, not `String.equals`)      |

## Red run

`NODE_ENV=test bun --bun vitest run auth/user.test.ts` — `auth/user.ts` did not exist yet:

```
FAIL  |server| auth/user.test.ts [ auth/user.test.ts ]
Error: Cannot find module './user' imported from /workspace/repo/auth/user.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

## Green run

`bun run verify` (this stack's full gate — `eslint` + `tsc --build` + `NODE_ENV=test bun --bun vitest run`, per `test-automation` §1/§9):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
 Test Files  8 passed (8)
      Tests  24 passed (24)
```

All 8 test files (including the 4 new `auth/user.test.ts` cases) pass; zero new failures against baseline.

TDD-RESULT: 24 passed, 0 failed
