---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0019
branch: vortex/feat/SWHM-T-0019-signon-filter-3323b5ed
upstream: [artifacts/SWHM-S-0002/SWHM-T-0019/PLAN.md]
downstream: [artifacts/SWHM-S-0002/qa-test-report.md]
---

# Summary — SWHM-T-0019: SignOn filter

## What changed

Added the capability's access decision as one pure function, `evaluateAccess`, and enforced it at both server-side entry points: `middleware/signon.ts` for direct server requests, and `GET /api/signon/check` for the client-side route guard `RequireSignOn.tsx` (SWHM-T-0023) will call.

## Files

- `auth/protected-resources.ts` — NEW. `SIGN_ON_PAGE`/`SIGN_ON_ERROR_PAGE`/`SIGN_ON_WELCOME_PAGE`, the four-entry `PROTECTED_RESOURCES` table, and `isProtectedResource(path)` (matches on path only, ignoring query string and trailing slash).
- `auth/signon-filter.ts` — NEW. `evaluateAccess(session, requestedPath)`: pure, no I/O; allowed when unprotected or `session.j_signon`, else `{ allowed: false, redirectTo: SIGN_ON_PAGE }`.
- `auth/signon-filter.test.ts` — NEW. Decision-table cover (protected+unsigned, protected+signed-on, unprotected+unsigned).
- `middleware/signon.ts` — NEW. Resolves the session, evaluates, and on denial stores `ORIGINAL_URL` and short-circuits with a 302 via `sendRedirect` (a single-arg H3 middleware handler returning a defined value stops the chain — see the file's comment). `middleware/auth.ts` is untouched.
- `routes/api/signon/check.get.ts` — NEW. `GET /api/signon/check?resource=<path>`; rejects a `resource` that isn't a same-origin path (`/` and not `//`) before it can be stored, otherwise evaluates and stores `ORIGINAL_URL` on denial.
- `routes/api/signon/check.get.test.ts` — NEW. Route cover for all four cases, including the open-redirect guard.

## AC coverage

- AC-1 ("Unauthenticated user is redirected to sign-on page" — stores `customer.screen`/`/customer` in `ORIGINAL_URL`, forwards to sign-on) — `middleware/signon.ts` and `check.get.ts`, both built on `evaluateAccess`; covered by `signon-filter.test.ts › SF-01` and `check.get.test.ts › CH-01`.
- AC-2 ("Authenticated user accesses protected resource without redirection") — the `session.j_signon` branch in `evaluateAccess`; covered by `SF-02` and `CH-02`.
- AC-3 ("Protected resource requires authentication") — the `PROTECTED_RESOURCES` configuration in `auth/protected-resources.ts` applied through `evaluateAccess`; covered by `SF-01`/`SF-03` and `CH-01`/`CH-03`.

## Verification

```
$ NODE_ENV=test bun --bun vitest run auth/signon-filter.test.ts routes/api/signon/check.get.test.ts   # red
Cannot find module './signon-filter' / './check.get'

$ bun run verify                                                                                        # green, full gate
eslint ✓  tsc --build ✓
Test Files  14 passed (14)
     Tests  48 passed (48)
```

See `tdd-test-result.md` — `TDD-RESULT: 48 passed, 0 failed`.

## Notes

`middleware/signon.ts` has no dedicated test file, matching `PLAN.md`'s file/module ownership table (only `auth/signon-filter.test.ts` and `routes/api/signon/check.get.test.ts` are listed) — it is a thin orchestration of `evaluateAccess`, `useSignOnSession` and `setOriginalUrl`, each already covered directly, per S6's "one pure decision function, consumed in two places".
`sendRedirect(event, location, code)` requires the status code argument under this h3 version's types (`(event, location, code): HTTPResponse`, not optional); passed `302` explicitly.
