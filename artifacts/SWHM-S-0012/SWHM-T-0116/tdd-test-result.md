---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0116
branch: vortex/feat/SWHM-T-0116-session-invalidation-and-logout-ed782a0c
upstream: [artifacts/SWHM-S-0012/SWHM-T-0116/PLAN.md]
---

# TDD result — SWHM-T-0116

## Test cases

| Test                                            | Covers | Intent                                                                                         |
| ----------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `auth/session.test.ts › ST-06`                  | AC-2   | `invalidateSession` deletes the session row                                                    |
| `auth/session.test.ts › ST-07`                  | AC-2   | the `bp_session` cookie is cleared with the same attributes `createSession` set                |
| `auth/session.test.ts › ST-08`                  | AC-2   | invalidating the same session id twice does not throw (idempotent)                             |
| `routes/api/signon/logout.post.test.ts › LO-01` | AC-2   | a signed-on session is ended; the same cookie afterwards yields a new session, not the old one |
| `routes/api/signon/logout.post.test.ts › LO-02` | AC-2   | no session cookie → `{ signedOut: true }`, no error                                            |
| `routes/api/signon/logout.post.test.ts › LO-03` | AC-2   | a cookie naming a gone row → `{ signedOut: true }`, no error                                   |

AC-1 (the JNLP/Java-Web-Start scenario) is out of scope per PLAN.md's Definition of Done — no JVM,
no second deployable (design.md S2). Its replacement observable outcome ("Launch Rich Client"
navigates to `/admin/orders` in-SPA) was already implemented and tested by SWHM-T-0115
(`src/pages/admin/index.test.tsx › "navigates to /admin/orders..."`) and is unchanged by this
ticket — see `summary.md` § Notes.

## Red run

`bun --bun vitest run auth/session.test.ts` with `invalidateSession` reverted (stashed):

```
FAIL |server| auth/session.test.ts > auth/session > ST-06/ST-07/ST-08
TypeError: invalidateSession is not a function.
Test Files  1 failed (1)
     Tests  3 failed | 5 passed (8)
```

`bun --bun vitest run routes/api/signon/logout.post.test.ts` before `logout.post.ts` existed:

```
FAIL |server| routes/api/signon/logout.post.test.ts [ routes/api/signon/logout.post.test.ts ]
Error: Cannot find module './logout.post' imported from .../logout.post.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

## Green run

`bun run verify` (lint + typecheck + full unit suite — the project's declared `verify` gate):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(no errors)
$ tsc --build
(no errors)
$ NODE_ENV=test bun --bun vitest run
 Test Files  62 passed (62)
      Tests  358 passed (358)
```

`bun run test:e2e` (part of `verify:full`) fails only at the Chromium preflight —
`scripts/ensure-playwright-browser.mjs` reports Chromium is genuinely not installed in this
implementation container (AGENTS.md § Notes from previous agents: known gap). Not retried; the
browser tier runs in CI and at INTEGRATION_QA.

TDD-RESULT: 358 passed, 0 failed
