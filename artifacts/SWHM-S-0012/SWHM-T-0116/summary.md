---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0012
ticket: SWHM-T-0116
branch: vortex/feat/SWHM-T-0116-session-invalidation-and-logout-ed782a0c
upstream: [artifacts/SWHM-S-0012/SWHM-T-0116/PLAN.md]
downstream: [artifacts/SWHM-S-0012/qa-test-report.md]
---

# Summary — SWHM-T-0116: Session invalidation and logout

## What changed

Added `invalidateSession(event, session)` to `auth/session.ts` — deletes the session row and clears
the `bp_session` cookie with the same attributes `createSession` set. Added `POST
/api/signon/logout` (unprotected, idempotent): resolves the session, invalidates it, returns
`{ signedOut: true }`. No JNLP producer or Java Web Start deployment was built — out of scope per
`design.md` S2 (no JVM, no second deployable); `PLAN.md`'s Definition of Done substitutes the
observable outcome that survives translation.

Design reference: `mockup-admin-home.html`'s "Logout" control and its footnote "Signing out ends it
immediately" — that footnote is now true. No new UI was built; see Notes.

## Files

- `auth/session.ts` — added `invalidateSession`.
- `auth/session.test.ts` — added ST-06..ST-08.
- `routes/api/signon/logout.post.ts` — new route (new).
- `routes/api/signon/logout.post.test.ts` — new route tests (new).

## AC coverage

- AC-1 (JNLP + Java Web Start deployment) — not built; `design.md` S2 and `PLAN.md`'s Definition of
  Done record why, and name the replacement outcome (Launch Rich Client navigates to
  `/admin/orders` in-SPA), which SWHM-T-0115 already implemented and tests
  (`src/pages/admin/index.test.tsx`).
- AC-2 (logout invalidates the session) — `auth/session.ts` `invalidateSession` +
  `routes/api/signon/logout.post.ts`, covered by `ST-06`..`ST-08`, `LO-01`..`LO-03`.

## Verification

```
$ bun --bun vitest run auth/session.test.ts   # red, invalidateSession reverted
3 failed | 5 passed

$ bun --bun vitest run routes/api/signon/logout.post.test.ts   # red, before logout.post.ts existed
Cannot find module './logout.post' — 1 failed, no tests

$ bun run verify
lint: 0 errors
typecheck: 0 errors
test: 62 files passed, 358 passed, 0 failed
```

See `tdd-test-result.md` — `TDD-RESULT: 358 passed, 0 failed`.

`bun run test:e2e` (part of `verify:full`) fails at the Chromium preflight in this container, a
known gap for implementation containers (AGENTS.md § Notes from previous agents) — not retried.

## Notes

`src/pages/admin/index.tsx` was NOT changed. Both button handlers already called the real endpoints
(`POST /api/signon/logout`, navigate to `/admin/orders`) when SWHM-T-0115 wrote the page against
this endpoint with `fetch` mocked; `PLAN.md` step 4 asked this ticket to "make the call real and
confirm the navigation target," and both were already correct once `logout.post.ts` existed to
answer the call — verified by inspection of `src/pages/admin/index.tsx` and its existing passing
test `src/pages/admin/index.test.tsx › "POSTs to /api/signon/logout and navigates to /..."`. No
diff was needed.

`middleware/signon.ts` and `auth/signon-filter.ts` were not touched, per `PLAN.md` step 3 —
`/api/signon/logout` is simply absent from `PROTECTED_RESOURCES`, so it is unprotected by default
with no filter change required.

`e2e/customer-profile.spec.ts` carries a comment that "there is no sign-out endpoint in this
capability," written before this ticket. It is outside this ticket's file ownership
(`auth/**`/`routes/api/signon/logout.post.ts`/`src/pages/admin/index.tsx` only) and untouched;
raised as a follow-up.
