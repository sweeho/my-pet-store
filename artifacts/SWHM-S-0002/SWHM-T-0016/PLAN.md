# PLAN — SWHM-T-0016 · User creation validation

Sprint: SWHM-S-0002 · Change: `swhm-i-0002-user-authentication-sign-on` · Capability: `user-authentication`
Requirements: **Create new user account**, **Enforce maximum username length**, **Enforce password length constraints**

Read `openspec/changes/swhm-i-0002-user-authentication-sign-on/design.md` § User Entity and
§ Account Creation first, then `artifacts/SWHM-S-0002/INTERFACES.md` for the surface this
ticket owns and `artifacts/SWHM-S-0002/SPEC-DISCREPANCIES.md` § S8 for where the password
maximum comes from.

## Design reference

No design blocks on idea SWHM-I-0002 — nothing under `artifacts/SWHM-S-0002/design/`. This
ticket has no UI; the error strings it produces are rendered by SWHM-T-0023.

## Objective

Enforce the three account-creation constraints the spec states, with the exact error text
each scenario names, and make `createUser` unable to write a user that violates them.

## Steps

1. **Constants and error type.** Create `auth/validation.ts` with `MAX_USERID_LENGTH = 25`,
   `MAX_PASSWD_LENGTH = 32` and `CreateUserError` (INTERFACES.md § Module surfaces). 32 comes
   from `legacy-analysis/rebuild-guidance.md` § Data Constraints — the spec leaves `[max]`
   unresolved (S8).
2. **`validateNewUser(userName, password)`**, throwing `CreateUserError` with these strings,
   character for character, because two scenarios assert the text:
   - length over 25 → `User ID cant be more than 25 chars long`
   - `%` or `*` anywhere in the username → `User Id cannot have '%' or '*' characters`
   - password over `MAX_PASSWD_LENGTH` → `Password cant be more than 32 chars long`
     (interpolate the constant; do not hard-code the digits twice).
     Order matters only in that the first failing rule reports; validate the username before the
     password so the username messages are reachable.
3. **Wire it.** Call `validateNewUser` from the creation path in `auth/user.ts` before any
   insert, so no caller can bypass it.
4. **Tests.** `auth/validation.test.ts`: a 25-character username passes; a 26-character one
   throws with the exact message; `%` and `*` each throw with the exact message; a
   33-character password throws with the exact message; a valid pair throws nothing.

## File / module ownership

May create or modify — nothing else:

| Path                      | Why                                                   |
| ------------------------- | ----------------------------------------------------- |
| `auth/validation.ts`      | NEW — constants, `CreateUserError`, `validateNewUser` |
| `auth/validation.test.ts` | NEW — one assertion per scenario                      |
| `auth/user.ts`            | call the validator before insert; nothing else        |

Out of ownership: `db/`, `drizzle/`, `vitest.config.ts`, `routes/`, `middleware/`, `src/`,
`e2e/`, `openspec/`, `artifacts/`, and the repository-root narrative documents.

## Definition of Done

AC-1 and AC-2 are met by step 2's first two rules, AC-3 and AC-4 by the length rule at its
boundary, AC-5 by the password rule — each proved by the matching assertion in step 4. Every
criterion restates a scenario in the change's delta spec.
