---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0013
ticket: SWHM-T-0141
branch: vortex/feat/SWHM-T-0141-cart-session-lifecycle-and-clear-on-logo-ea5f81e9
upstream: [artifacts/SWHM-S-0013/SWHM-T-0141/PLAN.md]
---

# TDD result — SWHM-T-0141

## Test cases

| Test                                                                                                                                                                             | Covers       | Intent                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------- |
| `auth/session.test.ts › ST-09: invalidateSession deletes the session's cart_items rows explicitly, not via a cascade`                                                            | AC-3         | the explicit delete this ticket adds                                       |
| `auth/session.test.ts › ST-10: invalidating a session with cart items twice does not throw, and the cart rows stay gone`                                                         | AC-6         | idempotency with cart rows present                                         |
| `auth/session.test.ts › ST-11: invalidateSession does not touch another session's cart rows`                                                                                     | AC-3 (scope) | the delete is scoped to the invalidated session only                       |
| `auth/session.test.ts › ST-12: two reads carrying the same session cookie see the same cart rows; a different cookie does not`                                                   | AC-1, AC-2   | persistence-across-navigation, verified rather than built (PLAN.md step 3) |
| `routes/api/signon/logout.post.test.ts › LO-04: a cart built up before logout does not survive it — no orphaned cart_items row, and the old cookie sees an empty cart afterward` | AC-4, AC-5   | end-to-end: db has no orphaned row, and a subsequent read is empty         |

## Red run

`auth/session.ts` before the `clearCart` call was added to `invalidateSession` (ST-09/ST-10 added
first, against the pre-existing `invalidateSession`):

```
$ bun --bun vitest run auth/session.test.ts
FAIL  |server| auth/session.test.ts > auth/session > ST-09
AssertionError: expected [ { itemid: 'session-test-item', ... } ] to deeply equal []
FAIL  |server| auth/session.test.ts > auth/session > ST-10
AssertionError: expected [ { itemid: 'session-test-item-2', ... } ] to deeply equal []
 Test Files  1 failed (1)
      Tests  2 failed | 9 passed (11)
```

To pin the fix precisely, the `clearCart(session.id)` line was then reverted a second time (after
first landing it) and both `auth/session.test.ts` and the new `routes/api/signon/logout.post.test.ts`
LO-04 were re-run together against that reverted code:

```
$ bun --bun vitest run routes/api/signon/logout.post.test.ts auth/session.test.ts
FAIL  |server| auth/session.test.ts > auth/session > ST-10
AssertionError: expected [ { itemid: 'session-test-item-2', ... } ] to deeply equal []
FAIL  |server| routes/api/signon/logout.post.test.ts > POST /api/signon/logout > LO-04
AssertionError: expected [ { itemid: 'logout-test-item', ... } ] to deeply equal []
 Test Files  2 failed (2)
      Tests  3 failed | 12 passed (15)
```

`ST-11` and `ST-12` are verification tests for behaviour that already existed (session-row deletion
scoping and cross-request cart persistence via `useSignOnSession`) — per PLAN.md step 3, this
ticket verifies persistence rather than building it, so both passed immediately with no code
change; there is no red phase for them.

## Green run

`clearCart(session.id)` restored as the first line of `invalidateSession`:

```
$ bun --bun vitest run routes/api/signon/logout.post.test.ts auth/session.test.ts
 Test Files  2 passed (2)
      Tests  15 passed (15)
```

Then `bun run verify:full` — this stack's full pre-commit gate plus the browser tier:

```
$ bun run verify && bun run test:e2e
$ bun run lint && bun run typecheck && bun run test
 Test Files  83 passed (83)
      Tests  497 passed (497)

$ node scripts/ensure-playwright-browser.mjs
[test:e2e] Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome).
error: script "pretest:e2e" exited with code 1
```

Chromium is genuinely not installed in this container (`AGENTS.md` § Notes from previous agents,
"Implementation containers do not ship a Chromium"). This ticket adds no `e2e/` spec and no
user-visible surface. Fell back to `bun run verify` alone, which is fully green:

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  83 passed (83)
      Tests  497 passed (497)
```

497 = the pre-existing suite (SWHM-T-0134 through SWHM-T-0140 landed on this branch before it
forked) plus the 5 new tests listed above.

TDD-RESULT: 497 passed, 0 failed
