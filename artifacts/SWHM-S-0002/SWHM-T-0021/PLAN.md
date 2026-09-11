# PLAN — SWHM-T-0021 · Sign-in workflow

Sprint: SWHM-S-0002 · Change: `swhm-i-0002-user-authentication-sign-on` · Capability: `user-authentication`
Requirements: **Redirect to originally-requested resource after authentication**, **Redirect to error page on authentication failure**

Read `openspec/changes/swhm-i-0002-user-authentication-sign-on/design.md` § Authentication
Flow (Sign-In) and § Form Parameters first, then `artifacts/SWHM-S-0002/INTERFACES.md` for the
HTTP contract, then `artifacts/SWHM-S-0002/SPEC-DISCREPANCIES.md` § S7 for why this endpoint
answers with a `redirectTo` instead of a 302.

## Design reference

No design blocks on idea SWHM-I-0002 — nothing under `artifacts/SWHM-S-0002/design/`. The form
that posts to this endpoint belongs to SWHM-T-0023.

## Objective

Join the pieces the previous five tickets built into the sign-in transaction: authenticate,
establish the session, honour the remember-username checkbox, and tell the client where to go.

## Steps

1. **Endpoint.** `routes/api/signon/index.post.ts` → `POST /api/signon`, reading
   `j_username`, `j_password` and `j_remember_username` from the body (design.md § Form
   Parameters — keep the legacy field names, they are the contract the form is written to).
2. **Authenticate** with `authenticate()` (design.md § Sign-In step 2). Treat a missing or
   non-string field as a failed sign-in, not a 500.
3. **On success** (design.md § Sign-In step 4): `setSignedOn(session, j_username)`, then
   resolve the destination — the session's `original_url` when one is stored, otherwise
   `/signon-welcome` — and clear `original_url` once consumed so a later sign-in does not
   replay a stale destination. Return `{ signedOn: true, redirectTo }`.
   **Deviation (minor, recorded per the deviation protocol):** `auth/session.ts`'s
   `setOriginalUrl(session: SignOnSession, url: string): SignOnSession` — a fixed contract
   owned by SWHM-T-0018, out of this ticket's ownership — accepts only a `string`, so there is
   no way to write `original_url` back to `null` without a signature change. The clear step is
   not implemented; `redirectTo` is still computed correctly for this request. A stale
   `original_url` can only resurface on a _redundant_ repeat sign-in on an already-signed-on
   session, since `middleware/signon.ts`/`check.get.ts` never call `setOriginalUrl` while
   `j_signon` is true — no scenario in the delta spec exercises that path. See `summary.md`
   § Notes; a follow-up ticket is raised for the capability the upstream contract is missing.
4. **Remember the username** in the same request: `rememberUsername` when the checkbox came
   back truthy, `forgetUsername` when it did not. The clear branch runs on every sign-in
   without the box, whether or not a cookie is currently set.
5. **On failure** (design.md § Sign-In step 5): leave the session unsigned-on, do not touch
   `original_url`, and return `{ signedOn: false, redirectTo: "/signon-failed" }`. Do not say
   which of username or password was wrong.
6. **Tests.** `routes/api/signon/index.post.test.ts`, following the real-`H3Event` pattern in
   `routes/api/users/index.get.test.ts`: a user created through `createUser` signs in and the
   response carries the stored ORIGINAL_URL (`/customer`) as `redirectTo`; with no stored
   ORIGINAL_URL it carries `/signon-welcome`; a wrong password returns `signedOn: false` with
   `/signon-failed` and leaves `j_signon` false; the checkbox sets `bp_signon` with
   `Max-Age=2678400`, and its absence emits `Max-Age=0`.

## File / module ownership

May create or modify — nothing else:

| Path                                   | Why                      |
| -------------------------------------- | ------------------------ |
| `routes/api/signon/index.post.ts`      | NEW — `POST /api/signon` |
| `routes/api/signon/index.post.test.ts` | NEW — route cover        |

Out of ownership: every `auth/` module (consume them; they are owned upstream),
`routes/api/signon/session.get.ts`, `routes/api/signon/check.get.ts`, `middleware/`, `db/`,
`drizzle/`, `vitest.config.ts`, `src/`, `e2e/`, `openspec/`, `artifacts/`, and the
repository-root narrative documents.

## Definition of Done

AC-1 is met by step 3 and AC-2 by step 5, both proved by the assertions in step 6. Each
restates a scenario in the change's delta spec. The browser-level proof of the same two
outcomes is SWHM-T-0024's.
