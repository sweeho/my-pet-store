# Fixed interface contracts — SWHM-S-0002 · `user-authentication`

The surfaces below are shared across the ten tickets of this sprint. **A ticket may create
the surfaces it owns; it may not change a surface another ticket owns.** If a contract is
wrong, escalate to planning rather than editing it locally — a peer ticket is already coded
against it.

Read `openspec/changes/swhm-i-0002-user-authentication-sign-on/design.md` first for the
decisions; read `SPEC-DISCREPANCIES.md` (S1–S11) in this directory for why each legacy
artifact maps here the way it does.

## Module layout

Server-side modules for this capability live in a new top-level `auth/` directory. Nitro
scans only `api/`, `routes/`, `middleware/`, `plugins/` and `tasks/` (and auto-imports from
`utils/**`), so `auth/` is safe: a file there is a plain module, not a route. Do **not** put
these modules under `routes/` — every `.ts` file there becomes an HTTP endpoint.

`auth/**/*.test.ts` must run in Vitest's `server` project (node environment), because these
modules reach `db/client.ts` and therefore `bun:sqlite`, which cannot resolve in jsdom.
SWHM-T-0015 widens the project include once; no later ticket touches `vitest.config.ts`.

## Data model (`db/schema.ts`)

```ts
export const authUsers = sqliteTable("auth_users", {
  userName: text("user_name").primaryKey(),
  password: text("password").notNull(), // scrypt-hashed, see S3
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  jSignon: integer("j_signon", { mode: "boolean" }).notNull().default(false),
  jSignonUsername: text("j_signon_username"),
  originalUrl: text("original_url"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

Each schema change is accompanied by its generated migration in `drizzle/`, committed.
The existing `users` table and `routes/api/users/*` are untouched (S2).

## Module surfaces

`auth/user.ts` — owner SWHM-T-0015

```ts
export type AuthUser = { userName: string; password: string };
export function findUser(userName: string): AuthUser | undefined;
export function insertUser(userName: string, password: string): AuthUser; // hashes
export function matchPassword(user: AuthUser, password: string): boolean;
```

`auth/validation.ts` — owner SWHM-T-0016

```ts
export const MAX_USERID_LENGTH = 25;
export const MAX_PASSWD_LENGTH = 32;
export class CreateUserError extends Error {}
export function validateNewUser(userName: string, password: string): void; // throws
```

`auth/authenticate.ts` — owner SWHM-T-0017

```ts
export function authenticate(userName: string, password: string): boolean;
export function createUser(userName: string, password: string): AuthUser; // validates, throws CreateUserError
```

`auth/session.ts` — owner SWHM-T-0018

```ts
export const SESSION_COOKIE = "bp_session";
export type SignOnSession = {
  id: string;
  j_signon: boolean;
  j_signon_username: string | null;
  original_url: string | null;
};
export function useSignOnSession(event: H3Event): SignOnSession; // reads or creates + sets cookie
export function setSignedOn(session: SignOnSession, userName: string): SignOnSession;
export function setOriginalUrl(session: SignOnSession, url: string): SignOnSession;
```

`auth/protected-resources.ts` and `auth/signon-filter.ts` — owner SWHM-T-0019

```ts
export const SIGN_ON_PAGE = "/signon";
export const SIGN_ON_ERROR_PAGE = "/signon-failed";
export const SIGN_ON_WELCOME_PAGE = "/signon-welcome";
export const PROTECTED_RESOURCES = [
  { legacy: "customer.screen", path: "/customer" },
  { legacy: "customer.do", path: "/api/customer" },
  { legacy: "enter_order_information.screen", path: "/enter-order-information" },
  { legacy: "signon_welcome.screen", path: "/signon-welcome" },
] as const;
export function isProtectedResource(path: string): boolean;

export type AccessVerdict = { allowed: true } | { allowed: false; redirectTo: string };
export function evaluateAccess(session: SignOnSession, requestedPath: string): AccessVerdict;
```

`auth/remember-cookie.ts` and `src/utils/cookies.ts` — owner SWHM-T-0020

```ts
export const REMEMBER_COOKIE = "bp_signon";
export const REMEMBER_COOKIE_MAX_AGE = 2_678_400; // seconds — named in a scenario
export function rememberUsername(event: H3Event, userName: string): void;
export function forgetUsername(event: H3Event): void;

// src/utils/cookies.ts — browser side, jsdom-testable
export function readCookie(name: string): string | undefined;
```

## HTTP surfaces

All respond `200` with a JSON body; the verdict is in the body, not the status (S7).

| Route                                   | Owner       | Request                                           | Response                                                                                           |
| --------------------------------------- | ----------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `GET /api/signon/session`               | SWHM-T-0018 | —                                                 | `{ j_signon, j_signon_username, original_url }`                                                    |
| `GET /api/signon/check?resource=<path>` | SWHM-T-0019 | query `resource`                                  | `{ allowed: true }` or `{ allowed: false, redirectTo: "/signon" }`                                 |
| `POST /api/signon`                      | SWHM-T-0021 | `{ j_username, j_password, j_remember_username }` | `{ signedOn: true, redirectTo }` or `{ signedOn: false, redirectTo: "/signon-failed" }`            |
| `POST /api/signon/create-user`          | SWHM-T-0022 | `{ j_username, j_password, j_password_2 }`        | `{ created: true, redirectTo }` or `{ created: false, error, redirectTo: "/user-creation-error" }` |

`redirectTo` after a successful sign-in is the session's `original_url` when one is stored,
otherwise `/signon-welcome`.

## Pages — owner SWHM-T-0023

`/signon` (sign-in + new-customer sign-up), `/signon-failed`, `/user-creation-error`,
`/signon-welcome` (protected), `/customer` (protected placeholder standing for
`customer.screen`), and `src/components/RequireSignOn.tsx`, the guard that consults
`GET /api/signon/check`.

## Surfaces that must not change

- `routes/api/users/*` response shapes and the `users` table — `e2e/smoke.spec.ts` probes
  `/api/users` deliberately as Bun-runtime regression cover.
- `middleware/auth.ts` and `/api/hello` — template stub, not authentication (S10).
- `playwright.config.ts` (port 5178, `--strictPort`, `bun --bun ./node_modules/vite/bin/vite.js`)
  and the `serverDir` / `exclude` / `ignore` settings in `vite.config.ts`.
- The Vitest two-project split rule: db-touching tests run in the `server` (node) project.
- `src/index.css` — the `--destructive-foreground` bug is a raised DEFECT, not in scope here (S11).
