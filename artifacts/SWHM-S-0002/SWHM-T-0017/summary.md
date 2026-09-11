---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0017
branch: vortex/feat/SWHM-T-0017-authentication-service-f9489aed
upstream: [artifacts/SWHM-S-0002/SWHM-T-0017/PLAN.md]
downstream: [artifacts/SWHM-S-0002/qa-test-report.md]
---

# Summary — SWHM-T-0017: Authentication service

## What changed

Added the capability's service layer, `auth/authenticate.ts`: `authenticate(userName, password)` answers whether credentials are valid (a missing user is `false`, not an error), and `createUser(userName, password)` registers an account, letting `CreateUserError` propagate unchanged.

## Files

- `auth/authenticate.ts` — NEW. `authenticate` (looks up via `findUser`, returns `false` on no match, else delegates to `matchPassword`) and `createUser` (delegates to `insertUser`).
- `auth/authenticate.test.ts` — NEW. Unit cover for the above.

## AC coverage

- AC-1 (authentication succeeds with correct credentials → `true`) — `auth/authenticate.test.ts › AT-01`.
- AC-2 (authentication fails with an incorrect password → `false`) — `auth/authenticate.test.ts › AT-02` (and `AT-04` for the case-sensitivity edge).
- AC-3 (authentication fails for a non-existent username → `false`, not an error) — `auth/authenticate.test.ts › AT-03`.

## Verification

```
$ NODE_ENV=test bun --bun vitest run auth/authenticate.test.ts   # red, before auth/authenticate.ts existed
Cannot find module './authenticate' imported from /workspace/repo/auth/authenticate.test.ts

$ bun run verify                                                  # green, full gate
eslint ✓  tsc --build ✓
Test Files  10 passed (10)
     Tests  34 passed (34)
```

See `tdd-test-result.md` — `TDD-RESULT: 34 passed, 0 failed`.

## Notes

Minor deviation from `PLAN.md` step 2: it names an explicit `validateNewUser` call before `insertUser`. SWHM-T-0016 already moved that call inside `auth/user.ts`'s `insertUser`, so `createUser` here delegates to `insertUser` directly rather than validating a second time — `CreateUserError` still propagates unchanged, and no interface contract changed. `PLAN.md` on this branch is updated to record it.
