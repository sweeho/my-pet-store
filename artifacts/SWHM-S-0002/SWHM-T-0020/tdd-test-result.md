---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0020
branch: vortex/feat/SWHM-T-0020-cookie-persistence-cb5c0c96
upstream: [artifacts/SWHM-S-0002/SWHM-T-0020/PLAN.md]
---

# TDD result — SWHM-T-0020

## Test cases

| Test                                                                       | Covers | Intent                                                                 |
| -------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| `auth/remember-cookie.test.ts › RC-01`                                     | AC-1   | `rememberUsername` sets `bp_signon` to the username, `Max-Age=2678400` |
| `auth/remember-cookie.test.ts › RC-02`                                     | AC-2   | `forgetUsername` clears `bp_signon` via `Max-Age=0`                    |
| `src/utils/cookies.test.ts › reads a present cookie`                       | —      | `readCookie` returns a present cookie's value                          |
| `src/utils/cookies.test.ts › returns undefined for a missing cookie`       | —      | `readCookie` returns `undefined` when absent                           |
| `src/utils/cookies.test.ts › decodes a URI-encoded value`                  | —      | `readCookie` decodes the stored value                                  |
| `src/utils/cookies.test.ts › does not mistake a similarly-prefixed cookie` | —      | `readCookie` matches the exact name, not a prefix                      |

## Red run

Module-not-found before each implementation file existed:

`bun --bun vitest run auth/remember-cookie.test.ts`

```
FAIL  |server| auth/remember-cookie.test.ts [ auth/remember-cookie.test.ts ]
Error: Cannot find module './remember-cookie' imported from /workspace/repo/auth/remember-cookie.test.ts
Test Files  1 failed (1)
```

`bun --bun vitest run src/utils/cookies.test.ts`

```
Failed to resolve import "./cookies" from "src/utils/cookies.test.ts". Does the file exist?
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

 Test Files  16 passed (16)
      Tests  54 passed (54)
```

TDD-RESULT: 54 passed, 0 failed
