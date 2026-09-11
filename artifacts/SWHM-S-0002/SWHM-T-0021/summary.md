---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0021
branch: vortex/feat/SWHM-T-0021-sign-in-workflow-4f9cfbcb
upstream: [artifacts/SWHM-S-0002/SWHM-T-0021/PLAN.md]
downstream: [artifacts/SWHM-S-0002/qa-test-report.md]
---

# Summary — SWHM-T-0021: Sign-in workflow

## What changed

Added `POST /api/signon`, joining the previous five tickets' pieces into the sign-in transaction: `authenticate()` the submitted credentials, `setSignedOn` the session on success, honour the remember-username checkbox every request via `rememberUsername`/`forgetUsername`, and answer with `{ signedOn, redirectTo }`.

## Files

- `routes/api/signon/index.post.ts` — NEW. Reads `j_username`/`j_password`/`j_remember_username` from the body; a missing/non-string credential field is treated as a failed sign-in, never a 500.
- `routes/api/signon/index.post.test.ts` — NEW. Route cover for the success/failure/remember-cookie cases.

## AC coverage

- AC-1 ("User is redirected to original URL after successful sign-in") — `redirectTo` resolves to `session.original_url ?? SIGN_ON_WELCOME_PAGE`; covered by `index.post.test.ts › SI-01` (stored URL) and `› SI-02` (fallback).
- AC-2 ("User is redirected to error page on authentication failure") — a failed `authenticate()` call returns `{ signedOn: false, redirectTo: SIGN_ON_ERROR_PAGE }`; covered by `› SI-03`.

## Verification

```
$ NODE_ENV=test bun --bun vitest run routes/api/signon/index.post.test.ts   # red, before the route existed
Cannot find module './index.post' imported from /workspace/repo/routes/api/signon/index.post.test.ts

$ bun run verify                                                             # green, full gate
eslint ✓  tsc --build ✓
Test Files  17 passed (17)
     Tests  59 passed (59)
```

See `tdd-test-result.md` — `TDD-RESULT: 59 passed, 0 failed`.

## Notes

Minor deviation from `PLAN.md` step 3, recorded there and here: `auth/session.ts`'s `setOriginalUrl(session, url: string)` is a fixed contract (owned by SWHM-T-0018, out of this ticket's ownership) that only accepts a `string` — there is no way to clear `original_url` back to `null` without changing that signature. The "clear it once consumed" behaviour is therefore not implemented; `redirectTo` is still computed correctly for the current request. The gap can only surface on a _redundant_ repeat sign-in on an already-signed-on session (`middleware/signon.ts`/`check.get.ts` never call `setOriginalUrl` while `j_signon` is true), which no scenario in the delta spec exercises, so none of this ticket's tests need it. A follow-up improvement ticket is raised for extending `auth/session.ts` with a way to clear `original_url`.
