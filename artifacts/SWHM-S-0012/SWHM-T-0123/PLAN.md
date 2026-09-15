# SWHM-T-0123 — Admin sign-in error page and access-denial coverage

**Change:** `swhm-i-0006-administrative-operations-ma` · **Group:** `## 10. Error Handling & Validation` (10.1–10.6)
**Requirement:** Administrator error page displays authentication failure message

> Read `openspec/changes/swhm-i-0006-administrative-operations-ma/` first — the decisions document,
> then the delta spec. **S15 governs this ticket** and explains why its six tagged checkboxes describe
> code other tickets wrote.

## Objective

Build the screen an administrator sees when sign-in fails, and prove every denial path behaves as
specified once the whole capability is assembled. After this ticket `/admin/signon-failed` renders and
`e2e/admin.spec.ts` covers the three access outcomes end to end.

## Scope boundary — read this before starting

This group's checkboxes name role validation on protected endpoints, null-session denial, invalid
request types, failed order updates, and two Java exception types. Five of those are already
implemented by the ticket that owns the route they live in — SWHM-T-0114 and SWHM-T-0117 for the
guard, SWHM-T-0119 for update failures — and the sixth (`RemoteException`, `ServiceLocatorException`)
describes a remote EJB call that does not exist in a single deployable with an embedded database. The
checkboxes carry this ticket's key because every box in a group takes that group's key, not because
the code is written here.

**Do not re-open another ticket's routes.** If you find a denial path that genuinely does not behave as
the spec says, that is a finding: raise a defect ticket and note it in your work log. It is not
licence to edit `admin/request.ts` or `auth/signon-filter.ts`.

## Design reference

- `artifacts/SWHM-S-0012/design/mockup-login-error.html` — the screen this ticket builds: the "Sign In
  Failed" heading, the message "There were errors signing you in. The user name and password you
  entered were not found in our records. Please try again.", and the "← Back to sign in" link. Copy
  verbatim.
- `artifacts/SWHM-S-0012/design/wireframe-login-error.html`, `artifacts/SWHM-S-0012/design/MANIFEST.md`.
- `src/pages/signon-failed.tsx` is the shopper-side equivalent — read it for the pattern, but this is a
  separate page with administration chrome, not a change to that one.

## Steps

1. **`/admin/signon-failed`** at `src/pages/admin/signon-failed.tsx`. The mockup's heading, message and
   back link. Not wrapped in `RequireAdmin` — someone who reaches it by definition failed to sign in.
   Render the administration header so it reads as part of the same surface; reuse `AdminShell` with a
   `null` username if that is what it takes, or the mark and title directly if `AdminShell`'s username
   slot makes no sense with nobody signed in. Do not change `AdminShell` to accommodate this — if it
   cannot render without a username, say so in your work log and render the header directly.
2. **The message is generic on purpose.** It says the username and password were not found, without
   revealing which. `POST /api/signon` already returns one `redirectTo` for every failure, so there is
   nothing to distinguish — keep it that way.
3. **The back link goes to `/admin/signon`**, which is the retry the criterion asks for. SWHM-T-0114
   already routes a failed admin sign-in here.
4. **Extend `e2e/admin.spec.ts`** — the file SWHM-T-0122 created. Add the denial paths as a second
   describe block, leaving the happy path it wrote untouched:
   - An anonymous navigation to `/admin/orders` lands on the sign-on screen rather than the table.
   - A signed-on **non-administrator** — create one through the existing sign-up flow, as
     `e2e/signon.spec.ts` does — is refused at `/admin`, and is **not** bounced to the sign-on page,
     which would loop for someone already signed on (D3).
   - Signing in at `/admin/signon` with wrong credentials lands on `/admin/signon-failed`, and the back
     link returns to `/admin/signon`.
5. **Tests.** `src/pages/admin/signon-failed.test.tsx`: the heading, the message, and the back link's
   target, located by role and accessible name. The E2E additions above are the rest.
6. **A spec you have not executed is not a test.** Implementation containers ship no Chromium, so run
   the browser-free gate locally, say so plainly in your work log, and let CI observe the browser tier
   on your branch. Do not retry the E2E preflight and do not install a browser.

## Fixed interface contracts

None of its own. Consumes `AdminShell` (SWHM-T-0115), the `/admin/signon` route (SWHM-T-0114) and
`e2e/admin.spec.ts` (SWHM-T-0122), all unchanged.

## File/module ownership

Create or modify only: `src/pages/admin/signon-failed.tsx`, `src/pages/admin/signon-failed.test.tsx`,
`e2e/admin.spec.ts` (extend only).

Nothing else. Not `admin/request.ts`, not `auth/signon-filter.ts`, not any route under
`routes/api/admin/` — see the scope boundary above.

## Definition of Done

AC-1, AC-2 and AC-3 on the ticket. AC-1 names `error.jsp`; the observable outcome that replaces it is
that a failed administrator sign-in lands on `/admin/signon-failed` showing the mockup's message.

## Gotchas

- A signed-on non-administrator must not be redirected to sign on. They authenticate again, return, and
  are denied again — a loop with nothing failing anywhere. That is the specific regression the second
  E2E case exists to catch (D3).
- `src/pages/signon-failed.tsx` already exists for shoppers. This is a second page, not an edit to it —
  a shared page defaulting its wording to one caller is a defect this codebase has shipped twice
  (ARCHITECTURE.md § Key Decisions).
- Five of this group's six checkboxes describe code you are not writing. Tagging is not ownership.
