# SWHM-T-0116 — Session invalidation and logout

**Change:** `swhm-i-0006-administrative-operations-ma` · **Group:** `## 3. Rich Client Deployment (Java Web Start)` (3.1–3.5)
**Requirements:** Administrator workflow with login, home page, and rich client launch; Administrator home page with rich client launch and logout options

> Read `openspec/changes/swhm-i-0006-administrative-operations-ma/` first — the decisions document,
> then the delta spec. **S2 and S7 govern this ticket.** Four of this group's five checkboxes describe
> generating a JNLP file and serving `application/x-java-jnlp-file`; none of that is built. Read S2
> before you write anything, or you will build a Java Web Start launcher for a product with no JVM.

## Objective

Build the half of this group that survives translation. There is no logout anywhere in this
repository and no session row is ever deleted — `e2e/customer-profile.spec.ts:14` says so outright.
After this ticket a session can be ended, and the control SWHM-T-0115 put on the home page works.

## Design reference

- `artifacts/SWHM-S-0012/design/mockup-admin-home.html` — the "Logout" control and the footnote
  "Signing out ends it immediately." That footnote is what this ticket makes true.
- `artifacts/SWHM-S-0012/design/MANIFEST.md` § "A note on the Launch Rich Client control".

## Steps

1. **`invalidateSession()`** in `auth/session.ts`. Delete the row by id and clear the `bp_session`
   cookie on the response. Deleting rather than flagging: a session row that exists but is marked dead
   is a second thing every read has to know about, and nothing in the product needs one. Use the same
   cookie attributes `createSession()` sets (`httpOnly`, `sameSite: "lax"`, `path: "/"`) — a clear that
   does not match the original attributes leaves the cookie in place in some browsers.
2. **`POST /api/signon/logout`** at `routes/api/signon/logout.post.ts`. Resolve the session with the
   existing `useSignOnSession(event)`, invalidate it, return `{ signedOut: true }`. It is deliberately
   **not** a protected resource: ending a session you may not have is not a privileged act, and
   requiring a session to end one turns an expired cookie into an error the client has to special-case.
   Calling it with no session, or with a cookie naming a row that is gone, succeeds and returns the
   same body — idempotent by design.
3. **Do not touch `middleware/signon.ts` or `auth/signon-filter.ts`.** SWHM-T-0114 settled the access
   decision this sprint; a logout route needs no change to it. If it seems to, escalate rather than
   editing — that is the one function two enforcement points depend on.
4. **Wire the two controls** in `src/pages/admin/index.tsx`. SWHM-T-0115 wrote that page against this
   endpoint with `fetch` mocked; this ticket makes the call real and confirms the navigation target.
   Change only the two handlers — the page's markup, copy and structure are SWHM-T-0115's and are done.
5. **Tests.** `auth/session.test.ts`: the row is gone after invalidation, the cookie is cleared, and a
   second invalidation of the same id does not throw. `routes/api/signon/logout.post.test.ts`: a
   signed-on session is ended and a subsequent `useSignOnSession` on the same cookie yields a **new**
   session rather than the old one; a request with no cookie returns the same success body. Use a real
   `H3Event` with no server, as `routes/api/signon/index.post.test.ts` does.

## Fixed interface contracts

```ts
// auth/session.ts
export function invalidateSession(event: H3Event, session: SignOnSession): void;

// POST /api/signon/logout  — no body, no session required
type LogoutResult = { signedOut: true };
```

## File/module ownership

Create or modify only: `auth/session.ts`, `auth/session.test.ts`,
`routes/api/signon/logout.post.ts`, `routes/api/signon/logout.post.test.ts`,
`src/pages/admin/index.tsx` (the two button handlers only).

Nothing else. No JNLP producer, no `application/x-java-jnlp-file` response, no
`AdminRequestProcessor` route — see S2.

## Definition of Done

AC-1 and AC-2 on the ticket, read against S2 and S7:

- AC-1 asserts a JNLP file and Java Web Start deployment. Neither exists. The observable outcome that
  replaces it: an authenticated administrator activating "Launch Rich Client" arrives at the
  administration orders screen in the same browser, with their session intact.
- AC-2 asserts `session.invalidate()` via `currentScreen=logout`. The observable outcome that replaces
  it: after logging out, the session row is gone, the cookie is cleared, and a subsequent request to a
  protected path is denied as not-signed-on.

## Gotchas

- Clearing a cookie whose attributes differ from the ones it was set with can leave it in place. Match
  `createSession()` exactly.
- `useSignOnSession()` creates a session when the cookie names a row that does not exist. That is
  correct and is what makes logout idempotent — but it means a test asserting "the session is gone"
  must check the row, not whether a session object comes back.
- Sessions still never expire after this ticket. Logout is explicit invalidation, not a timeout (S8).
