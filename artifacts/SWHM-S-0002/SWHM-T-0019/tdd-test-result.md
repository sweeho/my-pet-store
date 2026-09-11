---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0019
branch: vortex/feat/SWHM-T-0019-signon-filter-3323b5ed
upstream: [artifacts/SWHM-S-0002/SWHM-T-0019/PLAN.md]
---

# TDD result — SWHM-T-0019

## Test cases

| Test                                          | Covers                     | Intent                                                                                                     |
| --------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `auth/signon-filter.test.ts › SF-01`          | AC-1, AC-3                 | a protected resource is denied for an unsigned-on session (`{ allowed: false, redirectTo: SIGN_ON_PAGE }`) |
| `auth/signon-filter.test.ts › SF-02`          | AC-2                       | a protected resource is allowed for a signed-on session                                                    |
| `auth/signon-filter.test.ts › SF-03`          | AC-3                       | an unprotected resource is allowed regardless of session state                                             |
| `routes/api/signon/check.get.test.ts › CH-01` | AC-1                       | denies an unsigned-on request for `/customer`, stores `original_url`, redirects to `/signon`               |
| `routes/api/signon/check.get.test.ts › CH-02` | AC-2                       | a signed-on request passes through with no redirect and no `original_url` rewrite                          |
| `routes/api/signon/check.get.test.ts › CH-03` | AC-3                       | an unprotected resource is allowed for an unsigned-on request                                              |
| `routes/api/signon/check.get.test.ts › CH-04` | AC-1 (open-redirect guard) | a `resource` that is not a same-origin path is rejected and never stored as `original_url`                 |

## Red run

`NODE_ENV=test bun --bun vitest run auth/signon-filter.test.ts routes/api/signon/check.get.test.ts` — neither module existed yet:

```
FAIL  |server| auth/signon-filter.test.ts [ auth/signon-filter.test.ts ]
Error: Cannot find module './signon-filter' imported from /workspace/repo/auth/signon-filter.test.ts

FAIL  |server| routes/api/signon/check.get.test.ts [ routes/api/signon/check.get.test.ts ]
Error: Cannot find module './check.get' imported from /workspace/repo/routes/api/signon/check.get.test.ts

Test Files  2 failed (2)
     Tests  no tests
```

## Green run

`bun run verify` (this stack's full gate — `eslint` + `tsc --build` + `NODE_ENV=test bun --bun vitest run`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
 Test Files  14 passed (14)
      Tests  48 passed (48)
```

All 14 test files (including the 7 new cases across `auth/signon-filter.test.ts` and `routes/api/signon/check.get.test.ts`) pass; zero new failures against baseline.

TDD-RESULT: 48 passed, 0 failed
