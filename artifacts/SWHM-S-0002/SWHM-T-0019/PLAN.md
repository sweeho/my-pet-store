# PLAN — SWHM-T-0019 · SignOn filter

Sprint: SWHM-S-0002 · Change: `swhm-i-0002-user-authentication-sign-on` · Capability: `user-authentication`
Requirements: **Intercept unauthenticated access to protected resources**, **Protect specified resources with authentication**

Read `openspec/changes/swhm-i-0002-user-authentication-sign-on/design.md` § Protected Resource
Access and § Protected Resources first, then `artifacts/SWHM-S-0002/INTERFACES.md`, then
`artifacts/SWHM-S-0002/SPEC-DISCREPANCIES.md` § S5 and § S6 — the filter is split in two here
for a reason, and S6 is that reason.

## Design reference

No design blocks on idea SWHM-I-0002 — nothing under `artifacts/SWHM-S-0002/design/`. The
client guard component that consumes this ticket's endpoint belongs to SWHM-T-0023.

## Objective

Decide access once, in a pure function, and enforce that decision on both entry points a SPA
has: server routes, and the client's own navigation.

## Steps

1. **Configuration.** `auth/protected-resources.ts` — the four entries from design.md
   § Protected Resources, each carrying its legacy token next to the app path it maps to
   (INTERFACES.md). `isProtectedResource(path)` matches a request path against them; match on
   the path only, ignoring query and trailing slash. Three of the four have no route yet (S5);
   they are still configured, and interception still applies the moment they land.
2. **Decision.** `auth/signon-filter.ts` — `evaluateAccess(session, requestedPath)`, pure and
   with no I/O: allowed when the path is not protected, or when `session.j_signon` is true;
   otherwise `{ allowed: false, redirectTo: SIGN_ON_PAGE }`. Storing ORIGINAL_URL is the
   caller's job, so this function stays trivially testable.
3. **Server enforcement.** `middleware/signon.ts` — for every request, resolve the session,
   evaluate, and on a denial store the requested path as ORIGINAL_URL and answer with the
   redirect rather than letting the handler run. Create a new file; leave `middleware/auth.ts`
   exactly as it is — it is a template stub and nothing here may read `event.context.user` (S10).
4. **Client-guard endpoint.** `routes/api/signon/check.get.ts` → `GET /api/signon/check?resource=<path>`:
   evaluate the requested resource, store ORIGINAL_URL in the session on a denial, and return
   `{ allowed }` with `redirectTo` when denied. Reject a `resource` that is not a same-origin
   path (must start with `/` and not `//`), so the stored ORIGINAL_URL can never become an
   open redirect.
5. **Tests.** `auth/signon-filter.test.ts` for the decision table (protected + unsigned → denied;
   protected + signed-on → allowed; unprotected + unsigned → allowed), and
   `routes/api/signon/check.get.test.ts` asserting that a denial for `/customer` leaves
   `original_url` as `/customer` on the session and returns `/signon`, and that a signed-on
   session passes through with no redirect and no ORIGINAL_URL rewrite.

## File / module ownership

May create or modify — nothing else:

| Path                                  | Why                                      |
| ------------------------------------- | ---------------------------------------- |
| `auth/protected-resources.ts`         | NEW — the `signon-config.xml` equivalent |
| `auth/signon-filter.ts`               | NEW — `evaluateAccess`                   |
| `auth/signon-filter.test.ts`          | NEW — decision-table cover               |
| `middleware/signon.ts`                | NEW — server-side enforcement            |
| `routes/api/signon/check.get.ts`      | NEW — `GET /api/signon/check`            |
| `routes/api/signon/check.get.test.ts` | NEW — route cover                        |

Out of ownership: `middleware/auth.ts`, `auth/session.ts` and every other `auth/` module
owned upstream, `db/`, `drizzle/`, `vitest.config.ts`, `routes/api/users/*`, `src/`, `e2e/`,
`openspec/`, `artifacts/`, and the repository-root narrative documents.

## Definition of Done

AC-1 is met by steps 3–4 (the denial stores ORIGINAL_URL and sends the user to the sign-on
page), AC-2 by the signed-on branch in step 2, AC-3 by the configuration in step 1 applied
through either enforcement point — all proved by the assertions in step 5. Each restates a
scenario in the change's delta spec.
