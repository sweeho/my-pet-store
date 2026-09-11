---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0016
branch: vortex/feat/SWHM-T-0016-user-creation-validation-4dd8786b
upstream: [artifacts/SWHM-S-0002/SWHM-T-0016/PLAN.md]
---

# TDD result — SWHM-T-0016

## Test cases

| Test                              | Covers     | Intent                                      |
| --------------------------------- | ---------- | ------------------------------------------- |
| `auth/validation.test.ts › VT-01` | AC-3       | 25-char username is accepted                |
| `auth/validation.test.ts › VT-02` | AC-1, AC-4 | 26-char username throws exact message       |
| `auth/validation.test.ts › VT-03` | AC-2       | username with `%` throws exact message      |
| `auth/validation.test.ts › VT-04` | AC-2       | username with `*` throws exact message      |
| `auth/validation.test.ts › VT-05` | AC-5       | 33-char password throws exact message       |
| `auth/validation.test.ts › VT-06` | AC-3       | valid username/password pair throws nothing |

## Red run

`bun --bun vitest run auth/validation.test.ts` — module did not exist yet:

```
FAIL  |server| auth/validation.test.ts [ auth/validation.test.ts ]
Error: Cannot find module './validation' imported from /workspace/repo/auth/validation.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

## Green run

`bun run verify` — this stack's full pre-commit gate (lint + typecheck + complete test suite);
`verify:full` also ran but its E2E tier fails to launch Chromium in this container (not
installed) per `scripts/ensure-playwright-browser.mjs`'s own guidance to fall back to `verify`
here, since E2E runs in the QA phase / CI instead:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  9 passed (9)
      Tests  30 passed (30)
```

TDD-RESULT: 30 passed, 0 failed
