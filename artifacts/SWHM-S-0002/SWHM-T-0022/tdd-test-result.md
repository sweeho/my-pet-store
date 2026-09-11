---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0022
branch: vortex/feat/SWHM-T-0022-account-creation-workflow-e49ed622
upstream: [artifacts/SWHM-S-0002/SWHM-T-0022/PLAN.md]
---

# TDD result — SWHM-T-0022

## Test cases

| Test                                                 | Covers | Intent                                                                            |
| ---------------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| `routes/api/signon/create-user.post.test.ts › CU-01` | AC-1   | valid pair creates the user, signs the session on, redirects to `/signon-welcome` |
| `routes/api/signon/create-user.post.test.ts › CU-02` | AC-2   | 26-char username fails with the exact validator message, creates nothing          |
| `routes/api/signon/create-user.post.test.ts › CU-03` | AC-3   | username with `%` fails with the exact validator message, creates nothing         |
| `routes/api/signon/create-user.post.test.ts › CU-04` | —      | mismatched password confirmation creates nothing                                  |

## Red run

`bun --bun vitest run routes/api/signon/create-user.post.test.ts` — module did not exist yet:

```
FAIL  |server| routes/api/signon/create-user.post.test.ts [ routes/api/signon/create-user.post.test.ts ]
Error: Cannot find module './create-user.post' imported from /workspace/repo/routes/api/signon/create-user.post.test.ts
Test Files  1 failed (1)
```

## Green run

`bun run verify` — this stack's full pre-commit gate (lint + typecheck + complete test suite).
`verify:full` also ran but its E2E tier fails to launch Chromium in this container (not
installed) per `scripts/ensure-playwright-browser.mjs`'s own guidance to fall back to `verify`
here, since E2E runs in the QA phase / CI instead:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  18 passed (18)
      Tests  63 passed (63)
```

TDD-RESULT: 63 passed, 0 failed
