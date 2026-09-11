---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHM-S-0002
ticket: SWHM-T-0015
branch: vortex/feat/SWHM-T-0015-user-entity-f2062ba9
upstream: [artifacts/SWHM-S-0002/SWHM-T-0015/PLAN.md]
downstream: [artifacts/SWHM-S-0002/qa-test-report.md]
---

# Summary — SWHM-T-0015: User entity

## What changed

Added the capability's stored User: an `auth_users` table (`user_name` primary key, `password`), the `auth/user.ts` module (`findUser`, `insertUser`, `matchPassword`) with scrypt-based password hashing, and widened the Vitest `server` project so a db-backed module outside `routes/` can be tested.

## Files

- `db/schema.ts` — adds `authUsers` (`auth_users` table); the existing `users` table is untouched.
- `drizzle/0001_easy_tomorrow_man.sql`, `drizzle/meta/0001_snapshot.json`, `drizzle/meta/_journal.json` — generated migration for the schema change (`bun run db:generate`).
- `auth/user.ts` — NEW. `findUser`/`insertUser`/`matchPassword` per `INTERFACES.md` § Module surfaces; `insertUser` stores `scrypt$<salt>$<derived>` (`node:crypto` `scryptSync`), `matchPassword` compares with `timingSafeEqual`.
- `auth/user.test.ts` — NEW. Unit cover for the above.
- `vitest.config.ts` — `server` project `include` widened to `auth/**/*.test.ts`; `client` project `exclude` gains `auth/**`.

## AC coverage

- AC-1 ("Create new user account" — a new User entity SHALL be created with those credentials) — met by `auth/user.ts` `insertUser`/`findUser` against `auth_users`, covered by `auth/user.test.ts › UT-01` and `› UT-04`.

## Verification

```
$ NODE_ENV=test bun --bun vitest run auth/user.test.ts   # red, before auth/user.ts existed
Cannot find module './user' imported from /workspace/repo/auth/user.test.ts

$ bun run verify                                          # green, full gate
eslint ✓  tsc --build ✓
Test Files  8 passed (8)
     Tests  24 passed (24)
```

See `tdd-test-result.md` — `TDD-RESULT: 24 passed, 0 failed`.

## Notes

Only `authUsers` was added to `db/schema.ts`; the `sessions` table also shown in `INTERFACES.md` § Data model belongs to SWHM-T-0018 (`auth/session.ts` owner), which is out of this ticket's file ownership.
