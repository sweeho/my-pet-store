# PLAN — SWHM-T-0017 · Authentication service

Sprint: SWHM-S-0002 · Change: `swhm-i-0002-user-authentication-sign-on` · Capability: `user-authentication`
Requirement: **Authenticate user with credentials**

Read `openspec/changes/swhm-i-0002-user-authentication-sign-on/design.md` § Authentication
Flow first, then `artifacts/SWHM-S-0002/INTERFACES.md` for the surface this ticket owns.

## Design reference

No design blocks on idea SWHM-I-0002 — nothing under `artifacts/SWHM-S-0002/design/`. This
ticket has no UI.

## Objective

Provide the capability's service layer: one function that answers "are these credentials
valid", and one that registers a new account. Everything above this ticket calls these two and
never reaches into `auth/user.ts` directly.

## Steps

1. **`authenticate(userName, password)`** in `auth/authenticate.ts` (design.md § Sign-In,
   steps 2–3): look the user up with `findUser`; if there is none, return `false` — a missing
   user is not an error path, it is a `false` (design.md: the legacy service caught
   `FinderException` and returned false). If there is one, return `matchPassword(user, password)`.
   Never report which of the two failed, and never throw for a bad credential.
2. **`createUser(userName, password)`** in the same module (design.md § Account Creation,
   steps 2–4): call `validateNewUser`, then `insertUser`, returning the created `AuthUser`.
   `CreateUserError` propagates to the caller unchanged — SWHM-T-0022 turns it into a response.
   **Deviation (minor, recorded per the deviation protocol):** SWHM-T-0016 moved the
   `validateNewUser` call inside `auth/user.ts`'s `insertUser` itself, so `createUser` here
   delegates to `insertUser` directly rather than calling `validateNewUser` a second time.
   `CreateUserError` still propagates unchanged; no interface contract changed. See
   `summary.md` § Notes.
3. **Tests.** `auth/authenticate.test.ts`, against a real user inserted through `createUser`:
   correct credentials → `true`; wrong password → `false`; a username that was never created →
   `false`; a correct password in the wrong case → `false` (matching is case-sensitive).

## File / module ownership

May create or modify — nothing else:

| Path                        | Why                                   |
| --------------------------- | ------------------------------------- |
| `auth/authenticate.ts`      | NEW — `authenticate` and `createUser` |
| `auth/authenticate.test.ts` | NEW — one assertion per scenario      |

Out of ownership: `auth/user.ts` and `auth/validation.ts` (owned by SWHM-T-0015 and
SWHM-T-0016 — consume them, do not edit them), `db/`, `drizzle/`, `vitest.config.ts`,
`routes/`, `middleware/`, `src/`, `e2e/`, `openspec/`, `artifacts/`, and the repository-root
narrative documents.

## Definition of Done

AC-1, AC-2 and AC-3 are met by step 1 and proved by the three assertions in step 3. Each
restates a scenario under the requirement "Authenticate user with credentials" in the change's
delta spec.
