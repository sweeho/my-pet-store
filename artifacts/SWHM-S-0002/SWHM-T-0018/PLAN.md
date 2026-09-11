# PLAN — SWHM-T-0018 · Session management

Sprint: SWHM-S-0002 · Change: `swhm-i-0002-user-authentication-sign-on` · Capability: `user-authentication`
Requirement: **Establish session on successful authentication**

Read `openspec/changes/swhm-i-0002-user-authentication-sign-on/design.md` § Session State
first, then `artifacts/SWHM-S-0002/INTERFACES.md` for the surfaces this ticket owns and
`artifacts/SWHM-S-0002/SPEC-DISCREPANCIES.md` § S4 for why the session is hand-built.

## Design reference

No design blocks on idea SWHM-I-0002 — nothing under `artifacts/SWHM-S-0002/design/`. This
ticket has no UI.

## Objective

Give the server a per-visitor session carrying the three attributes the scenarios name —
`j_signon`, `j_signon_username`, `ORIGINAL_URL` — and one endpoint that reports them, so the
session state is observable rather than inferred.

## Steps

1. **Schema.** Add the `sessions` table to `db/schema.ts` exactly as INTERFACES.md § Data
   model declares it, and generate + commit its migration into `drizzle/`.
2. **Module.** Create `auth/session.ts` (INTERFACES.md § Module surfaces). `useSignOnSession`
   reads the `bp_session` cookie; with no cookie, or with an id that matches no row, it creates
   a row with `j_signon` false and sets the cookie (`httpOnly`, `sameSite: "lax"`, `path: "/"`).
   That default is the scenario "New sessions initialize with unsigned-on state" — do not leave
   the attribute absent and infer false from its absence.
3. **Mutators.** `setSignedOn(session, userName)` writes `j_signon = true` and
   `j_signon_username = userName` in one update; `setOriginalUrl(session, url)` writes
   `original_url`. Both return the updated session. Nothing else writes those columns.
4. **Endpoint.** `routes/api/signon/session.get.ts` → `GET /api/signon/session`, returning
   `{ j_signon, j_signon_username, original_url }` for the current session, creating one if the
   caller has none. This is what the client guard and the E2E tier read.
5. **Tests.** `auth/session.test.ts` for the module (fresh session is unsigned-on; `setSignedOn`
   sets both attributes; a second call with the same cookie returns the same row) and
   `routes/api/signon/session.get.test.ts` for the endpoint shape, following the real-`H3Event`
   pattern in `routes/api/users/index.get.test.ts`.

## File / module ownership

May create or modify — nothing else:

| Path                                    | Why                                  |
| --------------------------------------- | ------------------------------------ |
| `db/schema.ts`                          | adds `sessions` only                 |
| `drizzle/*.sql`, `drizzle/meta/*`       | generated migration for that change  |
| `auth/session.ts`                       | NEW — session read/create + mutators |
| `auth/session.test.ts`                  | NEW — unit cover                     |
| `routes/api/signon/session.get.ts`      | NEW — `GET /api/signon/session`      |
| `routes/api/signon/session.get.test.ts` | NEW — route cover                    |
| `tsconfig.node.json`                    | one-line addendum — see below        |

Out of ownership: `auth/user.ts`, `auth/validation.ts`, `auth/authenticate.ts`,
`vitest.config.ts`, `middleware/`, `src/`, `e2e/`, `openspec/`, `artifacts/`, and the
repository-root narrative documents.

**Deviation (minor, recorded per protocol):** `tsconfig.node.json`'s `include` never listed
`auth/` — no earlier ticket's `routes/`/`middleware/`/`db/` file imported from `auth/`, so
`tsc --build`'s project graph never needed to compile it. Step 4's endpoint is the first file
under `routes/` to import from `auth/`, which surfaced the gap as a `tsc` project-reference
error (`TS6307`). Added `"auth"` to the include array — additive, no behavior change, no
fixed-interface or ownership-map impact — and proceeded rather than blocking.

## Definition of Done

AC-1 is met by step 3 and AC-2 by the default in step 2, both proved by the assertions in
step 5. Each restates a scenario under "Establish session on successful authentication" in
the change's delta spec. A session has no expiry this sprint — no scenario specifies one (S9).
