---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0009
ticket: SWHM-T-0097
branch: vortex/fix/SWHM-T-0097-merely-browsing-the-catalog-anonymously-0e97d282
upstream: [artifacts/SWHM-S-0009/SWHM-T-0097/PLAN.md]
---

# TDD result — SWHM-T-0097

## Test cases

| Test                                                                                               | Covers                | Intent                                                                                                  |
| -------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------- |
| `auth/signon-filter.test.ts › SF-04`                                                               | AC-4 (predicate half) | `Sec-Fetch-Mode: navigate` classifies as a navigation                                                   |
| `auth/signon-filter.test.ts › SF-05`                                                               | AC-3                  | `Sec-Fetch-Mode: cors` (background fetch/XHR) is not a navigation                                       |
| `auth/signon-filter.test.ts › SF-06`                                                               | AC-2                  | `Sec-Fetch-Dest: document` classifies as a navigation when `Sec-Fetch-Mode` is absent                   |
| `auth/signon-filter.test.ts › SF-07`                                                               | AC-3                  | `Sec-Fetch-Dest: empty` (background fetch) is not a navigation                                          |
| `auth/signon-filter.test.ts › SF-08`                                                               | AC-2                  | with neither Fetch Metadata header, an `Accept` preferring `text/html` falls back to navigation         |
| `auth/signon-filter.test.ts › SF-09`                                                               | AC-3                  | with neither Fetch Metadata header, a background fetch's default `Accept: */*` is not a navigation      |
| `auth/signon-filter.test.ts › SF-10`                                                               | AC-3                  | with no Fetch Metadata header and no `Accept` header at all, it is not a navigation                     |
| `e2e/signon.spec.ts › browsing the catalog anonymously does not corrupt the post-sign-in redirect` | AC-1                  | anonymous `/catalog` visit (background `/api/customer` fetch), then sign-in, lands on `/signon-welcome` |

`middleware/signon.ts` itself is outside both Vitest projects' include lists (jsdom `client` project
can't resolve `bun:sqlite`; `server` project's include list is `routes/**`, `auth/**`, `account/**`,
`catalog/**` — see AGENTS.md "Notes from previous agents" and design.md D7), so AC-1 and AC-4's
middleware-level behaviour (401 vs. redirect, and the fall-through for a signed-on session) are
proven at the unit level via the predicate above plus the existing, unchanged
`routes/api/signon/check.get.test.ts` (CH-01/CH-02), and end-to-end via the `e2e/signon.spec.ts`
scenario, which runs in CI per design.md's Verification note.

## Red run

`bun --bun vitest run auth/signon-filter.test.ts` — before `isNavigationRequest` existed:

```
FAIL  |server| auth/signon-filter.test.ts > auth/signon-filter isNavigationRequest > SF-07: Sec-Fetch-Dest: empty (a background fetch) is not a navigation
TypeError: isNavigationRequest is not a function. (In 'isNavigationRequest(new Headers({ "sec-fetch-dest": "empty" }))', 'isNavigationRequest' is undefined)
...
 Test Files  1 failed (1)
      Tests  7 failed | 3 passed (10)
```

## Green run

`bun run verify` — lint + typecheck + the complete test suite (this stack's full pre-commit gate;
`verify:full` adds the browser tier on top but Chromium is genuinely absent in this container per
AGENTS.md "Notes from previous agents" / design.md's Verification note — not retried here, observed
in CI on this branch instead):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  55 passed (55)
      Tests  309 passed (309)
```

TDD-RESULT: 309 passed, 0 failed
