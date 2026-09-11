# Spec discrepancies — SWHM-S-0002 · change `swhm-i-0002-user-authentication-sign-on`

The `user-authentication` delta spec was EXTRACTED from the legacy Java EE petstore. It
describes what that system did. This repository is a React 19 SPA + Nitro 3 (H3) server +
Drizzle/SQLite under Bun, so a number of the spec's artifacts have no counterpart here.

Every contradiction found during the Stage-0 investigation is recorded below. **The delta
spec was not edited** — each entry states what the spec says, what the code actually is,
and the resolution every ticket plan builds to. Where a scenario names a legacy artifact,
the resolution preserves the scenario's OBSERVABLE outcome, which is what validation
reports a verdict against at integration QA.

## Design reference

Idea SWHM-I-0002 carries **no design blocks** — `a2a_get_idea_design` returned an empty
manifest. There is nothing under `artifacts/SWHM-S-0002/design/` and no mockup to match.
The sign-on interfaces are built from the existing design system (DESIGN.md), unchanged.

---

## S1 — The spec describes a Java EE application; this repository is a SPA + Nitro server

`design.md` and `tasks.md` name EJBs (`UserEJB` CMP 2.x, `SignOnEJB`), a servlet filter
(`SignOnFilter`), JSPs (`signon.jsp`, `signon_failed.jsp`, `user_creation_error.jsp`), a
`signon-config.xml` deployment descriptor, and the J2EE form endpoints `j_signon_check` and
`createuser.do`. None of these technologies exists here, and `legacy-analysis/rebuild-guidance.md`
states outright that "the legacy paths (signon, cart.do, order.do) do NOT define the
rebuild's API".

**Resolution** — a one-to-one mapping, used identically by every ticket plan:

| Spec artifact             | This repository                                                        |
| ------------------------- | ---------------------------------------------------------------------- |
| `UserEJB` (CMP entity)    | `auth_users` table in `db/schema.ts` + `auth/user.ts`                  |
| `SignOnEJB`               | `auth/authenticate.ts`                                                 |
| `SignOnFilter` (servlet)  | `auth/signon-filter.ts` + `middleware/signon.ts` + `/api/signon/check` |
| `signon-config.xml`       | `auth/protected-resources.ts`                                          |
| `j_signon_check`          | `POST /api/signon`                                                     |
| `createuser.do`           | `POST /api/signon/create-user`                                         |
| `signon.jsp`              | `src/pages/signon.tsx` (`/signon`)                                     |
| `signon_failed.jsp`       | `src/pages/signon-failed.tsx` (`/signon-failed`)                       |
| `user_creation_error.jsp` | `src/pages/user-creation-error.tsx` (`/user-creation-error`)           |
| `customer.screen`         | `/customer` (`src/pages/customer.tsx`)                                 |

The form field names (`j_username`, `j_password`, `j_password_2`, `j_remember_username`),
the session attribute names (`j_signon`, `j_signon_username`, `ORIGINAL_URL`) and the cookie
name (`bp_signon`) are kept verbatim — they are named in scenarios and are therefore
observable.

## S2 — "User entity" versus the existing `users` table

`db/schema.ts` already has a `users` table (`id` autoincrement, `name`, `email`). It is
template demo content seeded by `db/client.ts`, served by `routes/api/users/*`, and probed
deliberately by `e2e/smoke.spec.ts` as regression cover for the Bun-runtime constraint
(ARCHITECTURE.md § Cross-cutting constraints). It has no password column and its primary key
is numeric, so it cannot be the spec's User entity.

**Resolution** — a new `auth_users` table (`user_name` TEXT primary key, `password` TEXT) is
added alongside it. The `users` table, its routes and their response shapes are untouched and
remain a fixed interface contract. Consolidating the two is future work, not this sprint's.

## S3 — Password storage: the spec mandates plaintext comparison

`design.md` § Password Verification: "Passwords are compared using exact string matching via
String.equals() method (case-sensitive, no hashing)." Storing plaintext credentials is a
standing security defect, and `legacy-analysis/rebuild-guidance.md` § Gotchas #10 already
directs the rebuild not to replicate legacy plaintext storage for card data.

**Resolution** — the stored representation is a scrypt hash (`node:crypto`, per-user random
salt, `scrypt$<salt>$<derived>`); verification remains an exact, case-sensitive match of the
supplied password and is constant-time. No scenario observes the stored representation:
every one of them observes only that authentication returns true or false. The delta spec was
not edited; this deviation is deliberate and recorded here.

## S4 — h3 v2 has no session primitive

`nitro/h3` re-exports h3 v2 (`node_modules/nitro/lib/h3.mjs` is `export * from "h3"`). h3 v2
exports `getCookie` / `setCookie` / `deleteCookie` / `parseCookies` but **no** `useSession` or
sealed-session helper. There is nothing in the repository that holds per-visitor state.

**Resolution** — the session is implemented in-repo: an opaque id in an httpOnly `bp_session`
cookie over a `sessions` table (`id`, `j_signon`, `j_signon_username`, `original_url`,
`updated_at`). The attribute names in the scenarios become the column names, so
`GET /api/signon/session` reports exactly what the scenarios assert.

## S5 — Three of the four protected resources do not exist yet

`design.md` § Protected Resources lists `customer.screen`, `customer.do`,
`enter_order_information.screen` and `signon_welcome.screen`. None of them exists in this
repository; `customer.*` belongs to idea SWHM-I-0003 and `enter_order_information` to
SWHM-I-0008.

**Resolution** — all four are registered in `auth/protected-resources.ts` with their legacy
token recorded next to the app path, so interception is configured for each the moment its
route lands. This sprint creates only the two pages its own scenarios need: `/customer` (a
placeholder standing for `customer.screen`, the original-URL target named in two scenarios)
and `/signon-welcome` (the default post-sign-in landing). Interception for a path with no
page yet is still enforced and still stores ORIGINAL_URL.

## S6 — A servlet filter cannot intercept SPA client-side navigation

The spec's filter sees every request, including page requests. Here, page navigation inside
the SPA never reaches the server: Vite serves the HTML shell and react-router handles the
route in the browser. A middleware-only implementation would enforce nothing on
`/customer` in dev — which is exactly where the E2E tier runs.

**Resolution** — the filter decision is one pure function, `evaluateAccess()` in
`auth/signon-filter.ts`, consumed in two places: `middleware/signon.ts` enforces it for
server routes, and `GET /api/signon/check?resource=<path>` answers it for the client route
guard (`src/components/RequireSignOn.tsx`). Both paths store ORIGINAL_URL in the
server-side session, so the scenario's assertion holds whichever entry point is used.

## S7 — 302 redirects versus an SPA's JSON responses

Scenarios say the system "SHALL redirect to signon_failed.jsp" / "SHALL redirect to
customer.screen". A `fetch` from the SPA follows a 302 transparently and cannot act on it,
so a server-issued redirect would leave the browser on the sign-on page with no feedback.

**Resolution** — the sign-on endpoints answer with `{ redirectTo: <path> }` and the client
navigates there. The observable outcome each scenario names — the user ends up on the error
page, or on the originally-requested URL — is unchanged and is asserted in the browser tier.

## S8 — `MAX_PASSWD_LENGTH` has no value in the spec

The scenario expects the error "Password cant be more than [max] chars long" with `[max]`
unresolved; `design.md` defers to an unspecified constant.

**Resolution** — `MAX_PASSWD_LENGTH = 32`, from `legacy-analysis/rebuild-guidance.md`
§ Data Constraints ("Password max ~32 characters"). The message is rendered with the
constant interpolated, so the emitted text is "Password cant be more than 32 chars long".

## S9 — Session expiry is unspecified

`legacy-analysis/rebuild-guidance.md` records a 54-minute session timeout for the supplier
application and notes the petstore may differ. No scenario in the delta spec mentions
expiry.

**Resolution** — out of scope this sprint; sessions do not expire. Raised as an
improvement-labelled ticket rather than implemented against no scenario.

## S10 — `middleware/auth.ts` is a stub and is not authentication

`middleware/auth.ts` attaches a hardcoded `{ name: "Yeasin" }` to `event.context.user` on
every request, and `routes/api/hello.ts` reads it (with a route test asserting the greeting).
ARCHITECTURE.md already states it "is not authentication and nothing may treat it as such".

**Resolution** — it is left exactly as it is; the new filter is a separate file,
`middleware/signon.ts`, and nothing in this capability reads `event.context.user`. Removing
the stub is raised as an improvement-labelled ticket.

## S11 — the `--destructive-foreground` token bug is in the path of the error pages

`src/index.css:22-23` sets light-mode `--destructive-foreground` to the same value as
`--destructive`, so `text-destructive-foreground` on `bg-destructive` renders invisible text
(DESIGN.md § Tokens records it as a known bug). The sign-on error page and the user-creation
error page are the first screens in this product that display error text.

**Resolution** — the error surfaces use `text-destructive` on the page background and do not
use the `bg-destructive` / `text-destructive-foreground` pair, so no ticket in this sprint
depends on the broken token. The token itself is raised as a DEFECT; fixing it is a
design-system change and belongs with the doc that describes it, not inside a behaviour
ticket.
