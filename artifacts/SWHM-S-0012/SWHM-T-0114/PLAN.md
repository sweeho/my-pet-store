# SWHM-T-0114 — Admin authentication and role-based access

**Change:** `swhm-i-0006-administrative-operations-ma` · **Group:** `## 1. Admin Authentication & Security` (1.1–1.9)
**Requirements:** Administrator workflow with login, home page, and rich client launch; Administrator login form with pre-populated default values

> Read `openspec/changes/swhm-i-0006-administrative-operations-ma/` first — the decisions document,
> then the delta spec. Everything below its `# Planning record — SWHM-S-0012` line is this sprint's
> record; **S3, S9 and S13 and decisions D2 and D3 govern this ticket** and explain why the extracted
> criteria name `j_security_check` and `login.jsp`, neither of which exists here.

## Objective

Give the identity model a role dimension and put an administrator sign-in screen in front of it.
After this ticket an identity can hold the administrator role, `evaluateAccess()` can tell "not signed
on" from "signed on without the role", the admin paths are in the resource list, and `/admin/signon`
signs someone in. No admin page or API exists yet — those are SWHM-T-0115 and SWHM-T-0117.

## Design reference

- `artifacts/SWHM-S-0012/design/mockup-admin-login.html` — the screen this ticket builds: header mark
  and "My Pet Store · Administration", the "Administrator Sign In" heading, the note that the fields
  are pre-filled with development defaults, the two fields, the "Sign In" action, "← Back to store".
- `artifacts/SWHM-S-0012/design/wireframe-admin-login.html` — its structure.
- `artifacts/SWHM-S-0012/design/MANIFEST.md` — what each reference fixes.

## Steps

1. **`role` on `auth_users`** in `db/schema.ts`. A nullable `text("role")` — absent means an ordinary
   customer, `"administrator"` means the marker is held. Nullable rather than a defaulted enum because
   every existing row predates the column and "no role" is the honest reading of them. Generate the
   migration into `drizzle/` and commit it; the schema change is not complete without it
   (ARCHITECTURE.md § Data model). Do not touch any other table — the order tables are SWHM-T-0118's.
2. **Seed the development administrator** in `db/client.ts`, beside the existing demo seed: user name
   `jps_admin`, password `admin` hashed through the same path `insertUser()` uses, role
   `administrator`. It is hashed like every other credential — the extracted spec's plaintext framing
   was already refused once and that refusal is a standing decision (ARCHITECTURE.md § Key Decisions).
   Seed it only where the existing demo data is seeded, so it is development data and nothing more.
3. **`PROTECTED_RESOURCES` gains a role requirement** in `auth/protected-resources.ts`. Entries become
   `{ legacy, path, requiresRole? }`; the four existing entries keep their exact shape with the field
   absent. Add `/admin`, `/api/admin` and `/admin/orders` — and note that `isProtectedResource()`
   matches a normalized path exactly, so a prefix match is what the admin subtree needs. Extend the
   matcher to cover a path and its descendants for admin entries rather than enumerating every future
   admin page: a page added later that nobody remembered to list is a public screen
   (ARCHITECTURE.md § Routing). `/admin/signon` and `/admin/signon-failed` must **not** be protected —
   they are how someone signs in.
4. **`evaluateAccess()` grows a second dimension** in `auth/signon-filter.ts`. It takes the session and
   the path as it does today and returns one of three verdicts: allowed; denied because not signed on,
   carrying `redirectTo`; denied because the role is missing. Keep it pure and keep it the only place
   the decision is made. The session does not carry the role today — pass it in, or look it up from
   `j_signon_username` through `auth/user.ts`; prefer passing it so the function stays pure and
   testable without a database.
5. **`middleware/signon.ts` translates the third verdict.** Not signed on behaves exactly as it does
   now — navigation redirects and records the return address, background fetch gets 401 and records
   nothing. Role missing answers **403** for both, and records nothing in either case: sending a
   signed-on user to sign on again loops (D3). Do not widen or re-order the existing branches.
6. **`routes/api/signon/check.get.ts`** returns the new verdict unchanged so the client guard sees the
   same three answers. It currently calls `setOriginalUrl` on any denial — that must now happen only
   for the not-signed-on verdict, for the same reason as step 5.
7. **`RequireAdmin`** in `src/components/RequireAdmin.tsx`, a sibling of `RequireSignOn`, not a
   replacement. Same shape: fetch `/api/signon/check`, render a `role="status"` pending element while
   undecided — never nothing (ARCHITECTURE.md § Key Decisions) — redirect on a not-signed-on denial,
   and on a role denial render a refusal in place rather than navigating anywhere. Export it from
   `src/components/index.ts`.
8. **`/admin/signon`** at `src/pages/admin/signon.tsx`. The two fields are pre-filled with `jps_admin`
   and `admin` as the criterion requires, with the mockup's note saying they are development defaults.
   Submitting POSTs to the existing `POST /api/signon` with `j_username` / `j_password` — `/api/signon`
   already returns `{ signedOn, redirectTo }`, so there is no second authentication path to write
   (S3). On success go to `/admin`; on failure go to `/admin/signon-failed`, the page SWHM-T-0123
   builds. Not wrapped in `RequireAdmin` — it is the way in.
9. **Tests.** `auth/signon-filter.test.ts` gains the three verdicts, including the case that regressed
   before: a signed-on user without the role gets the role denial and no return address is recorded.
   `auth/user.test.ts` covers reading the role. `routes/api/signon/check.get.test.ts` covers all three
   through the endpoint. `src/components/RequireAdmin.test.tsx` covers pending, allowed and both
   denials. `src/pages/admin/signon.test.tsx` asserts the two pre-filled values and the POST body.
   The existing sign-on tests must keep passing untouched — if one needs editing, the verdict shape
   changed in a way it should not have.

## Fixed interface contracts

SWHM-T-0115, SWHM-T-0117 and SWHM-T-0123 code against these. Changing one is a plan revision, not an
implementation choice — escalate to planning rather than editing it.

```ts
// auth/protected-resources.ts
export type ProtectedResource = { legacy: string; path: string; requiresRole?: string };
export const ADMIN_ROLE = "administrator";
export const ADMIN_SIGN_ON_PAGE = "/admin/signon";
export const ADMIN_SIGN_ON_ERROR_PAGE = "/admin/signon-failed";
export const ADMIN_HOME_PAGE = "/admin";

// auth/signon-filter.ts
export type AccessVerdict =
  | { allowed: true }
  | { allowed: false; reason: "not-signed-on"; redirectTo: string }
  | { allowed: false; reason: "role-required"; requiredRole: string };

export function evaluateAccess(
  session: SignOnSession,
  requestedPath: string,
  role?: string | null,
): AccessVerdict;

// auth/user.ts
export type AuthUser = { userName: string; password: string; role: string | null };
export function findUserRole(userName: string): string | null;
```

```ts
// db/schema.ts — the column only
role: text("role"); // null = ordinary customer; "administrator" = holds the marker
```

## File/module ownership

Create or modify only: `db/schema.ts` (the role column only), `drizzle/` (its migration),
`db/client.ts` (the seed), `auth/protected-resources.ts`, `auth/signon-filter.ts`,
`auth/signon-filter.test.ts`, `auth/user.ts`, `auth/user.test.ts`, `middleware/signon.ts`,
`routes/api/signon/check.get.ts`, `routes/api/signon/check.get.test.ts`,
`src/pages/admin/signon.tsx`, `src/pages/admin/signon.test.tsx`, `src/components/RequireAdmin.tsx`,
`src/components/RequireAdmin.test.tsx`, `src/components/index.ts`.

Nothing else. In particular: the order tables belong to SWHM-T-0118, and `admin/` and
`vitest.config.ts` belong to SWHM-T-0117.

## Definition of Done

AC-1, AC-2 and AC-3 on the ticket, plus: the existing authentication suite passes unedited, and the
generated migration is committed alongside the schema change.

## Gotchas

- `auth_users` has no role today and every seeded row predates the column — a non-null default would
  claim something about rows nobody has looked at.
- `isProtectedResource()` matches an exact normalized path. The four existing entries rely on that;
  the admin subtree cannot.
- The pre-filled credentials are a real, working account. They are seeded as development data and
  PRODUCT.md § Not yet decided records the deployment question — do not extend them beyond the seed.
