---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0021
branch: vortex/feat/SWHM-T-0021-sign-in-workflow-4f9cfbcb
upstream: [artifacts/SWHM-S-0002/SWHM-T-0021/PLAN.md]
---

# TDD result — SWHM-T-0021

## Test cases

| Test                                           | Covers                  | Intent                                                                                                  |
| ---------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `routes/api/signon/index.post.test.ts › SI-01` | AC-1                    | a signed-in user is redirected to the session's stored `original_url` (`/customer`)                     |
| `routes/api/signon/index.post.test.ts › SI-02` | AC-1                    | a signed-in user with no stored `original_url` is redirected to `/signon-welcome`                       |
| `routes/api/signon/index.post.test.ts › SI-03` | AC-2                    | a wrong password fails sign-in (`signedOn: false`, `/signon-failed`) and leaves the session unsigned-on |
| `routes/api/signon/index.post.test.ts › SI-04` | S7/T-0020 orchestration | the remember checkbox sets `bp_signon` with `Max-Age=2678400`                                           |
| `routes/api/signon/index.post.test.ts › SI-05` | S7/T-0020 orchestration | an unchecked remember box clears `bp_signon` with `Max-Age=0`                                           |

## Red run

`NODE_ENV=test bun --bun vitest run routes/api/signon/index.post.test.ts` — `routes/api/signon/index.post.ts` did not exist yet:

```
FAIL  |server| routes/api/signon/index.post.test.ts [ routes/api/signon/index.post.test.ts ]
Error: Cannot find module './index.post' imported from /workspace/repo/routes/api/signon/index.post.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

## Green run

`bun run verify` (this stack's full gate — `eslint` + `tsc --build` + `NODE_ENV=test bun --bun vitest run`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
 Test Files  17 passed (17)
      Tests  59 passed (59)
```

All 17 test files (including the 5 new `routes/api/signon/index.post.test.ts` cases) pass; zero new failures against baseline.

TDD-RESULT: 59 passed, 0 failed
