# PLAN — SWHM-T-0022 · Account creation workflow

Sprint: SWHM-S-0002 · Change: `swhm-i-0002-user-authentication-sign-on` · Capability: `user-authentication`
Requirement: **Create new user account**

Read `openspec/changes/swhm-i-0002-user-authentication-sign-on/design.md` § Account Creation
and § Form Parameters first, then `artifacts/SWHM-S-0002/INTERFACES.md` for the HTTP contract,
then `artifacts/SWHM-S-0002/SPEC-DISCREPANCIES.md` § S7.

## Design reference

No design blocks on idea SWHM-I-0002 — nothing under `artifacts/SWHM-S-0002/design/`. The
sign-up form and the `/user-creation-error` page belong to SWHM-T-0023.

## Objective

Turn registration into one request: validate, create, sign the new customer in, and surface a
validation failure as the exact message the spec names.

## Steps

1. **Endpoint.** `routes/api/signon/create-user.post.ts` → `POST /api/signon/create-user`,
   reading `j_username`, `j_password` and `j_password_2` (design.md § Form Parameters).
2. **Confirmation.** When `j_password_2` does not equal `j_password`, answer
   `{ created: false, error: "Passwords do not match", redirectTo: "/user-creation-error" }`
   without touching the database. The spec specifies only the client-side check (tasks 9.5), so
   the server keeps its own — a client check is a convenience, never the enforcement.
3. **Create** with `createUser()` (design.md § Account Creation steps 2–4). On success,
   `setSignedOn(session, j_username)` — design.md step 4 for the equivalent flow establishes
   the session — and return `{ created: true, redirectTo: "/signon-welcome" }`.
4. **On `CreateUserError`** (design.md § Account Creation step 5): return
   `{ created: false, error: <the message verbatim>, redirectTo: "/user-creation-error" }`
   with the session left unsigned-on. Pass the validator's text through untouched; two
   scenarios assert it character for character.
5. **Tests.** `routes/api/signon/create-user.post.test.ts`: a valid pair creates the user,
   returns `created: true` and leaves the session signed-on with `j_signon_username` set; a
   26-character username returns `created: false` with `User ID cant be more than 25 chars long`;
   a username containing `%` returns `User Id cannot have '%' or '*' characters`; a mismatched
   confirmation creates nothing.

## File / module ownership

May create or modify — nothing else:

| Path                                         | Why                                  |
| -------------------------------------------- | ------------------------------------ |
| `routes/api/signon/create-user.post.ts`      | NEW — `POST /api/signon/create-user` |
| `routes/api/signon/create-user.post.test.ts` | NEW — route cover                    |

Out of ownership: every `auth/` module, the other `routes/api/signon/*` handlers,
`routes/api/users/*`, `middleware/`, `db/`, `drizzle/`, `vitest.config.ts`, `src/`, `e2e/`,
`openspec/`, `artifacts/`, and the repository-root narrative documents.

## Definition of Done

AC-1 is met by step 3, AC-2 and AC-3 by the error passthrough in step 4 — all proved by the
assertions in step 5. Each restates a scenario under "Create new user account" in the change's
delta spec, reached here through the HTTP workflow rather than the module that enforces it.
